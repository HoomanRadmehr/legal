"""Mutation services for deadlines."""

from __future__ import annotations

from django.db import transaction
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from rest_framework.exceptions import PermissionDenied

from apps.accounts.selectors import get_current_membership
from apps.deadlines.models import STATUS_CANCELLED, STATUS_COMPLETED, STATUS_OPEN, Deadline
from apps.matters.permissions import require_matter_edit
from apps.matters.selectors import matter_get
from apps.organizations.models import STATUS_ACTIVE as MEMBERSHIP_STATUS_ACTIVE
from apps.organizations.models import Membership
from apps.organizations.permissions import is_admin_or_manager
from common.api.errors import ConflictError, DomainRuleError
from common.services.activity import record_activity
from common.services.outbox import create_outbox_event
from common.services.versioning import require_version

ACTION_DEADLINE_CREATED = "deadline.created"
ACTION_DEADLINE_UPDATED = "deadline.updated"
ACTION_DEADLINE_COMPLETED = "deadline.completed"
ACTION_DEADLINE_CANCELLED = "deadline.cancelled"

DEADLINE_UPDATE_FIELDS = {
    "title",
    "description",
    "due_at",
    "priority",
    "reminder_enabled",
}


def deadline_create(*, actor, data: dict) -> Deadline:
    actor_membership = require_deadline_actor(actor=actor)
    matter = resolve_deadline_matter(actor=actor, actor_membership=actor_membership, data=data)
    assignee = resolve_deadline_assignee(
        actor_membership=actor_membership,
        assignee_id=data["assignee_id"],
    )
    with transaction.atomic():
        deadline = Deadline.objects.create(
            organization=actor_membership.organization,
            matter=matter,
            assignee=assignee,
            title=data["title"],
            description=data.get("description", ""),
            due_at=data["due_at"],
            priority=data["priority"],
            reminder_enabled=data.get("reminder_enabled", True),
        )
        record_deadline_activity(
            actor_membership=actor_membership,
            deadline=deadline,
            action=ACTION_DEADLINE_CREATED,
        )
        create_deadline_outbox(event_type=ACTION_DEADLINE_CREATED, deadline=deadline)
        return deadline


def deadline_update(*, actor, deadline: Deadline, data: dict, expected_version: int) -> Deadline:
    actor_membership = require_deadline_actor(actor=actor)
    with transaction.atomic():
        locked = locked_deadline(deadline=deadline)
        require_deadline_mutation(actor_membership=actor_membership, deadline=locked)
        require_deadline_open(deadline=locked)
        require_version(
            current_version=locked.version,
            expected_version=expected_version,
            conflict_code="deadline_version_conflict",
        )
        apply_deadline_update(
            actor=actor, actor_membership=actor_membership, deadline=locked, data=data
        )
        record_deadline_activity(
            actor_membership=actor_membership,
            deadline=locked,
            action=ACTION_DEADLINE_UPDATED,
        )
        create_deadline_outbox(event_type=ACTION_DEADLINE_UPDATED, deadline=locked)
        return locked


def deadline_complete(*, actor, deadline: Deadline, expected_version: int) -> Deadline:
    actor_membership = require_deadline_actor(actor=actor)
    with transaction.atomic():
        locked = locked_deadline(deadline=deadline)
        require_deadline_mutation(actor_membership=actor_membership, deadline=locked)
        if locked.status == STATUS_COMPLETED:
            return locked
        require_not_cancelled(deadline=locked)
        require_version(
            current_version=locked.version,
            expected_version=expected_version,
            conflict_code="deadline_version_conflict",
        )
        mark_deadline_completed(deadline=locked, actor_membership=actor_membership)
        return locked


def deadline_cancel(*, actor, deadline: Deadline, expected_version: int) -> Deadline:
    actor_membership = require_deadline_actor(actor=actor)
    with transaction.atomic():
        locked = locked_deadline(deadline=deadline)
        require_deadline_mutation(actor_membership=actor_membership, deadline=locked)
        if locked.status == STATUS_CANCELLED:
            return locked
        require_not_completed(deadline=locked)
        require_version(
            current_version=locked.version,
            expected_version=expected_version,
            conflict_code="deadline_version_conflict",
        )
        mark_deadline_cancelled(deadline=locked, actor_membership=actor_membership)
        return locked


def require_deadline_actor(*, actor):
    membership = get_current_membership(user=actor)
    if membership is None:
        raise PermissionDenied(_("An active organization membership is required."))
    return membership


def resolve_deadline_matter(*, actor, actor_membership, data: dict):
    matter = matter_get(
        actor=actor,
        organization=actor_membership.organization,
        matter_id=data["matter_id"],
    )
    require_matter_edit(membership=actor_membership, matter=matter)
    return matter


def resolve_deadline_assignee(*, actor_membership, assignee_id):
    if str(assignee_id) != str(actor_membership.id) and not is_admin_or_manager(
        membership=actor_membership
    ):
        raise PermissionDenied(_("Only administrators or managers may assign another member."))
    assignee = active_membership_by_id(
        organization=actor_membership.organization,
        membership_id=assignee_id,
    )
    if assignee is None:
        raise DomainRuleError(
            _("Assignee must be active in the organization."),
            code="deadline_assignee_invalid",
        )
    return assignee


def active_membership_by_id(*, organization, membership_id):
    return Membership.objects.filter(
        id=membership_id,
        organization=organization,
        status=MEMBERSHIP_STATUS_ACTIVE,
        user__is_active=True,
    ).first()


def locked_deadline(*, deadline: Deadline) -> Deadline:
    return (
        Deadline.objects.select_for_update()
        .select_related("matter", "organization", "assignee")
        .get(id=deadline.id)
    )


def require_deadline_mutation(*, actor_membership, deadline: Deadline) -> None:
    require_matter_edit(membership=actor_membership, matter=deadline.matter)


def require_deadline_open(*, deadline: Deadline) -> None:
    if deadline.status != STATUS_OPEN:
        raise ConflictError(
            _("Finalized deadlines cannot be updated."), code="deadline_state_conflict"
        )


def require_not_cancelled(*, deadline: Deadline) -> None:
    if deadline.status == STATUS_CANCELLED:
        raise ConflictError(
            _("Cancelled deadlines cannot be completed."), code="deadline_state_conflict"
        )


def require_not_completed(*, deadline: Deadline) -> None:
    if deadline.status == STATUS_COMPLETED:
        raise ConflictError(
            _("Completed deadlines cannot be cancelled."), code="deadline_state_conflict"
        )


def apply_deadline_update(*, actor, actor_membership, deadline: Deadline, data: dict) -> None:
    if "matter_id" in data:
        deadline.matter = resolve_deadline_matter(
            actor=actor,
            actor_membership=actor_membership,
            data=data,
        )
    if "assignee_id" in data:
        deadline.assignee = resolve_deadline_assignee(
            actor_membership=actor_membership,
            assignee_id=data["assignee_id"],
        )
    for field in DEADLINE_UPDATE_FIELDS:
        if field in data:
            setattr(deadline, field, data[field])
    deadline.version += 1
    deadline.save(update_fields=deadline_update_fields(data=data))


def deadline_update_fields(*, data: dict) -> list[str]:
    fields = [field for field in DEADLINE_UPDATE_FIELDS if field in data]
    if "matter_id" in data:
        fields.append("matter")
    if "assignee_id" in data:
        fields.append("assignee")
    fields.extend(["version", "updated_at"])
    return fields


def mark_deadline_completed(*, deadline: Deadline, actor_membership) -> None:
    deadline.status = STATUS_COMPLETED
    deadline.completed_at = timezone.now()
    deadline.completed_by = actor_membership
    deadline.version += 1
    deadline.save(update_fields=["status", "completed_at", "completed_by", "version", "updated_at"])
    record_deadline_activity(
        actor_membership=actor_membership,
        deadline=deadline,
        action=ACTION_DEADLINE_COMPLETED,
    )
    create_deadline_outbox(event_type=ACTION_DEADLINE_COMPLETED, deadline=deadline)


def mark_deadline_cancelled(*, deadline: Deadline, actor_membership) -> None:
    deadline.status = STATUS_CANCELLED
    deadline.cancelled_at = timezone.now()
    deadline.cancelled_by = actor_membership
    deadline.version += 1
    deadline.save(update_fields=["status", "cancelled_at", "cancelled_by", "version", "updated_at"])
    record_deadline_activity(
        actor_membership=actor_membership,
        deadline=deadline,
        action=ACTION_DEADLINE_CANCELLED,
    )
    create_deadline_outbox(event_type=ACTION_DEADLINE_CANCELLED, deadline=deadline)


def record_deadline_activity(*, actor_membership, deadline: Deadline, action: str) -> None:
    record_activity(
        organization=deadline.organization,
        matter=deadline.matter,
        actor_membership=actor_membership,
        actor_user=actor_membership.user,
        action=action,
        target_type="deadline",
        target_id=deadline.id,
        after_values=deadline_activity_values(deadline=deadline),
    )


def deadline_activity_values(*, deadline: Deadline) -> dict:
    return {
        "id": str(deadline.id),
        "matter_id": str(deadline.matter_id),
        "organization_id": str(deadline.organization_id),
        "status": deadline.status,
        "priority": deadline.priority,
        "title": deadline.title,
        "version": deadline.version,
    }


def create_deadline_outbox(*, event_type: str, deadline: Deadline) -> None:
    create_outbox_event(
        organization=deadline.organization,
        event_type=event_type,
        aggregate_type="deadline",
        aggregate_id=deadline.id,
        payload={
            "action": event_type,
            "aggregate_id": str(deadline.id),
            "aggregate_type": "deadline",
            "matter_id": str(deadline.matter_id),
            "organization_id": str(deadline.organization_id),
        },
    )
