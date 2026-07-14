"""API tests for contract endpoints."""

from __future__ import annotations

import datetime as dt

import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from apps.activity.models import ActivityLog
from apps.contracts.tests.factories import ContractFactory
from apps.matters.models import ACCESS_LEVEL_VIEW, STATUS_ACTIVE, STATUS_ARCHIVED
from apps.matters.tests.factories import MatterAccessFactory
from apps.organizations.models import (
    ROLE_LEGAL_ADMIN,
    ROLE_LEGAL_COUNSEL,
    ROLE_VIEWER,
)
from apps.organizations.tests.factories import MembershipFactory, OrganizationFactory

pytestmark = pytest.mark.django_db


def test_contract_api_create_returns_matter_id_and_writes_audit() -> None:
    admin = MembershipFactory(role=ROLE_LEGAL_ADMIN)
    client = authenticated_client(member=admin)

    response = client.post(reverse("contracts-list"), contract_payload(), format="json")
    data = response.json()

    assert response.status_code == 201
    assert data["id"]
    assert data["reference_code"] == "CON-API-001"
    assert data["version"] == 1
    assert data["key_terms"] == {"payment": "net 30"}
    assert ActivityLog.objects.filter(target_id=data["id"], action="contract.created").exists()


def test_contract_api_invalid_date_order_returns_422_stable_error() -> None:
    admin = MembershipFactory(role=ROLE_LEGAL_ADMIN)
    payload = contract_payload(expiration_date="2026-01-01")

    response = authenticated_client(member=admin).post(
        reverse("contracts-list"),
        payload,
        format="json",
    )

    assert response.status_code == 422
    assert response.json()["code"] == "contract_date_invalid"


def test_contract_api_list_and_retrieve_are_permission_scoped() -> None:
    matrix = create_contract_visibility_matrix()

    admin_response = authenticated_client(member=matrix["admin"]).get(reverse("contracts-list"))
    counsel_response = authenticated_client(member=matrix["counsel"]).get(reverse("contracts-list"))
    viewer_response = authenticated_client(member=matrix["viewer"]).get(reverse("contracts-list"))
    hidden_response = authenticated_client(member=matrix["other_admin"]).get(
        reverse("contracts-detail", args=[matrix["owned"].matter_id])
    )

    assert contract_ids(admin_response) == {
        str(matrix["owned"].matter_id),
        str(matrix["unowned"].matter_id),
    }
    assert contract_ids(counsel_response) == {str(matrix["owned"].matter_id)}
    assert contract_ids(viewer_response) == {str(matrix["unowned"].matter_id)}
    assert hidden_response.status_code == 404


def test_contract_api_filters_search_dates_and_orders_on_allowlisted_fields() -> None:
    organization = OrganizationFactory()
    admin = MembershipFactory(organization=organization, role=ROLE_LEGAL_ADMIN)
    first = ContractFactory(
        matter__organization=organization,
        matter__owner=admin,
        matter__created_by=admin,
        matter__title="Alpha agreement",
        matter__reference_code="CON-002",
        contract_type="vendor",
        counterparty="Northwind",
        effective_date=dt.date(2026, 8, 1),
    )
    second = ContractFactory(
        matter__organization=organization,
        matter__owner=admin,
        matter__created_by=admin,
        matter__title="Beta subscription",
        matter__reference_code="CON-001",
        contract_type="service",
        counterparty="Acme",
        effective_date=dt.date(2026, 7, 1),
    )
    client = authenticated_client(member=admin)

    filtered = client.get(
        reverse("contracts-list"),
        {"search": "beta", "contract_type": "service", "effective_before": "2026-07-31"},
    )
    ordered = client.get(reverse("contracts-list"), {"ordering": "reference_code"})

    assert contract_ids(filtered) == {str(second.matter_id)}
    assert [item["id"] for item in ordered.json()["results"]] == [
        str(second.matter_id),
        str(first.matter_id),
    ]


def test_contract_api_patch_returns_409_for_stale_version() -> None:
    owner = MembershipFactory(role=ROLE_LEGAL_COUNSEL)
    contract = ContractFactory(matter__organization=owner.organization, matter__owner=owner)
    client = authenticated_client(member=owner)

    response = client.patch(
        reverse("contracts-detail", args=[contract.matter_id]),
        {"version": 99, "title": "Too late"},
        format="json",
    )

    assert response.status_code == 409
    assert response.json()["code"] == "contract_version_conflict"


def test_contract_api_archive_preserves_contract_and_timeline() -> None:
    owner = MembershipFactory(role=ROLE_LEGAL_COUNSEL)
    contract = ContractFactory(matter__organization=owner.organization, matter__owner=owner)
    client = authenticated_client(member=owner)

    archive_response = client.post(
        reverse("contracts-archive", args=[contract.matter_id]),
        {"version": 1},
        format="json",
    )
    timeline_response = client.get(reverse("contracts-timeline", args=[contract.matter_id]))

    contract.matter.refresh_from_db()
    assert archive_response.status_code == 200
    assert archive_response.json()["status"] == STATUS_ARCHIVED
    assert contract.matter.status == STATUS_ARCHIVED
    assert timeline_response.status_code == 200
    assert timeline_response.json()[0]["action"] == "matter.archived"


def test_contract_api_viewer_and_cross_org_user_cannot_mutate_or_infer_hidden_contract() -> None:
    organization = OrganizationFactory()
    owner = MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL)
    viewer = MembershipFactory(organization=organization, role=ROLE_VIEWER)
    other_admin = MembershipFactory(role=ROLE_LEGAL_ADMIN)
    contract = ContractFactory(matter__organization=organization, matter__owner=owner)
    MatterAccessFactory(matter=contract.matter, membership=viewer, level=ACCESS_LEVEL_VIEW)

    viewer_response = authenticated_client(member=viewer).patch(
        reverse("contracts-detail", args=[contract.matter_id]),
        {"version": 1, "title": "Viewer edit"},
        format="json",
    )
    cross_org_response = authenticated_client(member=other_admin).patch(
        reverse("contracts-detail", args=[contract.matter_id]),
        {"version": 1, "title": "Cross org edit"},
        format="json",
    )

    assert viewer_response.status_code == 403
    assert cross_org_response.status_code == 404


def authenticated_client(*, member) -> APIClient:
    client = APIClient()
    client.force_authenticate(user=member.user)
    return client


def contract_ids(response) -> set[str]:
    assert response.status_code == 200
    return {item["id"] for item in response.json()["results"]}


def contract_payload(
    *,
    expiration_date: str = "2027-07-14",
) -> dict:
    return {
        "title": "Vendor services agreement",
        "reference_code": "CON-API-001",
        "status": STATUS_ACTIVE,
        "priority": "normal",
        "description": "Initial contract notes",
        "contract_type": "vendor",
        "counterparty": "Northwind Legal Ops",
        "effective_date": "2026-07-14",
        "expiration_date": expiration_date,
        "renewal_date": "2027-06-14",
        "key_terms": {"payment": "net 30"},
    }


def create_contract_visibility_matrix() -> dict:
    organization = OrganizationFactory()
    other_organization = OrganizationFactory()
    admin = MembershipFactory(organization=organization, role=ROLE_LEGAL_ADMIN)
    counsel = MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL)
    viewer = MembershipFactory(organization=organization, role=ROLE_VIEWER)
    other_admin = MembershipFactory(organization=other_organization, role=ROLE_LEGAL_ADMIN)
    owned = ContractFactory(matter__organization=organization, matter__owner=counsel)
    unowned = ContractFactory(matter__organization=organization, matter__owner=admin)
    hidden = ContractFactory(matter__organization=other_organization, matter__owner=other_admin)
    MatterAccessFactory(matter=unowned.matter, membership=viewer, level=ACCESS_LEVEL_VIEW)
    return {
        "admin": admin,
        "counsel": counsel,
        "viewer": viewer,
        "other_admin": other_admin,
        "owned": owned,
        "unowned": unowned,
        "hidden": hidden,
    }
