"""API tests for task endpoints."""

from __future__ import annotations

import datetime as dt

import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from apps.activity.models import ActivityLog
from apps.matters.models import ACCESS_LEVEL_VIEW
from apps.matters.tests.factories import MatterAccessFactory, MatterFactory
from apps.organizations.models import ROLE_LEGAL_ADMIN, ROLE_LEGAL_COUNSEL, ROLE_VIEWER
from apps.organizations.tests.factories import MembershipFactory, OrganizationFactory
from apps.tasks.api.v1.viewsets import TaskViewSet
from apps.tasks.models import STATUS_CANCELLED, STATUS_DONE, STATUS_TODO
from apps.tasks.tests.factories import TaskFactory

pytestmark = pytest.mark.django_db


def test_task_api_create_returns_task_and_writes_audit() -> None:
    organization = OrganizationFactory()
    admin = MembershipFactory(organization=organization, role=ROLE_LEGAL_ADMIN)
    assignee = MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL)
    matter = MatterFactory(organization=organization, owner=admin)

    response = authenticated_client(member=admin).post(
        reverse("tasks-list"),
        task_payload(matter_id=matter.id, assignee_id=assignee.id),
        format="json",
    )
    data = response.json()

    assert response.status_code == 201
    assert data["matter_id"] == str(matter.id)
    assert data["assignee_id"] == str(assignee.id)
    assert data["version"] == 1
    assert ActivityLog.objects.filter(target_id=data["id"], action="task.created").exists()


def test_task_api_list_and_retrieve_are_permission_scoped() -> None:
    matrix = create_task_visibility_matrix()

    admin_response = authenticated_client(member=matrix["admin"]).get(reverse("tasks-list"))
    counsel_response = authenticated_client(member=matrix["counsel"]).get(
        reverse("tasks-list"),
        {"view": "assigned_to_me"},
    )
    viewer_response = authenticated_client(member=matrix["viewer"]).get(reverse("tasks-list"))
    hidden_response = authenticated_client(member=matrix["other_admin"]).get(
        reverse("tasks-detail", args=[matrix["owned"].id]),
    )

    assert task_ids(admin_response) == {str(matrix["owned"].id), str(matrix["granted"].id)}
    assert task_ids(counsel_response) == {str(matrix["owned"].id)}
    assert task_ids(viewer_response) == {str(matrix["granted"].id)}
    assert hidden_response.status_code == 404


def test_task_api_filters_and_ordering_are_allowlisted() -> None:
    organization = OrganizationFactory()
    admin = MembershipFactory(organization=organization, role=ROLE_LEGAL_ADMIN)
    first = TaskFactory(
        matter__organization=organization,
        matter__owner=admin,
        assignee=admin,
        due_at=utc_datetime(2027, 7, 15, 12, 0),
    )
    second = TaskFactory(
        matter__organization=organization,
        matter__owner=admin,
        assignee=admin,
        due_at=utc_datetime(2027, 7, 16, 12, 0),
        status=STATUS_DONE,
    )
    client = authenticated_client(member=admin)

    filtered = client.get(reverse("tasks-list"), {"status": STATUS_DONE, "ordering": "-due_at"})

    assert filtered.status_code == 200
    assert task_ids(filtered) == {str(second.id)}
    assert filtered.json()["results"][0]["id"] == str(second.id)
    assert "title" not in TaskViewSet.ordering_fields
    assert "due_at" in TaskViewSet.ordering_fields
    assert first.id != second.id


def test_task_api_patch_returns_409_for_stale_version() -> None:
    owner = MembershipFactory(role=ROLE_LEGAL_COUNSEL)
    task = TaskFactory(matter__organization=owner.organization, matter__owner=owner, assignee=owner)

    response = authenticated_client(member=owner).patch(
        reverse("tasks-detail", args=[task.id]),
        {"version": 99, "title": "Too late"},
        format="json",
    )

    assert response.status_code == 409
    assert response.json()["code"] == "task_version_conflict"


def test_task_api_complete_is_idempotent() -> None:
    owner = MembershipFactory(role=ROLE_LEGAL_COUNSEL)
    complete_target = TaskFactory(
        matter__organization=owner.organization,
        matter__owner=owner,
        assignee=owner,
    )
    client = authenticated_client(member=owner)

    complete_response = client.post(
        reverse("tasks-complete", args=[complete_target.id]),
        {"version": 1},
        format="json",
    )
    complete_again = client.post(
        reverse("tasks-complete", args=[complete_target.id]),
        {"version": 1},
        format="json",
    )

    assert complete_response.status_code == 200
    assert complete_again.status_code == 200
    assert complete_again.json()["status"] == STATUS_DONE


def test_task_api_cancel_is_idempotent() -> None:
    owner = MembershipFactory(role=ROLE_LEGAL_COUNSEL)
    cancel_target = TaskFactory(
        matter__organization=owner.organization,
        matter__owner=owner,
        assignee=owner,
    )
    client = authenticated_client(member=owner)

    cancel_response = client.post(
        reverse("tasks-cancel", args=[cancel_target.id]),
        {"version": 1},
        format="json",
    )
    cancel_again = client.post(
        reverse("tasks-cancel", args=[cancel_target.id]),
        {"version": 1},
        format="json",
    )

    assert cancel_response.status_code == 200
    assert cancel_again.status_code == 200
    assert cancel_again.json()["status"] == STATUS_CANCELLED


def test_task_api_viewer_and_cross_org_user_cannot_mutate_or_infer_hidden_task() -> None:
    organization = OrganizationFactory()
    owner = MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL)
    viewer = MembershipFactory(organization=organization, role=ROLE_VIEWER)
    other_admin = MembershipFactory(role=ROLE_LEGAL_ADMIN)
    task = TaskFactory(matter__organization=organization, matter__owner=owner, assignee=owner)
    MatterAccessFactory(matter=task.matter, membership=viewer, level=ACCESS_LEVEL_VIEW)

    viewer_response = authenticated_client(member=viewer).patch(
        reverse("tasks-detail", args=[task.id]),
        {"version": 1, "title": "Viewer edit"},
        format="json",
    )
    cross_org_response = authenticated_client(member=other_admin).patch(
        reverse("tasks-detail", args=[task.id]),
        {"version": 1, "title": "Cross org edit"},
        format="json",
    )

    assert viewer_response.status_code == 403
    assert cross_org_response.status_code == 404


def test_task_api_rejects_final_status_on_create_or_update() -> None:
    owner = MembershipFactory(role=ROLE_LEGAL_COUNSEL)
    task = TaskFactory(matter__organization=owner.organization, matter__owner=owner, assignee=owner)
    client = authenticated_client(member=owner)

    create_response = client.post(
        reverse("tasks-list"),
        task_payload(matter_id=task.matter_id, assignee_id=owner.id, status=STATUS_DONE),
        format="json",
    )
    update_response = client.patch(
        reverse("tasks-detail", args=[task.id]),
        {"version": 1, "status": STATUS_DONE},
        format="json",
    )

    assert create_response.status_code == 400
    assert update_response.status_code == 400


def authenticated_client(*, member) -> APIClient:
    client = APIClient()
    client.force_authenticate(user=member.user)
    return client


def task_ids(response) -> set[str]:
    assert response.status_code == 200
    return {item["id"] for item in response.json()["results"]}


def task_payload(*, matter_id, assignee_id, status: str = STATUS_TODO) -> dict:
    return {
        "matter_id": str(matter_id),
        "title": "Review draft response",
        "description": "Check facts and proposed response.",
        "due_at": "2027-07-15T12:00:00Z",
        "assignee_id": str(assignee_id),
        "status": status,
    }


def create_task_visibility_matrix() -> dict:
    organization = OrganizationFactory()
    other_organization = OrganizationFactory()
    admin = MembershipFactory(organization=organization, role=ROLE_LEGAL_ADMIN)
    counsel = MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL)
    viewer = MembershipFactory(organization=organization, role=ROLE_VIEWER)
    other_admin = MembershipFactory(organization=other_organization, role=ROLE_LEGAL_ADMIN)
    owned = TaskFactory(matter__organization=organization, matter__owner=counsel, assignee=counsel)
    granted = TaskFactory(matter__organization=organization, matter__owner=admin, assignee=viewer)
    TaskFactory(matter__organization=other_organization, matter__owner=other_admin)
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
