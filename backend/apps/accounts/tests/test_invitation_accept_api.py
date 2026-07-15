"""Tests for public invitation acceptance."""

from __future__ import annotations

from datetime import timedelta
from uuid import uuid4

import pytest
from django.conf import settings
from django.core.cache import cache
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from apps.activity.models import ActivityLog, OutboxEvent
from apps.organizations.models import (
    INVITATION_STATUS_ACCEPTED,
    STATUS_ACTIVE,
    STATUS_SUSPENDED,
    UserInvitation,
)
from apps.organizations.services import (
    hash_invitation_token,
    invitation_signer,
    invitation_token_for_id,
)
from apps.organizations.tests.factories import MembershipFactory, UserInvitationFactory
from common.api.throttles import InvitationAcceptThrottle

pytestmark = pytest.mark.django_db

ACCEPT_PASSWORD = "accepted-password"


@pytest.fixture(autouse=True)
def clear_cache() -> None:
    cache.clear()


def test_accept_invitation_activates_user_without_logging_in() -> None:
    invitation = pending_invitation()
    token = invitation_token_for_id(invitation_id=invitation.id)

    response = APIClient().post(
        reverse("auth-invitations-accept"),
        accept_payload(token=token),
        format="json",
    )
    invitation.refresh_from_db()
    invitation.user.refresh_from_db()

    assert response.status_code == 200
    assert response.json() == {"status": "accepted"}
    assert settings.JWT_REFRESH_COOKIE_NAME not in response.cookies
    assert "access" not in response.json()
    assert invitation.status == INVITATION_STATUS_ACCEPTED
    assert invitation.accepted_at is not None
    assert invitation.user.is_active is True
    assert invitation.user.check_password(ACCEPT_PASSWORD) is True
    assert secret_material_absent(token=token)


def test_accepted_user_logs_in_through_normal_jwt_flow() -> None:
    invitation = pending_invitation()
    token = invitation_token_for_id(invitation_id=invitation.id)
    client = csrf_client()

    accepted = APIClient().post(
        reverse("auth-invitations-accept"),
        accept_payload(token=token),
        format="json",
    )
    login_response = client.post(
        reverse("auth-login"),
        {"username": invitation.user.username, "password": ACCEPT_PASSWORD},
        format="json",
        HTTP_X_CSRFTOKEN=csrf_token(client),
    )

    assert accepted.status_code == 200
    assert login_response.status_code == 200
    assert login_response.json()["access"]


def test_invitation_acceptance_is_one_time() -> None:
    invitation = pending_invitation()
    token = invitation_token_for_id(invitation_id=invitation.id)
    client = APIClient()

    first = client.post(
        reverse("auth-invitations-accept"), accept_payload(token=token), format="json"
    )
    second = client.post(
        reverse("auth-invitations-accept"),
        accept_payload(token=token),
        format="json",
    )

    assert first.status_code == 200
    assert second.status_code == 400
    assert second.json()["code"] == "invitation_invalid"


def test_invalid_expired_unknown_and_mismatched_invitations_share_error() -> None:
    expired = pending_invitation(expires_at=timezone.now() - timedelta(minutes=1))
    accepted = pending_invitation()
    accepted.status = INVITATION_STATUS_ACCEPTED
    accepted.accepted_at = timezone.now()
    accepted.save(update_fields=["status", "accepted_at", "updated_at"])
    unknown_token = invitation_signer().sign(str(uuid4()))
    mismatched = pending_invitation()
    UserInvitation.objects.filter(id=mismatched.id).update(token_hash="bad-hash")

    responses = [
        accept_with_token(token="not-a-valid-token"),
        accept_with_token(token=unknown_token),
        accept_with_token(token=invitation_token_for_id(invitation_id=expired.id)),
        accept_with_token(token=invitation_token_for_id(invitation_id=accepted.id)),
        accept_with_token(token=invitation_token_for_id(invitation_id=mismatched.id)),
    ]

    assert {(response.status_code, response.json()["code"]) for response in responses} == {
        (400, "invitation_invalid")
    }


def test_invitation_acceptance_requires_matching_password_confirmation() -> None:
    invitation = pending_invitation()
    token = invitation_token_for_id(invitation_id=invitation.id)

    response = APIClient().post(
        reverse("auth-invitations-accept"),
        {
            "token": token,
            "password": ACCEPT_PASSWORD,
            "password_confirm": "different-password",
        },
        format="json",
    )
    invitation.user.refresh_from_db()

    assert response.status_code == 400
    assert "password_confirm" in response.json()["details"]
    assert invitation.user.is_active is False


def test_invitation_acceptance_rejects_inactive_membership() -> None:
    invitation = pending_invitation(membership_status=STATUS_SUSPENDED)
    token = invitation_token_for_id(invitation_id=invitation.id)

    response = APIClient().post(
        reverse("auth-invitations-accept"),
        accept_payload(token=token),
        format="json",
    )
    invitation.user.refresh_from_db()

    assert response.status_code == 400
    assert response.json()["code"] == "invitation_invalid"
    assert invitation.user.is_active is False


def test_invitation_acceptance_throttle_returns_standard_429(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(InvitationAcceptThrottle, "rate", "1/min")
    first = pending_invitation()
    second = pending_invitation()
    client = APIClient()

    first_response = client.post(
        reverse("auth-invitations-accept"),
        accept_payload(token=invitation_token_for_id(invitation_id=first.id)),
        format="json",
    )
    throttled_response = client.post(
        reverse("auth-invitations-accept"),
        accept_payload(token=invitation_token_for_id(invitation_id=second.id)),
        format="json",
    )

    assert first_response.status_code == 200
    assert throttled_response.status_code == 429
    assert throttled_response.json()["code"] == "rate_limit_exceeded"
    assert int(throttled_response["Retry-After"]) > 0


def pending_invitation(*, expires_at=None, membership_status=STATUS_ACTIVE):
    membership = MembershipFactory(user__is_active=False, status=membership_status)
    invitation = UserInvitationFactory(
        membership=membership,
        user=membership.user,
        organization=membership.organization,
        expires_at=expires_at or timezone.now() + timedelta(days=1),
    )
    invitation.token_hash = hash_invitation_token(invitation_id=invitation.id)
    invitation.save(update_fields=["token_hash", "updated_at"])
    token_hash = UserInvitation._meta.get_field("token_hash")
    assert token_hash.max_length == 64
    return invitation


def accept_payload(*, token: str) -> dict:
    return {
        "token": token,
        "password": ACCEPT_PASSWORD,
        "password_confirm": ACCEPT_PASSWORD,
    }


def accept_with_token(*, token: str):
    return APIClient().post(
        reverse("auth-invitations-accept"), accept_payload(token=token), format="json"
    )


def csrf_client() -> APIClient:
    client = APIClient(enforce_csrf_checks=True)
    client.get(reverse("auth-csrf"))
    return client


def csrf_token(client: APIClient) -> str:
    return client.cookies[settings.CSRF_COOKIE_NAME].value


def secret_material_absent(*, token: str) -> bool:
    stored = f"{list(ActivityLog.objects.values())} {list(OutboxEvent.objects.values())}".lower()
    return token.lower() not in stored and ACCEPT_PASSWORD not in stored
