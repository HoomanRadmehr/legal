"""Tests for contract services."""

from __future__ import annotations

import datetime as dt

import pytest
from rest_framework.exceptions import PermissionDenied

from apps.activity.models import ActivityLog, OutboxEvent
from apps.contracts.models import Contract
from apps.contracts.services import (
    ContractDateRuleError,
    contract_archive,
    contract_create,
    contract_update,
)
from apps.contracts.tests.factories import ContractFactory
from apps.matters.models import STATUS_ACTIVE, STATUS_ARCHIVED, Matter
from apps.organizations.models import ROLE_LEGAL_ADMIN, ROLE_LEGAL_COUNSEL, ROLE_VIEWER
from apps.organizations.tests.factories import MembershipFactory, OrganizationFactory
from common.api.errors import ConflictError, DomainRuleError

pytestmark = pytest.mark.django_db


def test_contract_create_writes_matter_detail_activity_and_outbox() -> None:
    organization = OrganizationFactory()
    counsel = MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL)

    contract = contract_create(actor=counsel.user, data=contract_payload())

    assert contract.matter.kind == "contract"
    assert contract.matter.organization == organization
    assert contract.matter.owner == counsel
    assert contract.counterparty == "Northwind Legal Ops"
    assert ActivityLog.objects.filter(matter=contract.matter, action="contract.created").exists()
    assert OutboxEvent.objects.filter(
        aggregate_id=contract.matter_id, event_type="contract.created"
    ).exists()


@pytest.mark.parametrize(
    "changes",
    [
        {"expiration_date": dt.date(2026, 1, 1)},
        {"renewal_date": dt.date(2026, 1, 1)},
        {"renewal_date": dt.date(2028, 1, 1)},
    ],
)
def test_contract_create_rejects_invalid_date_order(changes: dict) -> None:
    counsel = MembershipFactory(role=ROLE_LEGAL_COUNSEL)
    payload = contract_payload()
    payload.update(changes)

    with pytest.raises(ContractDateRuleError) as exc_info:
        contract_create(actor=counsel.user, data=payload)

    assert exc_info.value.status_code == 422
    assert exc_info.value.get_codes() == "contract_date_invalid"
    assert Matter.objects.count() == 0
    assert Contract.objects.count() == 0


def test_contract_create_rejects_oversized_key_terms() -> None:
    counsel = MembershipFactory(role=ROLE_LEGAL_COUNSEL)
    payload = contract_payload(key_terms={"text": "x" * 9000})

    with pytest.raises(DomainRuleError) as exc_info:
        contract_create(actor=counsel.user, data=payload)

    assert exc_info.value.get_codes() == "contract_key_terms_too_large"
    assert Matter.objects.count() == 0


def test_contract_create_reference_code_is_unique_per_organization() -> None:
    first_admin = MembershipFactory(role=ROLE_LEGAL_ADMIN)
    second_admin = MembershipFactory(role=ROLE_LEGAL_ADMIN)
    contract_create(actor=first_admin.user, data=contract_payload(reference_code="CON-001"))

    with pytest.raises(ConflictError):
        contract_create(actor=first_admin.user, data=contract_payload(reference_code="CON-001"))

    other_contract = contract_create(
        actor=second_admin.user,
        data=contract_payload(reference_code="CON-001"),
    )
    assert other_contract.matter.organization == second_admin.organization


def test_contract_create_rejects_viewer_and_unapproved_owner_assignment() -> None:
    organization = OrganizationFactory()
    counsel = MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL)
    owner = MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL)
    viewer = MembershipFactory(organization=organization, role=ROLE_VIEWER)

    with pytest.raises(PermissionDenied):
        contract_create(actor=viewer.user, data=contract_payload())
    with pytest.raises(PermissionDenied):
        contract_create(actor=counsel.user, data=contract_payload(owner_id=owner.id))


def test_contract_update_requires_expected_version_and_valid_dates() -> None:
    owner = MembershipFactory(role=ROLE_LEGAL_COUNSEL)
    contract = ContractFactory(matter__organization=owner.organization, matter__owner=owner)

    with pytest.raises(ConflictError) as exc_info:
        contract_update(
            actor=owner.user,
            contract=contract,
            data={"title": "Stale"},
            expected_version=99,
        )
    with pytest.raises(ContractDateRuleError):
        contract_update(
            actor=owner.user,
            contract=contract,
            data={"expiration_date": dt.date(2026, 1, 1)},
            expected_version=1,
        )

    updated = contract_update(
        actor=owner.user,
        contract=contract,
        data={"title": "Updated", "counterparty": "Acme Legal"},
        expected_version=1,
    )

    assert exc_info.value.get_codes() == "contract_version_conflict"
    assert updated.matter.title == "Updated"
    assert updated.counterparty == "Acme Legal"
    assert updated.matter.version == 2


def test_contract_archive_preserves_record_and_writes_activity() -> None:
    owner = MembershipFactory(role=ROLE_LEGAL_COUNSEL)
    contract = ContractFactory(matter__organization=owner.organization, matter__owner=owner)

    archived = contract_archive(actor=owner.user, contract=contract, expected_version=1)

    assert archived.matter.status == STATUS_ARCHIVED
    assert archived.matter.archived_at is not None
    assert Contract.objects.filter(matter=archived.matter).exists()
    assert ActivityLog.objects.filter(matter=archived.matter, action="matter.archived").exists()


def contract_payload(
    *,
    reference_code: str = "CON-001",
    owner_id=None,
    key_terms=None,
) -> dict:
    data = {
        "title": "Vendor services agreement",
        "reference_code": reference_code,
        "status": STATUS_ACTIVE,
        "priority": "normal",
        "description": "Initial contract notes",
        "contract_type": "vendor",
        "counterparty": "Northwind Legal Ops",
        "effective_date": dt.date(2026, 7, 14),
        "expiration_date": dt.date(2027, 7, 14),
        "renewal_date": dt.date(2027, 6, 14),
        "key_terms": {"payment": "net 30"},
    }
    if owner_id is not None:
        data["owner_id"] = owner_id
    if key_terms is not None:
        data["key_terms"] = key_terms
    return data
