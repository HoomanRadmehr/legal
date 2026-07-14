"""Tests for legal case services."""

from __future__ import annotations

import pytest
from rest_framework.exceptions import PermissionDenied

from apps.activity.models import ActivityLog, OutboxEvent
from apps.cases.models import LegalCase
from apps.cases.services import case_archive, case_create, case_update
from apps.cases.tests.factories import LegalCaseFactory
from apps.matters.models import STATUS_ARCHIVED, STATUS_OPEN, Matter
from apps.organizations.models import ROLE_LEGAL_ADMIN, ROLE_LEGAL_COUNSEL, ROLE_VIEWER
from apps.organizations.tests.factories import MembershipFactory, OrganizationFactory
from common.api.errors import ConflictError, DomainRuleError

pytestmark = pytest.mark.django_db


def test_case_create_writes_matter_detail_parties_activity_and_outbox() -> None:
    organization = OrganizationFactory()
    counsel = MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL)

    legal_case = case_create(actor=counsel.user, data=case_payload())

    assert legal_case.matter.kind == "case"
    assert legal_case.matter.organization == organization
    assert legal_case.matter.owner == counsel
    assert list(legal_case.parties.values_list("name", flat=True)) == ["Client A"]
    assert ActivityLog.objects.filter(matter=legal_case.matter, action="case.created").exists()
    assert OutboxEvent.objects.filter(
        aggregate_id=legal_case.matter_id, event_type="case.created"
    ).exists()


def test_case_create_rolls_back_on_invalid_party() -> None:
    counsel = MembershipFactory(role=ROLE_LEGAL_COUNSEL)
    payload = case_payload()
    payload["parties"] = [{"name": "", "role": "client"}]

    with pytest.raises(DomainRuleError):
        case_create(actor=counsel.user, data=payload)

    assert Matter.objects.count() == 0
    assert LegalCase.objects.count() == 0
    assert ActivityLog.objects.count() == 0
    assert OutboxEvent.objects.count() == 0


def test_case_create_reference_code_is_unique_per_organization() -> None:
    first_admin = MembershipFactory(role=ROLE_LEGAL_ADMIN)
    second_admin = MembershipFactory(role=ROLE_LEGAL_ADMIN)
    case_create(actor=first_admin.user, data=case_payload(reference_code="CASE-001"))

    with pytest.raises(ConflictError):
        case_create(actor=first_admin.user, data=case_payload(reference_code="CASE-001"))

    other_case = case_create(actor=second_admin.user, data=case_payload(reference_code="CASE-001"))
    assert other_case.matter.organization == second_admin.organization


def test_case_create_rejects_viewer_and_unapproved_owner_assignment() -> None:
    organization = OrganizationFactory()
    counsel = MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL)
    owner = MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL)
    viewer = MembershipFactory(organization=organization, role=ROLE_VIEWER)

    with pytest.raises(PermissionDenied):
        case_create(actor=viewer.user, data=case_payload())
    with pytest.raises(PermissionDenied):
        case_create(actor=counsel.user, data=case_payload(owner_id=owner.id))


def test_case_update_requires_expected_version_and_replaces_parties() -> None:
    owner = MembershipFactory(role=ROLE_LEGAL_COUNSEL)
    legal_case = LegalCaseFactory(matter__organization=owner.organization, matter__owner=owner)

    with pytest.raises(ConflictError) as exc_info:
        case_update(
            actor=owner.user,
            legal_case=legal_case,
            data={"title": "Stale", "parties": []},
            expected_version=99,
        )

    updated = case_update(
        actor=owner.user,
        legal_case=legal_case,
        data={"title": "Updated", "parties": [{"name": "New Party", "role": "client"}]},
        expected_version=1,
    )

    assert exc_info.value.get_codes() == "case_version_conflict"
    assert updated.matter.title == "Updated"
    assert updated.matter.version == 2
    assert list(updated.parties.values_list("name", flat=True)) == ["New Party"]


def test_case_archive_preserves_record_and_writes_activity() -> None:
    owner = MembershipFactory(role=ROLE_LEGAL_COUNSEL)
    legal_case = LegalCaseFactory(matter__organization=owner.organization, matter__owner=owner)

    archived = case_archive(actor=owner.user, legal_case=legal_case, expected_version=1)

    assert archived.matter.status == STATUS_ARCHIVED
    assert archived.matter.archived_at is not None
    assert LegalCase.objects.filter(matter=archived.matter).exists()
    assert ActivityLog.objects.filter(matter=archived.matter, action="matter.archived").exists()


def case_payload(*, reference_code: str = "CASE-001", owner_id=None) -> dict:
    data = {
        "title": "Employment dispute",
        "reference_code": reference_code,
        "status": STATUS_OPEN,
        "priority": "normal",
        "description": "Initial case notes",
        "case_type": "litigation",
        "court_or_authority": "District Court",
        "parties": [{"name": "Client A", "role": "client"}],
    }
    if owner_id is not None:
        data["owner_id"] = owner_id
    return data
