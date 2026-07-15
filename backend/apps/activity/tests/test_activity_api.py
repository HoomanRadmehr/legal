"""API tests for activity endpoints."""

from __future__ import annotations

from datetime import timedelta

import pytest
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from apps.activity.models import (
    ACTION_CASE_CREATED,
    ACTION_CASE_UPDATED,
    ACTION_CONTRACT_CREATED,
    ActivityLog,
)
from apps.activity.tests.factories import ActivityLogFactory
from apps.matters.models import ACCESS_LEVEL_VIEW
from apps.matters.tests.factories import MatterAccessFactory, MatterFactory
from apps.organizations.models import ROLE_LEGAL_ADMIN, ROLE_LEGAL_COUNSEL, ROLE_VIEWER
from apps.organizations.tests.factories import MembershipFactory, OrganizationFactory

pytestmark = pytest.mark.django_db


def test_activity_list_is_scoped_to_visible_matters() -> None:
    matrix = create_activity_visibility_matrix()

    admin_response = authenticated_client(member=matrix["admin"]).get(reverse("activity-list"))
    counsel_response = authenticated_client(member=matrix["counsel"]).get(reverse("activity-list"))
    viewer_response = authenticated_client(member=matrix["viewer"]).get(reverse("activity-list"))

    assert activity_ids(admin_response) == {
        str(matrix["owned_log"].id),
        str(matrix["hidden_log"].id),
        str(matrix["granted_log"].id),
        str(matrix["org_log"].id),
    }
    assert activity_ids(counsel_response) == {str(matrix["owned_log"].id)}
    assert activity_ids(viewer_response) == {str(matrix["granted_log"].id)}


def test_matter_timeline_returns_newest_first_and_hides_invisible_matter() -> None:
    organization = OrganizationFactory()
    owner = MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL)
    viewer = MembershipFactory(organization=organization, role=ROLE_VIEWER)
    matter = MatterFactory(organization=organization, owner=owner, created_by=owner)
    hidden = MatterFactory(organization=organization, owner=owner, created_by=owner)
    MatterAccessFactory(matter=matter, membership=viewer, level=ACCESS_LEVEL_VIEW)
    older = ActivityLogFactory(organization=organization, matter=matter, action=ACTION_CASE_CREATED)
    newer = ActivityLogFactory(organization=organization, matter=matter, action=ACTION_CASE_UPDATED)
    set_created_at(activity=older, created_at=timezone.now() - timedelta(hours=1))
    set_created_at(activity=newer, created_at=timezone.now())

    visible_response = authenticated_client(member=viewer).get(
        reverse("matter-timeline", args=[matter.id])
    )
    hidden_response = authenticated_client(member=viewer).get(
        reverse("matter-timeline", args=[hidden.id])
    )

    assert [item["id"] for item in response_items(visible_response)] == [
        str(newer.id),
        str(older.id),
    ]
    assert hidden_response.status_code == 404


def test_activity_list_filters_are_explicit_and_stable() -> None:
    organization = OrganizationFactory()
    admin = MembershipFactory(organization=organization, role=ROLE_LEGAL_ADMIN)
    matter = MatterFactory(organization=organization, owner=admin, created_by=admin)
    older = ActivityLogFactory(
        organization=organization,
        matter=matter,
        action=ACTION_CASE_CREATED,
        target_type="matter",
    )
    newer = ActivityLogFactory(
        organization=organization,
        matter=matter,
        action=ACTION_CONTRACT_CREATED,
        target_type="contract",
    )
    set_created_at(activity=older, created_at=timezone.now() - timedelta(days=1))
    set_created_at(activity=newer, created_at=timezone.now())
    client = authenticated_client(member=admin)

    ordered_response = client.get(reverse("activity-list"))
    filtered_response = client.get(
        reverse("activity-list"),
        {"action": ACTION_CASE_CREATED, "target_type": "matter", "matter": matter.id},
    )

    assert [item["id"] for item in response_items(ordered_response)] == [
        str(newer.id),
        str(older.id),
    ]
    assert activity_ids(filtered_response) == {str(older.id)}


def test_activity_api_rejects_mutation_methods() -> None:
    organization = OrganizationFactory()
    admin = MembershipFactory(organization=organization, role=ROLE_LEGAL_ADMIN)
    matter = MatterFactory(organization=organization, owner=admin, created_by=admin)
    activity = ActivityLogFactory(organization=organization, matter=matter)
    client = authenticated_client(member=admin)

    post_response = client.post(reverse("activity-list"), {"action": ACTION_CASE_CREATED})
    patch_response = client.patch(
        reverse("activity-detail", args=[activity.id]),
        {"target_type": "changed"},
        format="json",
    )
    delete_response = client.delete(reverse("activity-detail", args=[activity.id]))

    assert post_response.status_code == 405
    assert patch_response.status_code == 405
    assert delete_response.status_code == 405


def test_activity_api_redacts_sensitive_values_at_read_time() -> None:
    organization = OrganizationFactory()
    admin = MembershipFactory(organization=organization, role=ROLE_LEGAL_ADMIN)
    matter = MatterFactory(organization=organization, owner=admin, created_by=admin)
    activity = ActivityLog.objects.create(
        organization=organization,
        matter=matter,
        actor_membership=admin,
        actor_user=admin.user,
        action=ACTION_CASE_CREATED,
        target_type="matter",
        target_id=matter.id,
        before_values={"status": "draft", "password": "secret"},
        after_values={"status": "open", "document_body": "private"},
        metadata={"request_id": "req-1", "presigned_url": "https://example.test/private"},
        request_id="req-1",
    )

    response = authenticated_client(member=admin).get(
        reverse("activity-detail", args=[activity.id])
    )
    data = response.json()

    assert response.status_code == 200
    assert data["before_values"] == {"status": "draft"}
    assert data["after_values"] == {"status": "open"}
    assert data["metadata"] == {"request_id": "req-1"}


def authenticated_client(*, member) -> APIClient:
    client = APIClient()
    client.force_authenticate(user=member.user)
    return client


def response_items(response) -> list[dict]:
    assert response.status_code == 200
    return response.json()["results"]


def activity_ids(response) -> set[str]:
    return {item["id"] for item in response_items(response)}


def set_created_at(*, activity: ActivityLog, created_at) -> None:
    ActivityLog.objects.filter(id=activity.id).update(created_at=created_at)


def create_activity_visibility_matrix() -> dict:
    organization = OrganizationFactory()
    admin = MembershipFactory(organization=organization, role=ROLE_LEGAL_ADMIN)
    counsel = MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL)
    viewer = MembershipFactory(organization=organization, role=ROLE_VIEWER)
    owned = MatterFactory(organization=organization, owner=counsel, created_by=counsel)
    hidden = MatterFactory(organization=organization, owner=admin, created_by=admin)
    granted = MatterFactory(organization=organization, owner=admin, created_by=admin)
    MatterAccessFactory(matter=granted, membership=viewer, level=ACCESS_LEVEL_VIEW)
    return {
        "admin": admin,
        "counsel": counsel,
        "viewer": viewer,
        "owned_log": ActivityLogFactory(organization=organization, matter=owned),
        "hidden_log": ActivityLogFactory(organization=organization, matter=hidden),
        "granted_log": ActivityLogFactory(organization=organization, matter=granted),
        "org_log": ActivityLog.objects.create(
            organization=organization,
            actor_membership=admin,
            action=ACTION_CASE_CREATED,
            target_type="organization",
        ),
    }
