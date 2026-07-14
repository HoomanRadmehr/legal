"""API tests for legal case endpoints."""

from __future__ import annotations

import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from apps.activity.models import ActivityLog
from apps.cases.tests.factories import CasePartyFactory, LegalCaseFactory
from apps.matters.models import ACCESS_LEVEL_VIEW, STATUS_ARCHIVED, STATUS_OPEN
from apps.matters.tests.factories import MatterAccessFactory
from apps.organizations.models import (
    ROLE_LEGAL_ADMIN,
    ROLE_LEGAL_COUNSEL,
    ROLE_VIEWER,
)
from apps.organizations.tests.factories import MembershipFactory, OrganizationFactory

pytestmark = pytest.mark.django_db


def test_case_api_create_returns_matter_id_and_writes_audit() -> None:
    admin = MembershipFactory(role=ROLE_LEGAL_ADMIN)
    client = authenticated_client(member=admin)

    response = client.post(reverse("cases-list"), case_payload(), format="json")
    data = response.json()

    assert response.status_code == 201
    assert data["id"]
    assert data["reference_code"] == "CASE-API-001"
    assert data["version"] == 1
    assert data["parties"][0]["name"] == "Client A"
    assert ActivityLog.objects.filter(target_id=data["id"], action="case.created").exists()


def test_case_api_list_and_retrieve_are_permission_scoped() -> None:
    matrix = create_case_visibility_matrix()

    admin_response = authenticated_client(member=matrix["admin"]).get(reverse("cases-list"))
    counsel_response = authenticated_client(member=matrix["counsel"]).get(reverse("cases-list"))
    viewer_response = authenticated_client(member=matrix["viewer"]).get(reverse("cases-list"))
    hidden_response = authenticated_client(member=matrix["other_admin"]).get(
        reverse("cases-detail", args=[matrix["owned"].matter_id])
    )

    assert case_ids(admin_response) == {
        str(matrix["owned"].matter_id),
        str(matrix["unowned"].matter_id),
    }
    assert case_ids(counsel_response) == {str(matrix["owned"].matter_id)}
    assert case_ids(viewer_response) == {str(matrix["unowned"].matter_id)}
    assert hidden_response.status_code == 404


def test_case_api_filters_search_and_orders_on_allowlisted_fields() -> None:
    organization = OrganizationFactory()
    admin = MembershipFactory(organization=organization, role=ROLE_LEGAL_ADMIN)
    first = LegalCaseFactory(
        matter__organization=organization,
        matter__owner=admin,
        matter__created_by=admin,
        matter__title="Alpha dispute",
        matter__reference_code="CASE-002",
        case_type="litigation",
    )
    second = LegalCaseFactory(
        matter__organization=organization,
        matter__owner=admin,
        matter__created_by=admin,
        matter__title="Beta investigation",
        matter__reference_code="CASE-001",
        case_type="internal",
    )
    client = authenticated_client(member=admin)

    filtered = client.get(reverse("cases-list"), {"search": "beta", "case_type": "internal"})
    ordered = client.get(reverse("cases-list"), {"ordering": "reference_code"})

    assert case_ids(filtered) == {str(second.matter_id)}
    assert [item["id"] for item in ordered.json()["results"]] == [
        str(second.matter_id),
        str(first.matter_id),
    ]


def test_case_api_patch_returns_409_for_stale_version() -> None:
    owner = MembershipFactory(role=ROLE_LEGAL_COUNSEL)
    legal_case = LegalCaseFactory(matter__organization=owner.organization, matter__owner=owner)
    client = authenticated_client(member=owner)

    response = client.patch(
        reverse("cases-detail", args=[legal_case.matter_id]),
        {"version": 99, "title": "Too late"},
        format="json",
    )

    assert response.status_code == 409
    assert response.json()["code"] == "case_version_conflict"


def test_case_api_archive_preserves_case_and_timeline() -> None:
    owner = MembershipFactory(role=ROLE_LEGAL_COUNSEL)
    legal_case = LegalCaseFactory(matter__organization=owner.organization, matter__owner=owner)
    client = authenticated_client(member=owner)

    archive_response = client.post(
        reverse("cases-archive", args=[legal_case.matter_id]),
        {"version": 1},
        format="json",
    )
    timeline_response = client.get(reverse("cases-timeline", args=[legal_case.matter_id]))

    legal_case.matter.refresh_from_db()
    assert archive_response.status_code == 200
    assert archive_response.json()["status"] == STATUS_ARCHIVED
    assert legal_case.matter.status == STATUS_ARCHIVED
    assert timeline_response.status_code == 200
    assert timeline_response.json()[0]["action"] == "matter.archived"


def test_case_api_viewer_and_cross_org_user_cannot_mutate_or_infer_hidden_case() -> None:
    organization = OrganizationFactory()
    owner = MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL)
    viewer = MembershipFactory(organization=organization, role=ROLE_VIEWER)
    other_admin = MembershipFactory(role=ROLE_LEGAL_ADMIN)
    legal_case = LegalCaseFactory(matter__organization=organization, matter__owner=owner)
    MatterAccessFactory(matter=legal_case.matter, membership=viewer, level=ACCESS_LEVEL_VIEW)

    viewer_response = authenticated_client(member=viewer).patch(
        reverse("cases-detail", args=[legal_case.matter_id]),
        {"version": 1, "title": "Viewer edit"},
        format="json",
    )
    cross_org_response = authenticated_client(member=other_admin).patch(
        reverse("cases-detail", args=[legal_case.matter_id]),
        {"version": 1, "title": "Cross org edit"},
        format="json",
    )

    assert viewer_response.status_code == 403
    assert cross_org_response.status_code == 404


def authenticated_client(*, member) -> APIClient:
    client = APIClient()
    client.force_authenticate(user=member.user)
    return client


def case_ids(response) -> set[str]:
    assert response.status_code == 200
    return {item["id"] for item in response.json()["results"]}


def case_payload() -> dict:
    return {
        "title": "Employment dispute",
        "reference_code": "CASE-API-001",
        "status": STATUS_OPEN,
        "priority": "normal",
        "description": "Initial case notes",
        "case_type": "litigation",
        "court_or_authority": "District Court",
        "parties": [{"name": "Client A", "role": "client"}],
    }


def create_case_visibility_matrix() -> dict:
    organization = OrganizationFactory()
    other_organization = OrganizationFactory()
    admin = MembershipFactory(organization=organization, role=ROLE_LEGAL_ADMIN)
    counsel = MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL)
    viewer = MembershipFactory(organization=organization, role=ROLE_VIEWER)
    other_admin = MembershipFactory(organization=other_organization, role=ROLE_LEGAL_ADMIN)
    owned = LegalCaseFactory(matter__organization=organization, matter__owner=counsel)
    unowned = LegalCaseFactory(matter__organization=organization, matter__owner=admin)
    hidden = LegalCaseFactory(matter__organization=other_organization, matter__owner=other_admin)
    CasePartyFactory(case=owned)
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
