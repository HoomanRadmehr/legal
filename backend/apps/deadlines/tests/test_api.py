"""API tests for deadline endpoints."""

from __future__ import annotations

import datetime as dt

import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from apps.activity.models import ActivityLog
from apps.deadlines.models import STATUS_CANCELLED, STATUS_COMPLETED
from apps.deadlines.tests.factories import DeadlineFactory
from apps.matters.models import ACCESS_LEVEL_VIEW
from apps.matters.tests.factories import MatterAccessFactory, MatterFactory
from apps.organizations.models import ROLE_LEGAL_ADMIN, ROLE_LEGAL_COUNSEL, ROLE_VIEWER
from apps.organizations.tests.factories import MembershipFactory, OrganizationFactory

pytestmark = pytest.mark.django_db


def test_deadline_api_create_returns_deadline_and_writes_audit() -> None:
    organization = OrganizationFactory()
    admin = MembershipFactory(organization=organization, role=ROLE_LEGAL_ADMIN)
    assignee = MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL)
    matter = MatterFactory(organization=organization, owner=admin)

    response = authenticated_client(member=admin).post(
        reverse("deadlines-list"),
        deadline_payload(matter_id=matter.id, assignee_id=assignee.id),
        format="json",
    )
    data = response.json()

    assert response.status_code == 201
    assert data["matter_id"] == str(matter.id)
    assert data["assignee_id"] == str(assignee.id)
    assert data["version"] == 1
    assert ActivityLog.objects.filter(target_id=data["id"], action="deadline.created").exists()


def test_deadline_api_views_are_permission_scoped_and_exclude_final_statuses() -> None:
    matrix = create_deadline_visibility_matrix()

    admin_response = authenticated_client(member=matrix["admin"]).get(
        reverse("deadlines-list"),
        {"view": "upcoming"},
    )
    counsel_response = authenticated_client(member=matrix["counsel"]).get(
        reverse("deadlines-list"),
        {"view": "assigned_to_me"},
    )
    viewer_response = authenticated_client(member=matrix["viewer"]).get(
        reverse("deadlines-list"),
        {"view": "upcoming"},
    )
    hidden_response = authenticated_client(member=matrix["other_admin"]).get(
        reverse("deadlines-detail", args=[matrix["owned"].id]),
    )

    assert deadline_ids(admin_response) == {str(matrix["owned"].id), str(matrix["granted"].id)}
    assert deadline_ids(counsel_response) == {str(matrix["owned"].id)}
    assert deadline_ids(viewer_response) == {str(matrix["granted"].id)}
    assert hidden_response.status_code == 404


def test_deadline_api_filters_and_status_override_for_view() -> None:
    organization = OrganizationFactory()
    admin = MembershipFactory(organization=organization, role=ROLE_LEGAL_ADMIN)
    open_deadline = DeadlineFactory(
        matter__organization=organization,
        matter__owner=admin,
        assignee=admin,
        due_at=utc_datetime(2027, 7, 15, 12, 0),
        priority="high",
    )
    completed = DeadlineFactory(
        matter__organization=organization,
        matter__owner=admin,
        assignee=admin,
        due_at=utc_datetime(2027, 7, 15, 13, 0),
        status=STATUS_COMPLETED,
    )
    client = authenticated_client(member=admin)

    open_view = client.get(reverse("deadlines-list"), {"view": "upcoming", "priority": "high"})
    explicit_completed = client.get(
        reverse("deadlines-list"),
        {"view": "upcoming", "status": STATUS_COMPLETED},
    )

    assert deadline_ids(open_view) == {str(open_deadline.id)}
    assert deadline_ids(explicit_completed) == {str(completed.id)}


def test_deadline_api_patch_returns_409_for_stale_version() -> None:
    owner = MembershipFactory(role=ROLE_LEGAL_COUNSEL)
    deadline = DeadlineFactory(matter__organization=owner.organization, matter__owner=owner)

    response = authenticated_client(member=owner).patch(
        reverse("deadlines-detail", args=[deadline.id]),
        {"version": 99, "title": "Too late"},
        format="json",
    )

    assert response.status_code == 409
    assert response.json()["code"] == "deadline_version_conflict"


def test_deadline_api_complete_and_cancel_are_idempotent() -> None:
    owner = MembershipFactory(role=ROLE_LEGAL_COUNSEL)
    complete_target = DeadlineFactory(
        matter__organization=owner.organization,
        matter__owner=owner,
    )
    cancel_target = DeadlineFactory(
        matter__organization=owner.organization,
        matter__owner=owner,
    )
    client = authenticated_client(member=owner)

    complete_response = client.post(
        reverse("deadlines-complete", args=[complete_target.id]),
        {"version": 1},
        format="json",
    )
    complete_again = client.post(
        reverse("deadlines-complete", args=[complete_target.id]),
        {"version": 1},
        format="json",
    )
    cancel_response = client.post(
        reverse("deadlines-cancel", args=[cancel_target.id]),
        {"version": 1},
        format="json",
    )
    cancel_again = client.post(
        reverse("deadlines-cancel", args=[cancel_target.id]),
        {"version": 1},
        format="json",
    )

    assert complete_response.status_code == 200
    assert complete_again.status_code == 200
    assert complete_again.json()["status"] == STATUS_COMPLETED
    assert cancel_response.status_code == 200
    assert cancel_again.status_code == 200
    assert cancel_again.json()["status"] == STATUS_CANCELLED


def test_deadline_api_viewer_and_cross_org_user_cannot_mutate_or_infer_hidden_deadline() -> None:
    organization = OrganizationFactory()
    owner = MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL)
    viewer = MembershipFactory(organization=organization, role=ROLE_VIEWER)
    other_admin = MembershipFactory(role=ROLE_LEGAL_ADMIN)
    deadline = DeadlineFactory(matter__organization=organization, matter__owner=owner)
    MatterAccessFactory(matter=deadline.matter, membership=viewer, level=ACCESS_LEVEL_VIEW)

    viewer_response = authenticated_client(member=viewer).patch(
        reverse("deadlines-detail", args=[deadline.id]),
        {"version": 1, "title": "Viewer edit"},
        format="json",
    )
    cross_org_response = authenticated_client(member=other_admin).patch(
        reverse("deadlines-detail", args=[deadline.id]),
        {"version": 1, "title": "Cross org edit"},
        format="json",
    )

    assert viewer_response.status_code == 403
    assert cross_org_response.status_code == 404


def authenticated_client(*, member) -> APIClient:
    client = APIClient()
    client.force_authenticate(user=member.user)
    return client


def deadline_ids(response) -> set[str]:
    assert response.status_code == 200
    return {item["id"] for item in response.json()["results"]}


def deadline_payload(*, matter_id, assignee_id) -> dict:
    return {
        "matter_id": str(matter_id),
        "title": "File response",
        "description": "Prepare and file response",
        "due_at": "2027-07-15T12:00:00Z",
        "assignee_id": str(assignee_id),
        "priority": "normal",
        "reminder_enabled": True,
    }


def create_deadline_visibility_matrix() -> dict:
    organization = OrganizationFactory()
    other_organization = OrganizationFactory()
    admin = MembershipFactory(organization=organization, role=ROLE_LEGAL_ADMIN)
    counsel = MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL)
    viewer = MembershipFactory(organization=organization, role=ROLE_VIEWER)
    other_admin = MembershipFactory(organization=other_organization, role=ROLE_LEGAL_ADMIN)
    owned = DeadlineFactory(
        matter__organization=organization,
        matter__owner=counsel,
        assignee=counsel,
        due_at=utc_datetime(2027, 7, 15, 12, 0),
    )
    granted = DeadlineFactory(
        matter__organization=organization,
        matter__owner=admin,
        assignee=viewer,
        due_at=utc_datetime(2027, 7, 16, 12, 0),
    )
    DeadlineFactory(
        matter__organization=organization,
        matter__owner=admin,
        assignee=admin,
        due_at=utc_datetime(2027, 7, 18, 12, 0),
        status=STATUS_CANCELLED,
    )
    MatterAccessFactory(matter=granted.matter, membership=viewer, level=ACCESS_LEVEL_VIEW)
    return {
        "admin": admin,
        "counsel": counsel,
        "viewer": viewer,
        "other_admin": other_admin,
        "owned": owned,
        "granted": granted,
    }


def utc_datetime(year: int, month: int, day: int, hour: int, minute: int):
    return dt.datetime(year, month, day, hour, minute, tzinfo=dt.UTC)
