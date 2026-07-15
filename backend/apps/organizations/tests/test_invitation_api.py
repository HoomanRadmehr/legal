"""API tests for admin membership invitations."""

from __future__ import annotations

import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient

from apps.accounts.models import LANGUAGE_PERSIAN
from apps.accounts.tests.factories import UserFactory
from apps.activity.models import ActivityLog, OutboxEvent
from apps.organizations.models import (
    INVITATION_STATUS_PENDING,
    ROLE_LEGAL_ADMIN,
    ROLE_LEGAL_MANAGER,
    ROLE_VIEWER,
    STATUS_ACTIVE,
    Membership,
    UserInvitation,
)
from apps.organizations.tests.factories import MembershipFactory, OrganizationFactory

pytestmark = pytest.mark.django_db


def test_admin_invites_user_without_password_and_writes_audit_and_outbox() -> None:
    organization = OrganizationFactory(default_language=LANGUAGE_PERSIAN)
    admin = MembershipFactory(organization=organization, role=ROLE_LEGAL_ADMIN)
    response = authenticated_client(member=admin).post(
        reverse("memberships-list"),
        invitation_payload(email="New.User@Example.TEST", role=ROLE_LEGAL_MANAGER),
        format="json",
        HTTP_IDEMPOTENCY_KEY="11111111-1111-1111-1111-111111111111",
    )
    data = response.json()
    invited_user = get_user_model().objects.get(id=data["user_id"])
    membership = Membership.objects.get(id=data["id"])
    invitation = UserInvitation.objects.get(id=data["invitation_id"])

    assert response.status_code == 201
    assert invited_user.username == "new.user@example.test"
    assert invited_user.email == "new.user@example.test"
    assert invited_user.preferred_language == LANGUAGE_PERSIAN
    assert invited_user.is_active is False
    assert invited_user.has_usable_password() is False
    assert membership.organization == organization
    assert membership.role == ROLE_LEGAL_MANAGER
    assert membership.status == STATUS_ACTIVE
    assert invitation.status == INVITATION_STATUS_PENDING
    assert invitation.token_hash
    assert secret_material_absent()


def test_non_admin_cannot_invite_user() -> None:
    manager = MembershipFactory(role=ROLE_LEGAL_MANAGER)

    response = authenticated_client(member=manager).post(
        reverse("memberships-list"),
        invitation_payload(),
        format="json",
        HTTP_IDEMPOTENCY_KEY="22222222-2222-2222-2222-222222222222",
    )

    assert response.status_code == 403
    assert UserInvitation.objects.count() == 0


def test_invitation_rejects_password_and_organization_input() -> None:
    admin = MembershipFactory(role=ROLE_LEGAL_ADMIN)

    response = authenticated_client(member=admin).post(
        reverse("memberships-list"),
        {
            **invitation_payload(),
            "password": "secret",
            "organization_id": str(admin.organization_id),
        },
        format="json",
        HTTP_IDEMPOTENCY_KEY="33333333-3333-3333-3333-333333333333",
    )

    assert response.status_code == 400
    assert "password" in response.json()["details"]
    assert "organization_id" in response.json()["details"]
    assert get_user_model().objects.filter(username="invitee@example.test").exists() is False


def test_duplicate_email_returns_stable_conflict() -> None:
    admin = MembershipFactory(role=ROLE_LEGAL_ADMIN)
    UserFactory(username="invitee@example.test", email="invitee@example.test")

    response = authenticated_client(member=admin).post(
        reverse("memberships-list"),
        invitation_payload(email="INVITEE@example.test"),
        format="json",
        HTTP_IDEMPOTENCY_KEY="44444444-4444-4444-4444-444444444444",
    )

    assert response.status_code == 409
    assert response.json()["code"] == "user_email_conflict"
    assert UserInvitation.objects.count() == 0


def test_invitation_create_is_idempotent_for_same_request() -> None:
    admin = MembershipFactory(role=ROLE_LEGAL_ADMIN)
    client = authenticated_client(member=admin)
    payload = invitation_payload(email="replay@example.test", role=ROLE_VIEWER)

    first = client.post(
        reverse("memberships-list"),
        payload,
        format="json",
        HTTP_IDEMPOTENCY_KEY="55555555-5555-5555-5555-555555555555",
    )
    second = client.post(
        reverse("memberships-list"),
        payload,
        format="json",
        HTTP_IDEMPOTENCY_KEY="55555555-5555-5555-5555-555555555555",
    )

    assert first.status_code == 201
    assert second.status_code == 201
    assert second.json() == first.json()
    assert Membership.objects.filter(organization=admin.organization).count() == 2
    assert UserInvitation.objects.count() == 1


def test_idempotency_key_reuse_with_different_input_conflicts() -> None:
    admin = MembershipFactory(role=ROLE_LEGAL_ADMIN)
    client = authenticated_client(member=admin)
    header = "66666666-6666-6666-6666-666666666666"

    created = client.post(
        reverse("memberships-list"),
        invitation_payload(email="first@example.test"),
        format="json",
        HTTP_IDEMPOTENCY_KEY=header,
    )
    conflict = client.post(
        reverse("memberships-list"),
        invitation_payload(email="second@example.test"),
        format="json",
        HTTP_IDEMPOTENCY_KEY=header,
    )

    assert created.status_code == 201
    assert conflict.status_code == 409
    assert conflict.json()["code"] == "idempotency_key_conflict"
    assert UserInvitation.objects.count() == 1


def authenticated_client(*, member) -> APIClient:
    client = APIClient()
    client.force_authenticate(user=member.user)
    return client


def invitation_payload(
    *,
    email: str = "invitee@example.test",
    role: str = ROLE_VIEWER,
) -> dict:
    return {
        "email": email,
        "first_name": "Invited",
        "last_name": "User",
        "role": role,
    }


def secret_material_absent() -> bool:
    stored_text = f"{list(ActivityLog.objects.values())} {list(OutboxEvent.objects.values())}"
    return all(
        value not in stored_text.lower()
        for value in ("new.user@example.test", "token", "http://", "https://")
    )
