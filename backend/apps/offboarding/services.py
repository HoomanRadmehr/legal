"""Plain offboarding mutation services."""

from __future__ import annotations

from django.db import transaction
from django.db.models import F
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from rest_framework.exceptions import PermissionDenied

from apps.activity.models import ACTION_OFFBOARDING_EXECUTED
from apps.offboarding.models import OffboardingRun
from apps.offboarding.selectors import (
    active_grants,
    build_preview_snapshot,
    open_deadlines,
    open_tasks,
    owned_matters,
)
from apps.organizations.models import ROLE_LEGAL_ADMIN, STATUS_ACTIVE, STATUS_OFFBOARDED, Membership
from apps.organizations.selectors import require_membership_admin
from common.api.errors import ConflictError, DomainRuleError
from common.services.activity import record_activity
from common.services.idempotency import (
    begin_idempotency_record,
    complete_idempotency_record,
    replay_response_for_record,
    request_hash_for_payload,
)
from common.services.outbox import create_outbox_event

IDEMPOTENCY_SCOPE_OFFBOARDING_EXECUTE = "offboarding.execute"
CONFIRMATION_VALUE = "OFFBOARD"


def preview_offboarding(*, actor, data: dict) -> dict:
    actor_membership = require_membership_admin(actor=actor)
    departing = active_membership_for_offboarding(
        organization=actor_membership.organization,
        membership_id=data["departing_membership_id"],
        error_code="departing_membership_invalid",
    )
    replacement = active_membership_for_offboarding(
        organization=actor_membership.organization,
        membership_id=data["replacement_membership_id"],
        error_code="replacement_membership_invalid",
    )
    require_distinct_memberships(departing=departing, replacement=replacement)
    return build_preview_snapshot(departing=departing, replacement=replacement)


def execute_offboarding(
    *, actor, data: dict, idempotency_key: str, request_id: str = ""
) -> tuple[int, dict]:
    require_confirmation(value=data["confirmation"])
    actor_membership = require_membership_admin(actor=actor)
    request_hash = request_hash_for_payload(payload=offboarding_request_payload(data=data))
    record = begin_idempotency_record(
        organization=actor_membership.organization,
        actor_membership=actor_membership,
        scope=IDEMPOTENCY_SCOPE_OFFBOARDING_EXECUTE,
        key=idempotency_key,
        request_hash=request_hash,
    )
    replay = replay_response_for_record(record=record)
    if replay is not None:
        return replay

    preview = preview_offboarding(actor=actor, data=data)
    require_preview_fingerprint(preview=preview, submitted=data["preview_fingerprint"])
    with transaction.atomic():
        run = perform_offboarding(
            actor_membership=actor_membership,
            preview=preview,
            record=record,
            request_id=request_id,
        )
        body = offboarding_run_response(run=run)
        complete_idempotency_record(record=record, response_status=200, response_body=body)
        return 200, body


def perform_offboarding(*, actor_membership, preview: dict, record, request_id: str):
    departing_id = preview["departing"]["id"]
    replacement_id = preview["replacement"]["id"]
    departing, replacement = locked_memberships(
        departing_id=departing_id,
        replacement_id=replacement_id,
    )
    require_locked_memberships(
        actor_membership=actor_membership,
        departing=departing,
        replacement=replacement,
    )
    current_preview = build_preview_snapshot(departing=departing, replacement=replacement)
    require_preview_fingerprint(current_preview, preview["fingerprint"])
    apply_offboarding_transfer(
        departing=departing,
        replacement=replacement,
    )
    run = create_offboarding_run(
        actor_membership=actor_membership,
        departing=departing,
        replacement=replacement,
        preview=current_preview,
        record=record,
    )
    record_offboarding_activity(
        actor_membership=actor_membership,
        run=run,
        request_id=request_id,
    )
    create_offboarding_outbox(run=run, actor_membership=actor_membership)
    return run


def apply_offboarding_transfer(*, departing, replacement) -> None:
    now = timezone.now()
    transfer_owned_matters(departing=departing, replacement=replacement)
    transfer_open_tasks(departing=departing, replacement=replacement)
    transfer_open_deadlines(departing=departing, replacement=replacement)
    revoke_active_access(departing=departing, revoked_at=now)
    departing.status = STATUS_OFFBOARDED
    departing.offboarded_at = now
    departing.save(update_fields=["status", "offboarded_at", "updated_at"])


def transfer_owned_matters(*, departing, replacement) -> int:
    matters = locked_owned_matters(membership=departing)
    return matters.update(owner=replacement, version=F("version") + 1)


def transfer_open_tasks(*, departing, replacement) -> int:
    tasks = locked_open_tasks(membership=departing)
    return tasks.update(assignee=replacement, version=F("version") + 1)


def transfer_open_deadlines(*, departing, replacement) -> int:
    deadlines = locked_open_deadlines(membership=departing)
    return deadlines.update(assignee=replacement, version=F("version") + 1)


def revoke_active_access(*, departing, revoked_at) -> int:
    grants = locked_active_grants(membership=departing)
    return grants.update(revoked_at=revoked_at)


def active_membership_for_offboarding(*, organization, membership_id, error_code: str):
    membership = (
        Membership.objects.select_related("organization", "user")
        .filter(
            id=membership_id,
            organization=organization,
            status=STATUS_ACTIVE,
            user__is_active=True,
        )
        .first()
    )
    if membership is None:
        raise DomainRuleError(_("Membership must be active."), code=error_code)
    return membership


def require_locked_memberships(*, actor_membership, departing, replacement) -> None:
    if departing.organization_id != actor_membership.organization_id:
        raise PermissionDenied(_("Only legal administrators may perform this action."))
    if replacement.organization_id != actor_membership.organization_id:
        raise DomainRuleError(_("Replacement must belong to the organization."))
    if departing.status != STATUS_ACTIVE or replacement.status != STATUS_ACTIVE:
        raise DomainRuleError(_("Membership must be active."), code="inactive_membership")
    require_distinct_memberships(departing=departing, replacement=replacement)
    require_admin_remains(departing=departing, replacement=replacement)


def require_distinct_memberships(*, departing, replacement) -> None:
    if departing.id == replacement.id:
        raise DomainRuleError(
            _("Replacement must be different from departing membership."),
            code="offboarding_replacement_same_as_departing",
        )


def require_admin_remains(*, departing, replacement) -> None:
    if departing.role != ROLE_LEGAL_ADMIN or replacement.role == ROLE_LEGAL_ADMIN:
        return
    remaining_admins = Membership.objects.filter(
        organization=departing.organization,
        role=ROLE_LEGAL_ADMIN,
        status=STATUS_ACTIVE,
        user__is_active=True,
    ).exclude(id=departing.id)
    if not remaining_admins.exists():
        raise ConflictError(_("At least one active Legal Admin is required."))


def require_confirmation(*, value: str) -> None:
    if value != CONFIRMATION_VALUE:
        raise DomainRuleError(_("Confirmation value is invalid."), code="offboarding_not_confirmed")


def require_preview_fingerprint(preview: dict, submitted: str) -> None:
    if submitted != preview["fingerprint"]:
        raise ConflictError(
            _("Offboarding preview is stale."),
            code="offboarding_preview_stale",
        )


def locked_memberships(*, departing_id, replacement_id) -> tuple[Membership, Membership]:
    ids = sorted([departing_id, replacement_id])
    memberships = {
        str(member.id): member
        for member in Membership.objects.select_for_update()
        .select_related("organization", "user")
        .filter(id__in=ids)
    }
    return memberships[str(departing_id)], memberships[str(replacement_id)]


def locked_owned_matters(*, membership):
    return owned_matters(membership=membership).select_for_update()


def locked_open_tasks(*, membership):
    return open_tasks(membership=membership).select_for_update()


def locked_open_deadlines(*, membership):
    return open_deadlines(membership=membership).select_for_update()


def locked_active_grants(*, membership):
    return active_grants(membership=membership).select_for_update()


def create_offboarding_run(*, actor_membership, departing, replacement, preview, record):
    return OffboardingRun.objects.create(
        organization=actor_membership.organization,
        departing_membership=departing,
        replacement_membership=replacement,
        initiated_by=actor_membership,
        idempotency_record=record,
        preview_snapshot=preview,
        executed_at=timezone.now(),
    )


def record_offboarding_activity(*, actor_membership, run, request_id: str) -> None:
    record_activity(
        organization=run.organization,
        actor_membership=actor_membership,
        actor_user=actor_membership.user,
        action=ACTION_OFFBOARDING_EXECUTED,
        target_type="offboarding_run",
        target_id=run.id,
        after_values={
            "id": str(run.id),
            "organization_id": str(run.organization_id),
            "target_id": str(run.departing_membership_id),
            "action": ACTION_OFFBOARDING_EXECUTED,
        },
        metadata={"request_id": request_id},
        request_id=request_id,
    )


def create_offboarding_outbox(*, run, actor_membership) -> None:
    create_outbox_event(
        organization=run.organization,
        event_type=ACTION_OFFBOARDING_EXECUTED,
        aggregate_type="offboarding_run",
        aggregate_id=run.id,
        payload={
            "id": str(run.id),
            "organization_id": str(run.organization_id),
            "actor_id": str(actor_membership.id),
            "target_id": str(run.departing_membership_id),
            "target_type": "membership",
            "action": ACTION_OFFBOARDING_EXECUTED,
        },
    )


def offboarding_run_response(*, run) -> dict:
    return {
        "id": str(run.id),
        "status": run.status,
        "organization_id": str(run.organization_id),
        "departing_membership_id": str(run.departing_membership_id),
        "replacement_membership_id": str(run.replacement_membership_id),
        "preview": run.preview_snapshot,
        "executed_at": run.executed_at.isoformat().replace("+00:00", "Z"),
    }


def offboarding_request_payload(*, data: dict) -> dict:
    return {
        "departing_membership_id": str(data["departing_membership_id"]),
        "replacement_membership_id": str(data["replacement_membership_id"]),
        "preview_fingerprint": data["preview_fingerprint"],
        "confirmation": data["confirmation"],
    }
