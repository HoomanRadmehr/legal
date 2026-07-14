"""Mutation services for legal cases."""

from __future__ import annotations

from django.db import transaction
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from rest_framework.exceptions import PermissionDenied

from apps.accounts.selectors import get_current_membership
from apps.activity.models import ACTION_CASE_CREATED, ACTION_CASE_UPDATED, ACTION_MATTER_ARCHIVED
from apps.cases.models import CaseParty, LegalCase
from apps.matters.models import (
    KIND_CASE,
    STATUS_ARCHIVED,
    STATUS_OPEN,
    Matter,
)
from apps.matters.permissions import require_matter_edit
from apps.matters.services import ensure_edit_grant
from apps.organizations.models import STATUS_ACTIVE, Membership
from apps.organizations.permissions import is_admin_or_manager, is_counsel
from common.api.errors import ConflictError, DomainRuleError
from common.services.activity import record_activity
from common.services.outbox import create_outbox_event
from common.services.versioning import require_version

CASE_UPDATE_FIELDS = {
    "title",
    "reference_code",
    "status",
    "priority",
    "description",
    "opened_on",
    "closed_on",
}


def case_create(*, actor, data: dict) -> LegalCase:
    actor_membership = require_case_actor(actor=actor)
    require_case_create_permission(actor_membership=actor_membership)
    owner = resolve_case_owner(actor_membership=actor_membership, owner_id=data.get("owner_id"))

    with transaction.atomic():
        require_reference_available(
            organization=actor_membership.organization,
            reference_code=data["reference_code"],
        )
        matter = Matter.objects.create(
            organization=actor_membership.organization,
            kind=KIND_CASE,
            title=data["title"],
            reference_code=data["reference_code"],
            status=data.get("status") or STATUS_OPEN,
            priority=data["priority"],
            owner=owner,
            description=data.get("description", ""),
            opened_on=data.get("opened_on"),
            closed_on=data.get("closed_on"),
            created_by=actor_membership,
        )
        legal_case = LegalCase.objects.create(matter=matter, **case_detail_values(data=data))
        replace_case_parties(legal_case=legal_case, parties=data.get("parties", []))
        ensure_edit_grant(actor_membership=actor_membership, matter=matter, membership=owner)
        record_case_created(actor_membership=actor_membership, legal_case=legal_case)
        create_case_outbox(event_type=ACTION_CASE_CREATED, legal_case=legal_case)
        return legal_case


def case_update(*, actor, legal_case: LegalCase, data: dict, expected_version: int) -> LegalCase:
    actor_membership = require_case_actor(actor=actor)
    with transaction.atomic():
        matter = Matter.objects.select_for_update().get(id=legal_case.matter_id)
        locked_case = LegalCase.objects.select_for_update().get(matter=matter)
        require_matter_edit(membership=actor_membership, matter=matter)
        require_version(
            current_version=matter.version,
            expected_version=expected_version,
            conflict_code="case_version_conflict",
        )
        apply_case_update(actor_membership=actor_membership, legal_case=locked_case, data=data)
        record_case_updated(actor_membership=actor_membership, legal_case=locked_case)
        create_case_outbox(event_type=ACTION_CASE_UPDATED, legal_case=locked_case)
        return locked_case


def case_archive(*, actor, legal_case: LegalCase, expected_version: int) -> LegalCase:
    actor_membership = require_case_actor(actor=actor)
    with transaction.atomic():
        matter = Matter.objects.select_for_update().get(id=legal_case.matter_id)
        locked_case = LegalCase.objects.select_for_update().get(matter=matter)
        require_matter_edit(membership=actor_membership, matter=matter)
        require_version(
            current_version=matter.version,
            expected_version=expected_version,
            conflict_code="case_version_conflict",
        )
        matter.status = STATUS_ARCHIVED
        matter.archived_at = timezone.now()
        matter.archived_by = actor_membership
        matter.version += 1
        matter.save(update_fields=["status", "archived_at", "archived_by", "version", "updated_at"])
        record_case_archived(actor_membership=actor_membership, legal_case=locked_case)
        create_case_outbox(event_type=ACTION_MATTER_ARCHIVED, legal_case=locked_case)
        return locked_case


def require_case_actor(*, actor):
    membership = get_current_membership(user=actor)
    if membership is None:
        raise PermissionDenied(_("An active organization membership is required."))
    return membership


def require_case_create_permission(*, actor_membership) -> None:
    if not (
        is_admin_or_manager(membership=actor_membership) or is_counsel(membership=actor_membership)
    ):
        raise PermissionDenied(_("You do not have permission to create cases."))


def resolve_case_owner(*, actor_membership, owner_id):
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
        status=STATUS_ACTIVE,
        user__is_active=True,
    ).first()


def require_reference_available(*, organization, reference_code: str, matter_id=None) -> None:
    queryset = Matter.objects.filter(organization=organization, reference_code=reference_code)
    if matter_id is not None:
        queryset = queryset.exclude(id=matter_id)
    if queryset.exists():
        raise ConflictError(_("Reference code already exists."), code="case_reference_conflict")


def case_detail_values(*, data: dict) -> dict:
    return {
        "case_type": data["case_type"],
        "court_or_authority": data.get("court_or_authority", ""),
        "filing_date": data.get("filing_date"),
        "outcome_summary": data.get("outcome_summary", ""),
    }


def replace_case_parties(*, legal_case: LegalCase, parties: list[dict]) -> None:
    CaseParty.objects.filter(case=legal_case).delete()
    for party in parties:
        create_case_party(legal_case=legal_case, party=party)


def create_case_party(*, legal_case: LegalCase, party: dict) -> CaseParty:
    if not party.get("name") or not party.get("role"):
        raise DomainRuleError(_("Case parties require a name and role."), code="case_party_invalid")
    return CaseParty.objects.create(
        organization=legal_case.matter.organization,
        case=legal_case,
        name=party["name"],
        role=party["role"],
        contact_summary=party.get("contact_summary", ""),
    )


def apply_case_update(*, actor_membership, legal_case: LegalCase, data: dict) -> None:
    matter = legal_case.matter
    if "reference_code" in data:
        require_reference_available(
            organization=matter.organization,
            reference_code=data["reference_code"],
            matter_id=matter.id,
        )
    if "owner_id" in data:
        matter.owner = resolve_case_owner(
            actor_membership=actor_membership, owner_id=data["owner_id"]
        )
        ensure_edit_grant(actor_membership=actor_membership, matter=matter, membership=matter.owner)
    for field in CASE_UPDATE_FIELDS:
        if field in data:
            setattr(matter, field, data[field])
    for field, value in case_detail_values(
        data={**case_detail_current(legal_case), **data}
    ).items():
        setattr(legal_case, field, value)
    matter.version += 1
    matter.save(update_fields=[*CASE_UPDATE_FIELDS, "owner", "version", "updated_at"])
    legal_case.save(
        update_fields=["case_type", "court_or_authority", "filing_date", "outcome_summary"]
    )
    if "parties" in data:
        replace_case_parties(legal_case=legal_case, parties=data["parties"])


def case_detail_current(legal_case: LegalCase) -> dict:
    return {
        "case_type": legal_case.case_type,
        "court_or_authority": legal_case.court_or_authority,
        "filing_date": legal_case.filing_date,
        "outcome_summary": legal_case.outcome_summary,
    }


def record_case_created(*, actor_membership, legal_case: LegalCase) -> None:
    record_case_activity(
        actor_membership=actor_membership,
        legal_case=legal_case,
        action=ACTION_CASE_CREATED,
    )


def record_case_updated(*, actor_membership, legal_case: LegalCase) -> None:
    record_case_activity(
        actor_membership=actor_membership,
        legal_case=legal_case,
        action=ACTION_CASE_UPDATED,
    )


def record_case_archived(*, actor_membership, legal_case: LegalCase) -> None:
    record_case_activity(
        actor_membership=actor_membership,
        legal_case=legal_case,
        action=ACTION_MATTER_ARCHIVED,
    )


def record_case_activity(*, actor_membership, legal_case: LegalCase, action: str) -> None:
    matter = legal_case.matter
    record_activity(
        organization=matter.organization,
        matter=matter,
        actor_membership=actor_membership,
        actor_user=actor_membership.user,
        action=action,
        target_type="matter",
        target_id=matter.id,
        after_values={
            "matter_id": str(matter.id),
            "organization_id": str(matter.organization_id),
            "status": matter.status,
            "priority": matter.priority,
            "version": matter.version,
        },
    )


def create_case_outbox(*, event_type: str, legal_case: LegalCase) -> None:
    matter = legal_case.matter
    create_outbox_event(
        organization=matter.organization,
        event_type=event_type,
        aggregate_type="matter",
        aggregate_id=matter.id,
        payload={
            "action": event_type,
            "matter_id": str(matter.id),
            "organization_id": str(matter.organization_id),
            "aggregate_id": str(matter.id),
            "aggregate_type": "matter",
        },
    )
