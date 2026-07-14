"""Mutation services for legal notices."""

from __future__ import annotations

from zoneinfo import ZoneInfo

from django.db import transaction
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from rest_framework.exceptions import APIException, PermissionDenied

from apps.accounts.selectors import get_current_membership
from apps.activity.models import (
    ACTION_DEADLINE_CREATED,
    ACTION_MATTER_ARCHIVED,
    ACTION_NOTICE_CREATED,
    ACTION_NOTICE_RESPONSE_DEADLINE_CHANGED,
)
from apps.deadlines.models import (
    PRIORITY_NORMAL,
    STATUS_CANCELLED,
    STATUS_COMPLETED,
    STATUS_OPEN,
    Deadline,
)
from apps.matters.models import (
    KIND_NOTICE,
    RELATION_RELATED,
    STATUS_ARCHIVED,
    STATUS_RESPONSE_DUE,
    Matter,
    MatterRelation,
)
from apps.matters.permissions import require_matter_edit
from apps.matters.selectors import matter_get
from apps.matters.services import ensure_edit_grant
from apps.notices.models import (
    RESPONSE_STATUS_CANCELLED,
    RESPONSE_STATUS_PENDING,
    RESPONSE_STATUS_RESPONDED,
    LegalNotice,
)
from apps.organizations.models import STATUS_ACTIVE as MEMBERSHIP_STATUS_ACTIVE
from apps.organizations.models import Membership
from apps.organizations.permissions import is_admin_or_manager, is_counsel
from common.api.errors import ConflictError, DomainRuleError
from common.services.activity import record_activity
from common.services.outbox import create_outbox_event
from common.services.versioning import require_version

ACTION_NOTICE_UPDATED = "notice.updated"
ACTION_NOTICE_ARCHIVED = "notice.archived"
ACTION_DEADLINE_UPDATED = "deadline.updated"
ACTION_DEADLINE_CANCELLED = "deadline.cancelled"
NOTICE_UPDATE_FIELDS = {
    "title",
    "reference_code",
    "status",
    "priority",
    "description",
    "opened_on",
    "closed_on",
}


class NoticeResponseDateError(APIException):
    status_code = 422
    default_detail = _("Response deadline cannot precede received date.")
    default_code = "notice_response_date_invalid"


def notice_create(*, actor, data: dict) -> LegalNotice:
    actor_membership = require_notice_actor(actor=actor)
    require_notice_create_permission(actor_membership=actor_membership)
    owner = resolve_notice_owner(actor_membership=actor_membership, owner_id=data.get("owner_id"))
    related_matters = resolve_related_matters(
        actor=actor,
        organization=actor_membership.organization,
        related_ids=data.get("related_matter_ids", []),
    )
    validate_notice_dates(organization=actor_membership.organization, data=data)

    with transaction.atomic():
        require_reference_available(
            organization=actor_membership.organization,
            reference_code=data["reference_code"],
        )
        matter = create_notice_matter(actor_membership=actor_membership, owner=owner, data=data)
        deadline = create_response_deadline(matter=matter, assignee=owner, data=data)
        notice = LegalNotice.objects.create(
            matter=matter, linked_deadline=deadline, **notice_detail_values(data=data)
        )
        sync_created_deadline(
            actor_membership=actor_membership,
            notice=notice,
            deadline=deadline,
        )
        replace_notice_relations(notice=notice, related_matters=related_matters)
        ensure_edit_grant(actor_membership=actor_membership, matter=matter, membership=owner)
        record_notice_created(actor_membership=actor_membership, notice=notice)
        record_deadline_created(actor_membership=actor_membership, deadline=deadline)
        create_notice_outbox(event_type=ACTION_NOTICE_CREATED, notice=notice)
        create_deadline_outbox(event_type=ACTION_DEADLINE_CREATED, deadline=deadline)
        return notice


def notice_update(*, actor, notice: LegalNotice, data: dict, expected_version: int) -> LegalNotice:
    actor_membership = require_notice_actor(actor=actor)
    with transaction.atomic():
        matter = Matter.objects.select_for_update().get(id=notice.matter_id)
        locked_notice = LegalNotice.objects.select_for_update().get(matter=matter)
        deadline = Deadline.objects.select_for_update().get(id=locked_notice.linked_deadline_id)
        require_matter_edit(membership=actor_membership, matter=matter)
        require_version(
            current_version=matter.version,
            expected_version=expected_version,
            conflict_code="notice_version_conflict",
        )
        apply_notice_update(
            actor=actor,
            actor_membership=actor_membership,
            notice=locked_notice,
            deadline=deadline,
            data=data,
        )
        return locked_notice


def notice_archive(*, actor, notice: LegalNotice, expected_version: int) -> LegalNotice:
    actor_membership = require_notice_actor(actor=actor)
    with transaction.atomic():
        matter = Matter.objects.select_for_update().get(id=notice.matter_id)
        locked_notice = LegalNotice.objects.select_for_update().get(matter=matter)
        deadline = Deadline.objects.select_for_update().get(id=locked_notice.linked_deadline_id)
        require_matter_edit(membership=actor_membership, matter=matter)
        require_version(
            current_version=matter.version,
            expected_version=expected_version,
            conflict_code="notice_version_conflict",
        )
        matter.status = STATUS_ARCHIVED
        matter.archived_at = timezone.now()
        matter.archived_by = actor_membership
        matter.version += 1
        matter.save(update_fields=["status", "archived_at", "archived_by", "version", "updated_at"])
        locked_notice.response_status = RESPONSE_STATUS_CANCELLED
        locked_notice.save(update_fields=["response_status"])
        sync_deadline_final_status(deadline=deadline, actor_membership=actor_membership)
        record_notice_archived(actor_membership=actor_membership, notice=locked_notice)
        create_notice_outbox(event_type=ACTION_NOTICE_ARCHIVED, notice=locked_notice)
        return locked_notice


def require_notice_actor(*, actor):
    membership = get_current_membership(user=actor)
    if membership is None:
        raise PermissionDenied(_("An active organization membership is required."))
    return membership


def require_notice_create_permission(*, actor_membership) -> None:
    if not (
        is_admin_or_manager(membership=actor_membership) or is_counsel(membership=actor_membership)
    ):
        raise PermissionDenied(_("You do not have permission to create notices."))


def resolve_notice_owner(*, actor_membership, owner_id):
    if owner_id is None or str(owner_id) == str(actor_membership.id):
        return actor_membership
    if not is_admin_or_manager(membership=actor_membership):
        raise PermissionDenied(_("Only administrators or managers may assign another owner."))
    owner = active_membership_by_id(
        organization=actor_membership.organization, membership_id=owner_id
    )
    if owner is None:
        raise DomainRuleError(_("Owner must be active in the organization."), code="owner_invalid")
    return owner


def active_membership_by_id(*, organization, membership_id):
    return Membership.objects.filter(
        id=membership_id,
        organization=organization,
        status=MEMBERSHIP_STATUS_ACTIVE,
        user__is_active=True,
    ).first()


def resolve_related_matters(*, actor, organization, related_ids: list):
    return [
        matter_get(actor=actor, organization=organization, matter_id=matter_id)
        for matter_id in related_ids
    ]


def validate_notice_dates(*, organization, data: dict) -> None:
    received_date = data["received_date"]
    response_deadline = data["response_deadline"]
    response_local_date = local_deadline_date(
        organization=organization,
        response_deadline=response_deadline,
    )
    if response_local_date < received_date:
        raise NoticeResponseDateError()


def local_deadline_date(*, organization, response_deadline):
    organization_zone = ZoneInfo(organization.timezone)
    return response_deadline.astimezone(organization_zone).date()


def require_reference_available(*, organization, reference_code: str, matter_id=None) -> None:
    queryset = Matter.objects.filter(organization=organization, reference_code=reference_code)
    if matter_id is not None:
        queryset = queryset.exclude(id=matter_id)
    if queryset.exists():
        raise ConflictError(_("Reference code already exists."), code="notice_reference_conflict")


def create_notice_matter(*, actor_membership, owner, data: dict) -> Matter:
    return Matter.objects.create(
        organization=actor_membership.organization,
        kind=KIND_NOTICE,
        title=data["title"],
        reference_code=data["reference_code"],
        status=data.get("status") or STATUS_RESPONSE_DUE,
        priority=data["priority"],
        owner=owner,
        description=data.get("description", ""),
        opened_on=data.get("opened_on"),
        closed_on=data.get("closed_on"),
        created_by=actor_membership,
    )


def create_response_deadline(*, matter, assignee, data: dict) -> Deadline:
    return Deadline.objects.create(
        organization=matter.organization,
        matter=matter,
        assignee=assignee,
        title=response_deadline_title(matter=matter),
        description="",
        due_at=data["response_deadline"],
        priority=data.get("priority", PRIORITY_NORMAL),
        reminder_enabled=True,
    )


def notice_detail_values(*, data: dict) -> dict:
    return {
        "sender": data["sender"],
        "received_date": data["received_date"],
        "response_deadline": data["response_deadline"],
        "response_status": data.get("response_status") or RESPONSE_STATUS_PENDING,
    }


def notice_detail_current(notice: LegalNotice) -> dict:
    return {
        "sender": notice.sender,
        "received_date": notice.received_date,
        "response_deadline": notice.response_deadline,
        "response_status": notice.response_status,
    }


def sync_created_deadline(*, actor_membership, notice: LegalNotice, deadline: Deadline) -> None:
    if notice.response_status == RESPONSE_STATUS_PENDING:
        return
    sync_response_deadline(deadline=deadline, notice=notice, actor_membership=actor_membership)


def apply_notice_update(
    *, actor, actor_membership, notice: LegalNotice, deadline, data: dict
) -> None:
    matter = notice.matter
    detail_data = {**notice_detail_current(notice), **data}
    validate_notice_dates(organization=matter.organization, data=detail_data)
    if "reference_code" in data:
        require_reference_available(
            organization=matter.organization,
            reference_code=data["reference_code"],
            matter_id=matter.id,
        )
    if "owner_id" in data:
        matter.owner = resolve_notice_owner(
            actor_membership=actor_membership, owner_id=data["owner_id"]
        )
        ensure_edit_grant(actor_membership=actor_membership, matter=matter, membership=matter.owner)
    update_notice_fields(notice=notice, data=detail_data)
    update_notice_matter(matter=matter, data=data)
    sync_response_deadline(deadline=deadline, notice=notice, actor_membership=actor_membership)
    if "related_matter_ids" in data:
        related_matters = resolve_related_matters(
            actor=actor,
            organization=matter.organization,
            related_ids=data["related_matter_ids"],
        )
        replace_notice_relations(notice=notice, related_matters=related_matters)
    record_notice_updated(actor_membership=actor_membership, notice=notice, data=data)
    create_notice_outbox(event_type=notice_update_event(data=data), notice=notice)


def update_notice_fields(*, notice: LegalNotice, data: dict) -> None:
    for field, value in notice_detail_values(data=data).items():
        setattr(notice, field, value)
    notice.save(update_fields=["sender", "received_date", "response_deadline", "response_status"])


def update_notice_matter(*, matter, data: dict) -> None:
    for field in NOTICE_UPDATE_FIELDS:
        if field in data:
            setattr(matter, field, data[field])
    matter.version += 1
    matter.save(update_fields=[*NOTICE_UPDATE_FIELDS, "owner", "version", "updated_at"])


def sync_response_deadline(*, deadline: Deadline, notice: LegalNotice, actor_membership) -> None:
    deadline.title = response_deadline_title(matter=notice.matter)
    deadline.due_at = notice.response_deadline
    deadline.assignee = notice.matter.owner
    deadline.priority = notice.matter.priority
    apply_deadline_status(deadline=deadline, notice=notice, actor_membership=actor_membership)
    deadline.version += 1
    deadline.save(update_fields=deadline_sync_fields(notice=notice))
    record_deadline_synced(actor_membership=actor_membership, deadline=deadline, notice=notice)
    create_deadline_outbox(event_type=deadline_update_event(notice=notice), deadline=deadline)


def apply_deadline_status(*, deadline: Deadline, notice: LegalNotice, actor_membership) -> None:
    if notice.response_status == RESPONSE_STATUS_PENDING:
        reopen_deadline(deadline=deadline)
    if notice.response_status == RESPONSE_STATUS_RESPONDED:
        deadline.status = STATUS_COMPLETED
        deadline.completed_at = deadline.completed_at or timezone.now()
        deadline.completed_by = deadline.completed_by or actor_membership
    if notice.response_status == RESPONSE_STATUS_CANCELLED:
        deadline.status = STATUS_CANCELLED
        deadline.cancelled_at = deadline.cancelled_at or timezone.now()
        deadline.cancelled_by = deadline.cancelled_by or actor_membership


def reopen_deadline(*, deadline: Deadline) -> None:
    deadline.status = STATUS_OPEN
    deadline.completed_at = None
    deadline.completed_by = None
    deadline.cancelled_at = None
    deadline.cancelled_by = None


def deadline_sync_fields(*, notice: LegalNotice) -> list[str]:
    fields = ["title", "due_at", "assignee", "priority", "status", "version", "updated_at"]
    if notice.response_status == RESPONSE_STATUS_PENDING:
        return [*fields, "completed_at", "completed_by", "cancelled_at", "cancelled_by"]
    if notice.response_status == RESPONSE_STATUS_RESPONDED:
        return [*fields, "completed_at", "completed_by"]
    return [*fields, "cancelled_at", "cancelled_by"]


def sync_deadline_final_status(*, deadline: Deadline, actor_membership) -> None:
    deadline.status = STATUS_CANCELLED
    deadline.cancelled_at = deadline.cancelled_at or timezone.now()
    deadline.cancelled_by = deadline.cancelled_by or actor_membership
    deadline.version += 1
    deadline.save(update_fields=["status", "cancelled_at", "cancelled_by", "version", "updated_at"])
    record_deadline_cancelled(actor_membership=actor_membership, deadline=deadline)
    create_deadline_outbox(event_type=ACTION_DEADLINE_CANCELLED, deadline=deadline)


def replace_notice_relations(*, notice: LegalNotice, related_matters: list) -> None:
    MatterRelation.objects.filter(source=notice.matter, relation_type=RELATION_RELATED).delete()
    for matter in related_matters:
        if matter.id == notice.matter_id:
            raise DomainRuleError(
                _("A notice cannot relate to itself."), code="notice_relation_invalid"
            )
        MatterRelation.objects.create(
            organization=notice.matter.organization,
            source=notice.matter,
            target=matter,
            relation_type=RELATION_RELATED,
        )


def response_deadline_title(*, matter) -> str:
    return f"Response deadline: {matter.title}"


def notice_update_event(*, data: dict) -> str:
    if "response_deadline" in data or "response_status" in data:
        return ACTION_NOTICE_RESPONSE_DEADLINE_CHANGED
    return ACTION_NOTICE_UPDATED


def deadline_update_event(*, notice: LegalNotice) -> str:
    if notice.response_status == RESPONSE_STATUS_CANCELLED:
        return ACTION_DEADLINE_CANCELLED
    return ACTION_DEADLINE_UPDATED


def record_notice_created(*, actor_membership, notice: LegalNotice) -> None:
    record_notice_activity(
        actor_membership=actor_membership,
        notice=notice,
        action=ACTION_NOTICE_CREATED,
    )


def record_notice_updated(*, actor_membership, notice: LegalNotice, data: dict) -> None:
    record_notice_activity(
        actor_membership=actor_membership,
        notice=notice,
        action=notice_update_event(data=data),
    )


def record_notice_archived(*, actor_membership, notice: LegalNotice) -> None:
    record_notice_activity(
        actor_membership=actor_membership,
        notice=notice,
        action=ACTION_MATTER_ARCHIVED,
    )


def record_notice_activity(*, actor_membership, notice: LegalNotice, action: str) -> None:
    record_activity(
        organization=notice.matter.organization,
        matter=notice.matter,
        actor_membership=actor_membership,
        actor_user=actor_membership.user,
        action=action,
        target_type="matter",
        target_id=notice.matter_id,
        after_values=notice_activity_values(notice=notice),
    )


def notice_activity_values(*, notice: LegalNotice) -> dict:
    return {
        "matter_id": str(notice.matter_id),
        "organization_id": str(notice.matter.organization_id),
        "status": notice.matter.status,
        "priority": notice.matter.priority,
        "version": notice.matter.version,
    }


def record_deadline_created(*, actor_membership, deadline: Deadline) -> None:
    record_deadline_activity(
        actor_membership=actor_membership,
        deadline=deadline,
        action=ACTION_DEADLINE_CREATED,
    )


def record_deadline_synced(*, actor_membership, deadline: Deadline, notice: LegalNotice) -> None:
    record_deadline_activity(
        actor_membership=actor_membership,
        deadline=deadline,
        action=deadline_update_event(notice=notice),
    )


def record_deadline_cancelled(*, actor_membership, deadline: Deadline) -> None:
    record_deadline_activity(
        actor_membership=actor_membership,
        deadline=deadline,
        action=ACTION_DEADLINE_CANCELLED,
    )


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


def create_notice_outbox(*, event_type: str, notice: LegalNotice) -> None:
    create_outbox_event(
        organization=notice.matter.organization,
        event_type=event_type,
        aggregate_type="matter",
        aggregate_id=notice.matter_id,
        payload={
            "action": event_type,
            "matter_id": str(notice.matter_id),
            "organization_id": str(notice.matter.organization_id),
            "aggregate_id": str(notice.matter_id),
            "aggregate_type": "matter",
        },
    )


def create_deadline_outbox(*, event_type: str, deadline: Deadline) -> None:
    create_outbox_event(
        organization=deadline.organization,
        event_type=event_type,
        aggregate_type="deadline",
        aggregate_id=deadline.id,
        payload={
            "action": event_type,
            "matter_id": str(deadline.matter_id),
            "organization_id": str(deadline.organization_id),
            "aggregate_id": str(deadline.id),
            "aggregate_type": "deadline",
        },
    )
