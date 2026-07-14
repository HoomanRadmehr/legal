"""Mutation services for matter-linked tasks."""

from __future__ import annotations

from django.db import transaction
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from rest_framework.exceptions import PermissionDenied

from apps.accounts.selectors import get_current_membership
from apps.activity.models import ACTION_TASK_COMPLETED, ACTION_TASK_CREATED
from apps.matters.permissions import require_matter_edit
from apps.matters.selectors import matter_get
from apps.organizations.models import STATUS_ACTIVE as MEMBERSHIP_STATUS_ACTIVE
from apps.organizations.models import Membership
from apps.organizations.permissions import is_admin_or_manager
from apps.tasks.models import STATUS_CANCELLED, STATUS_DONE, Task
from common.api.errors import ConflictError, DomainRuleError
from common.services.activity import record_activity
from common.services.outbox import create_outbox_event
from common.services.versioning import require_version

ACTION_TASK_UPDATED = "task.updated"
ACTION_TASK_CANCELLED = "task.cancelled"

TASK_UPDATE_FIELDS = {
    "title",
    "description",
    "due_at",
    "status",
}


def task_create(*, actor, data: dict) -> Task:
    actor_membership = require_task_actor(actor=actor)
    matter = resolve_task_matter(actor=actor, actor_membership=actor_membership, data=data)
    assignee = resolve_task_assignee(
        actor_membership=actor_membership,
        assignee_id=data["assignee_id"],
    )
    with transaction.atomic():
        task = Task.objects.create(
            organization=actor_membership.organization,
            matter=matter,
            assignee=assignee,
            title=data["title"],
            description=data.get("description", ""),
            due_at=data.get("due_at"),
            status=data["status"],
        )
        record_task_activity(
            actor_membership=actor_membership, task=task, action=ACTION_TASK_CREATED
        )
        create_task_outbox(event_type=ACTION_TASK_CREATED, task=task)
        return task


def task_update(*, actor, task: Task, data: dict, expected_version: int) -> Task:
    actor_membership = require_task_actor(actor=actor)
    with transaction.atomic():
        locked = locked_task(task=task)
        require_task_mutation(actor_membership=actor_membership, task=locked)
        require_task_open(task=locked)
        require_version(
            current_version=locked.version,
            expected_version=expected_version,
            conflict_code="task_version_conflict",
        )
        apply_task_update(actor=actor, actor_membership=actor_membership, task=locked, data=data)
        record_task_activity(
            actor_membership=actor_membership, task=locked, action=ACTION_TASK_UPDATED
        )
        create_task_outbox(event_type=ACTION_TASK_UPDATED, task=locked)
        return locked


def task_complete(*, actor, task: Task, expected_version: int) -> Task:
    actor_membership = require_task_actor(actor=actor)
    with transaction.atomic():
        locked = locked_task(task=task)
        require_task_mutation(actor_membership=actor_membership, task=locked)
        if locked.status == STATUS_DONE:
            return locked
        require_not_cancelled(task=locked)
        require_version(
            current_version=locked.version,
            expected_version=expected_version,
            conflict_code="task_version_conflict",
        )
        mark_task_completed(task=locked, actor_membership=actor_membership)
        return locked


def task_cancel(*, actor, task: Task, expected_version: int) -> Task:
    actor_membership = require_task_actor(actor=actor)
    with transaction.atomic():
        locked = locked_task(task=task)
        require_task_mutation(actor_membership=actor_membership, task=locked)
        if locked.status == STATUS_CANCELLED:
            return locked
        require_not_completed(task=locked)
        require_version(
            current_version=locked.version,
            expected_version=expected_version,
            conflict_code="task_version_conflict",
        )
        mark_task_cancelled(task=locked, actor_membership=actor_membership)
        return locked


def require_task_actor(*, actor):
    membership = get_current_membership(user=actor)
    if membership is None:
        raise PermissionDenied(_("An active organization membership is required."))
    return membership


def resolve_task_matter(*, actor, actor_membership, data: dict):
    matter = matter_get(
        actor=actor,
        organization=actor_membership.organization,
        matter_id=data["matter_id"],
    )
    require_matter_edit(membership=actor_membership, matter=matter)
    return matter


def resolve_task_assignee(*, actor_membership, assignee_id):
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
            code="task_assignee_invalid",
        )
    return assignee


def active_membership_by_id(*, organization, membership_id):
    return Membership.objects.filter(
        id=membership_id,
        organization=organization,
        status=MEMBERSHIP_STATUS_ACTIVE,
        user__is_active=True,
    ).first()


def locked_task(*, task: Task) -> Task:
    return (
        Task.objects.select_for_update()
        .select_related("matter", "organization", "assignee")
        .get(id=task.id)
    )


def require_task_mutation(*, actor_membership, task: Task) -> None:
    require_matter_edit(membership=actor_membership, matter=task.matter)


def require_task_open(*, task: Task) -> None:
    if task.status in {STATUS_DONE, STATUS_CANCELLED}:
        raise ConflictError(_("Finalized tasks cannot be updated."), code="task_state_conflict")


def require_not_cancelled(*, task: Task) -> None:
    if task.status == STATUS_CANCELLED:
        raise ConflictError(_("Cancelled tasks cannot be completed."), code="task_state_conflict")


def require_not_completed(*, task: Task) -> None:
    if task.status == STATUS_DONE:
        raise ConflictError(_("Completed tasks cannot be cancelled."), code="task_state_conflict")


def apply_task_update(*, actor, actor_membership, task: Task, data: dict) -> None:
    if "matter_id" in data:
        task.matter = resolve_task_matter(actor=actor, actor_membership=actor_membership, data=data)
    if "assignee_id" in data:
        task.assignee = resolve_task_assignee(
            actor_membership=actor_membership,
            assignee_id=data["assignee_id"],
        )
    for field in TASK_UPDATE_FIELDS:
        if field in data:
            setattr(task, field, data[field])
    task.version += 1
    task.save(update_fields=task_update_fields(data=data))


def task_update_fields(*, data: dict) -> list[str]:
    fields = [field for field in TASK_UPDATE_FIELDS if field in data]
    if "matter_id" in data:
        fields.append("matter")
    if "assignee_id" in data:
        fields.append("assignee")
    fields.extend(["version", "updated_at"])
    return fields


def mark_task_completed(*, task: Task, actor_membership) -> None:
    task.status = STATUS_DONE
    task.completed_at = timezone.now()
    task.completed_by = actor_membership
    task.version += 1
    task.save(update_fields=["status", "completed_at", "completed_by", "version", "updated_at"])
    record_task_activity(actor_membership=actor_membership, task=task, action=ACTION_TASK_COMPLETED)
    create_task_outbox(event_type=ACTION_TASK_COMPLETED, task=task)


def mark_task_cancelled(*, task: Task, actor_membership) -> None:
    task.status = STATUS_CANCELLED
    task.cancelled_at = timezone.now()
    task.cancelled_by = actor_membership
    task.version += 1
    task.save(update_fields=["status", "cancelled_at", "cancelled_by", "version", "updated_at"])
    record_task_activity(actor_membership=actor_membership, task=task, action=ACTION_TASK_CANCELLED)
    create_task_outbox(event_type=ACTION_TASK_CANCELLED, task=task)


def record_task_activity(*, actor_membership, task: Task, action: str) -> None:
    record_activity(
        organization=task.organization,
        matter=task.matter,
        actor_membership=actor_membership,
        actor_user=actor_membership.user,
        action=action,
        target_type="task",
        target_id=task.id,
        after_values=task_activity_values(task=task),
    )


def task_activity_values(*, task: Task) -> dict:
    return {
        "id": str(task.id),
        "matter_id": str(task.matter_id),
        "organization_id": str(task.organization_id),
        "status": task.status,
        "title": task.title,
        "version": task.version,
    }


def create_task_outbox(*, event_type: str, task: Task) -> None:
    create_outbox_event(
        organization=task.organization,
        event_type=event_type,
        aggregate_type="task",
        aggregate_id=task.id,
        payload={
            "action": event_type,
            "aggregate_id": str(task.id),
            "aggregate_type": "task",
            "matter_id": str(task.matter_id),
            "organization_id": str(task.organization_id),
        },
    )
