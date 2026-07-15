"""API tests for organization membership role management."""

from __future__ import annotations

import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from apps.activity.models import ActivityLog, OutboxEvent
from apps.organizations.models import (
    ROLE_LEGAL_ADMIN,
    ROLE_LEGAL_COUNSEL,
    ROLE_LEGAL_MANAGER,
    ROLE_VIEWER,
)
from apps.organizations.tests.factories import MembershipFactory, OrganizationFactory

pytestmark = pytest.mark.django_db


def test_admin_lists_current_organization_memberships_only() -> None:
    organization = OrganizationFactory()
    admin = MembershipFactory(organization=organization, role=ROLE_LEGAL_ADMIN)
    counsel = MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL)
    viewer = MembershipFactory(organization=organization, role=ROLE_VIEWER)
    other_org_member = MembershipFactory(role=ROLE_LEGAL_MANAGER)

    response = authenticated_client(member=admin).get(reverse("memberships-list"))

    assert response.status_code == 200
    result_ids = {item["id"] for item in response.json()["results"]}
    assert result_ids == {str(admin.id), str(counsel.id), str(viewer.id)}
    assert str(other_org_member.id) not in result_ids


def test_membership_choices_return_membership_ids_and_safe_user_context() -> None:
    organization = OrganizationFactory()
    admin = MembershipFactory(organization=organization, role=ROLE_LEGAL_ADMIN)
    counsel = MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL)
    viewer = MembershipFactory(organization=organization, role=ROLE_VIEWER)
    MembershipFactory(role=ROLE_LEGAL_COUNSEL)

    response = authenticated_client(member=admin).get(
        reverse("memberships-choices"), {"purpose": "owner"}
    )

    assert response.status_code == 200
    results = response.json()["results"]
    assert {item["id"] for item in results} == {str(admin.id), str(counsel.id)}
    assert str(viewer.id) not in {item["id"] for item in results}
    assert {item["user_id"] for item in results} == {str(admin.user_id), str(counsel.user_id)}
    assert all(
        set(item) == {"id", "user_id", "label", "secondary_label", "role"} for item in results
    )


def test_membership_choices_participant_search_and_offboarding_exclusion() -> None:
    organization = OrganizationFactory()
    admin = MembershipFactory(organization=organization, role=ROLE_LEGAL_ADMIN)
    viewer = MembershipFactory(organization=organization, role=ROLE_VIEWER)
    viewer.user.first_name = "Sara"
    viewer.user.last_name = "Ahmadi"
    viewer.user.email = "sara.member@example.test"
    viewer.user.save(update_fields=["first_name", "last_name", "email"])

    participant_response = authenticated_client(member=admin).get(
        reverse("memberships-choices"), {"purpose": "participant", "q": " ahmadi "}
    )
    replacement_response = authenticated_client(member=admin).get(
        reverse("memberships-choices"),
        {
            "exclude_membership_id": str(admin.id),
            "purpose": "offboarding_replacement",
        },
    )

    assert participant_response.status_code == 200
    assert [item["id"] for item in participant_response.json()["results"]] == [str(viewer.id)]
    assert replacement_response.status_code == 200
    assert str(admin.id) not in {item["id"] for item in replacement_response.json()["results"]}


def test_non_admin_cannot_list_or_change_roles() -> None:
    organization = OrganizationFactory()
    manager = MembershipFactory(organization=organization, role=ROLE_LEGAL_MANAGER)
    counsel = MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL)

    list_response = authenticated_client(member=manager).get(reverse("memberships-list"))
    change_response = authenticated_client(member=manager).post(
        reverse("memberships-change-role", args=[counsel.id]),
        {"role": ROLE_VIEWER},
        format="json",
    )

    assert list_response.status_code == 403
    assert change_response.status_code == 403
    counsel.refresh_from_db()
    assert counsel.role == ROLE_LEGAL_COUNSEL


def test_admin_changes_role_and_writes_activity_and_outbox() -> None:
    organization = OrganizationFactory()
    admin = MembershipFactory(organization=organization, role=ROLE_LEGAL_ADMIN)
    counsel = MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL)

    response = authenticated_client(member=admin).post(
        reverse("memberships-change-role", args=[counsel.id]),
        {"role": ROLE_LEGAL_MANAGER},
        format="json",
    )

    assert response.status_code == 200
    assert response.json()["role"] == ROLE_LEGAL_MANAGER
    counsel.refresh_from_db()
    assert counsel.role == ROLE_LEGAL_MANAGER
    assert_role_change_activity(membership=counsel, old_role=ROLE_LEGAL_COUNSEL)
    assert_role_change_outbox(actor=admin, membership=counsel)


def test_role_change_hides_cross_organization_membership() -> None:
    admin = MembershipFactory(role=ROLE_LEGAL_ADMIN)
    other_membership = MembershipFactory(role=ROLE_LEGAL_COUNSEL)

    response = authenticated_client(member=admin).post(
        reverse("memberships-change-role", args=[other_membership.id]),
        {"role": ROLE_VIEWER},
        format="json",
    )

    assert response.status_code == 404
    other_membership.refresh_from_db()
    assert other_membership.role == ROLE_LEGAL_COUNSEL
    assert ActivityLog.objects.count() == 0
    assert OutboxEvent.objects.count() == 0


def test_role_change_preserves_last_active_admin() -> None:
    admin = MembershipFactory(role=ROLE_LEGAL_ADMIN)

    response = authenticated_client(member=admin).post(
        reverse("memberships-change-role", args=[admin.id]),
        {"role": ROLE_VIEWER},
        format="json",
    )

    assert response.status_code == 409
    assert response.json()["code"] == "last_admin_required"
    admin.refresh_from_db()
    assert admin.role == ROLE_LEGAL_ADMIN
    assert ActivityLog.objects.count() == 0
    assert OutboxEvent.objects.count() == 0


def test_unchanged_role_does_not_write_activity_or_outbox() -> None:
    organization = OrganizationFactory()
    admin = MembershipFactory(organization=organization, role=ROLE_LEGAL_ADMIN)
    viewer = MembershipFactory(organization=organization, role=ROLE_VIEWER)

    response = authenticated_client(member=admin).post(
        reverse("memberships-change-role", args=[viewer.id]),
        {"role": ROLE_VIEWER},
        format="json",
    )

    assert response.status_code == 200
    assert response.json()["role"] == ROLE_VIEWER
    assert ActivityLog.objects.count() == 0
    assert OutboxEvent.objects.count() == 0


def test_general_membership_detail_and_patch_are_not_exposed() -> None:
    admin = MembershipFactory(role=ROLE_LEGAL_ADMIN)
    client = authenticated_client(member=admin)

    detail_response = client.get(reverse("memberships-detail", args=[admin.id]))
    patch_response = client.patch(
        reverse("memberships-detail", args=[admin.id]),
        {"role": ROLE_VIEWER},
        format="json",
    )

    assert detail_response.status_code == 405
    assert patch_response.status_code == 405


def authenticated_client(*, member) -> APIClient:
    client = APIClient()
    client.force_authenticate(user=member.user)
    return client


def assert_role_change_activity(*, membership, old_role: str) -> None:
    activity = ActivityLog.objects.get(action="membership.role_changed")
    assert activity.organization == membership.organization
    assert activity.target_type == "membership"
    assert activity.target_id == membership.id
    assert activity.before_values == {"id": str(membership.id), "role": old_role}
    assert activity.after_values == {"id": str(membership.id), "role": membership.role}


def assert_role_change_outbox(*, actor, membership) -> None:
    event = OutboxEvent.objects.get(event_type="membership.role_changed")
    assert event.organization == membership.organization
    assert event.aggregate_type == "membership"
    assert event.aggregate_id == membership.id
    assert event.payload == {
        "id": str(membership.id),
        "organization_id": str(membership.organization_id),
        "actor_id": str(actor.id),
        "target_id": str(membership.id),
        "target_type": "membership",
        "action": "membership.role_changed",
        "role": membership.role,
    }
