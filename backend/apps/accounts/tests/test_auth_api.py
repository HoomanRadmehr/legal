"""Tests for JWT authentication API endpoints."""

from __future__ import annotations

import pytest
from django.conf import settings
from django.core.cache import cache
from django.urls import reverse
from django.utils import timezone
from rest_framework.parsers import JSONParser
from rest_framework.request import Request
from rest_framework.test import APIClient, APIRequestFactory

from apps.accounts.tests.factories import UserFactory
from apps.organizations.models import STATUS_SUSPENDED
from apps.organizations.tests.factories import MembershipFactory
from common.api.throttles import LoginThrottle, RefreshThrottle, WebSocketTicketThrottle
from common.auth.tickets import consume_websocket_ticket, websocket_ticket_key

pytestmark = pytest.mark.django_db

TEST_PASSWORD = "test-password"


@pytest.fixture(autouse=True)
def clear_cache() -> None:
    cache.clear()


def test_csrf_bootstrap_sets_cookie_without_identity_data() -> None:
    client = APIClient(enforce_csrf_checks=True)

    response = client.get(reverse("auth-csrf"))

    assert response.status_code == 200
    assert response.json() == {}
    assert settings.CSRF_COOKIE_NAME in client.cookies


def test_login_requires_csrf() -> None:
    user = UserFactory()
    MembershipFactory(user=user)
    client = APIClient(enforce_csrf_checks=True)

    response = client.post(
        reverse("auth-login"),
        {"username": user.username, "password": TEST_PASSWORD},
        format="json",
    )

    assert response.status_code == 403
    assert response.json()["code"] == "csrf_failed"


def test_login_returns_access_and_sets_httponly_refresh_cookie() -> None:
    user = UserFactory(first_name="Ada", last_name="Counsel")
    membership = MembershipFactory(user=user)
    client = csrf_client()

    response = client.post(
        reverse("auth-login"),
        {"username": user.username.upper(), "password": TEST_PASSWORD},
        format="json",
        HTTP_X_CSRFTOKEN=csrf_token(client),
    )

    data = response.json()
    refresh_cookie = client.cookies[settings.JWT_REFRESH_COOKIE_NAME]

    assert response.status_code == 200
    assert data["access"]
    assert "refresh" not in data
    assert data["user"] == {
        "id": str(user.id),
        "display_name": "Ada Counsel",
        "preferred_language": user.preferred_language,
    }
    assert data["membership"]["id"] == str(membership.id)
    assert data["membership"]["organization_id"] == str(membership.organization_id)
    assert refresh_cookie["httponly"] is True
    assert refresh_cookie["path"] == settings.JWT_REFRESH_COOKIE_PATH


def test_login_error_does_not_enumerate_accounts() -> None:
    user = UserFactory()
    MembershipFactory(user=user)
    client = csrf_client()

    missing_response = client.post(
        reverse("auth-login"),
        {"username": "missing@example.test", "password": "wrong"},
        format="json",
        HTTP_X_CSRFTOKEN=csrf_token(client),
    )
    wrong_password_response = client.post(
        reverse("auth-login"),
        {"username": user.username, "password": "wrong"},
        format="json",
        HTTP_X_CSRFTOKEN=csrf_token(client),
    )

    assert missing_response.status_code == 401
    assert missing_response.json()["code"] == "invalid_credentials"
    assert wrong_password_response.status_code == 401
    assert wrong_password_response.json() == missing_response.json()


def test_inactive_user_and_membership_cannot_login() -> None:
    inactive_user = UserFactory(is_active=False)
    MembershipFactory(user=inactive_user)
    suspended_member = MembershipFactory(status=STATUS_SUSPENDED)
    client = csrf_client()

    inactive_response = client.post(
        reverse("auth-login"),
        {"username": inactive_user.username, "password": TEST_PASSWORD},
        format="json",
        HTTP_X_CSRFTOKEN=csrf_token(client),
    )
    suspended_response = client.post(
        reverse("auth-login"),
        {"username": suspended_member.user.username, "password": TEST_PASSWORD},
        format="json",
        HTTP_X_CSRFTOKEN=csrf_token(client),
    )

    assert inactive_response.status_code == 401
    assert inactive_response.json()["code"] == "inactive_account"
    assert suspended_response.status_code == 401
    assert suspended_response.json()["code"] == "inactive_account"


def test_refresh_rotates_cookie_and_rejects_replay() -> None:
    user = UserFactory()
    MembershipFactory(user=user)
    client = csrf_client()
    login_response = login(client=client, username=user.username)
    old_refresh_cookie = client.cookies[settings.JWT_REFRESH_COOKIE_NAME].value

    refresh_response = client.post(
        reverse("auth-refresh"),
        {},
        format="json",
        HTTP_X_CSRFTOKEN=csrf_token(client),
    )
    new_refresh_cookie = client.cookies[settings.JWT_REFRESH_COOKIE_NAME].value

    replay_client = csrf_client()
    replay_client.cookies[settings.JWT_REFRESH_COOKIE_NAME] = old_refresh_cookie
    replay_response = replay_client.post(
        reverse("auth-refresh"),
        {},
        format="json",
        HTTP_X_CSRFTOKEN=csrf_token(replay_client),
    )

    assert login_response.status_code == 200
    assert refresh_response.status_code == 200
    assert refresh_response.json()["access"]
    assert "refresh" not in refresh_response.json()
    assert new_refresh_cookie != old_refresh_cookie
    assert replay_response.status_code == 401
    assert replay_response.json()["code"] == "refresh_invalid"


def test_refresh_requires_cookie_and_csrf() -> None:
    no_cookie_client = csrf_client()
    no_csrf_client = APIClient(enforce_csrf_checks=True)

    no_cookie_response = no_cookie_client.post(
        reverse("auth-refresh"),
        {},
        format="json",
        HTTP_X_CSRFTOKEN=csrf_token(no_cookie_client),
    )
    no_csrf_response = no_csrf_client.post(reverse("auth-refresh"), {}, format="json")

    assert no_cookie_response.status_code == 401
    assert no_cookie_response.json()["code"] == "refresh_required"
    assert no_csrf_response.status_code == 403
    assert no_csrf_response.json()["code"] == "csrf_failed"


def test_logout_clears_cookie_and_is_idempotent() -> None:
    user = UserFactory()
    MembershipFactory(user=user)
    client = csrf_client()
    login(client=client, username=user.username)

    first_response = client.post(
        reverse("auth-logout"),
        {},
        format="json",
        HTTP_X_CSRFTOKEN=csrf_token(client),
    )
    second_response = client.post(
        reverse("auth-logout"),
        {},
        format="json",
        HTTP_X_CSRFTOKEN=csrf_token(client),
    )

    assert first_response.status_code == 204
    assert second_response.status_code == 204
    assert client.cookies[settings.JWT_REFRESH_COOKIE_NAME].value == ""


def test_me_returns_current_user_and_active_membership() -> None:
    user = UserFactory(first_name="", last_name="")
    membership = MembershipFactory(user=user)
    client = csrf_client()
    login_response = login(client=client, username=user.username)

    response = client.get(
        reverse("auth-me"),
        HTTP_AUTHORIZATION=f"Bearer {login_response.json()['access']}",
    )

    assert response.status_code == 200
    assert response.json()["user"]["display_name"] == user.username
    assert response.json()["membership"]["id"] == str(membership.id)


def test_me_rejects_token_when_membership_becomes_inactive() -> None:
    member = MembershipFactory()
    client = csrf_client()
    login_response = login(client=client, username=member.user.username)
    member.status = STATUS_SUSPENDED
    member.save(update_fields=["status", "updated_at"])

    response = client.get(
        reverse("auth-me"),
        HTTP_AUTHORIZATION=f"Bearer {login_response.json()['access']}",
    )

    assert response.status_code == 401
    assert response.json()["code"] == "inactive_account"


def test_login_throttle_returns_standard_429(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(LoginThrottle, "rate", "2/min")
    user = UserFactory()
    MembershipFactory(user=user)
    client = csrf_client()

    for _ in range(2):
        response = client.post(
            reverse("auth-login"),
            {"username": user.username, "password": "wrong"},
            format="json",
            HTTP_X_CSRFTOKEN=csrf_token(client),
        )
        assert response.status_code == 401

    throttled_response = client.post(
        reverse("auth-login"),
        {"username": user.username, "password": "wrong"},
        format="json",
        HTTP_X_CSRFTOKEN=csrf_token(client),
    )

    assert throttled_response.status_code == 429
    assert throttled_response.json()["code"] == "rate_limit_exceeded"
    assert throttled_response.json()["details"]["retry_after"] > 0
    assert int(throttled_response["Retry-After"]) > 0


def test_login_throttle_key_does_not_store_raw_identifier() -> None:
    factory = APIRequestFactory()
    raw_request = factory.post(
        reverse("auth-login"),
        {"username": "Sensitive.User@example.test", "password": "wrong"},
        format="json",
        REMOTE_ADDR="203.0.113.10",
    )
    request = Request(raw_request, parsers=[JSONParser()])
    assert request.data["username"] == "Sensitive.User@example.test"

    key = LoginThrottle().get_cache_key(request, None)

    assert "Sensitive.User" not in key
    assert "example.test" not in key
    assert key.startswith("throttle:login:")


def test_refresh_throttle_returns_standard_429(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(RefreshThrottle, "rate", "1/min")
    user = UserFactory()
    MembershipFactory(user=user)
    client = csrf_client()
    login(client=client, username=user.username)

    first_response = client.post(
        reverse("auth-refresh"),
        {},
        format="json",
        HTTP_X_CSRFTOKEN=csrf_token(client),
    )
    throttled_response = client.post(
        reverse("auth-refresh"),
        {},
        format="json",
        HTTP_X_CSRFTOKEN=csrf_token(client),
    )

    assert first_response.status_code == 200
    assert throttled_response.status_code == 429
    assert throttled_response.json()["code"] == "rate_limit_exceeded"
    assert int(throttled_response["Retry-After"]) > 0


def test_websocket_ticket_is_high_entropy_and_one_time() -> None:
    member = MembershipFactory()
    client = csrf_client()
    login_response = login(client=client, username=member.user.username)
    access_token = login_response.json()["access"]
    before_request = timezone.now()

    response = client.post(
        reverse("auth-ws-ticket"),
        {},
        format="json",
        HTTP_AUTHORIZATION=f"Bearer {access_token}",
    )
    after_response = timezone.now()
    data = response.json()
    consumed = consume_websocket_ticket(ticket=data["ticket"])
    second_consume = consume_websocket_ticket(ticket=data["ticket"])

    assert response.status_code == 200
    assert len(data["ticket"]) >= 32
    assert before_request < ticket_expires_at(data["expires_at"])
    assert (ticket_expires_at(data["expires_at"]) - after_response).total_seconds() <= 60
    assert access_token not in data["ticket"]
    assert access_token not in data["websocket_url"]
    assert data["websocket_url"] == f"/ws/v1/events/?ticket={data['ticket']}"
    assert cache.get(websocket_ticket_key(ticket=data["ticket"])) is None
    assert consumed is not None
    assert consumed.user_id == str(member.user_id)
    assert consumed.organization_id == str(member.organization_id)
    assert consumed.membership_id == str(member.id)
    assert second_consume is None


def test_websocket_ticket_throttle_returns_standard_429(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(WebSocketTicketThrottle, "rate", "1/min")
    member = MembershipFactory()
    client = csrf_client()
    login_response = login(client=client, username=member.user.username)
    access_token = login_response.json()["access"]

    first_response = client.post(
        reverse("auth-ws-ticket"),
        {},
        format="json",
        HTTP_AUTHORIZATION=f"Bearer {access_token}",
    )
    throttled_response = client.post(
        reverse("auth-ws-ticket"),
        {},
        format="json",
        HTTP_AUTHORIZATION=f"Bearer {access_token}",
    )

    assert first_response.status_code == 200
    assert throttled_response.status_code == 429
    assert throttled_response.json()["code"] == "rate_limit_exceeded"


def csrf_client() -> APIClient:
    client = APIClient(enforce_csrf_checks=True)
    client.get(reverse("auth-csrf"))
    return client


def csrf_token(client: APIClient) -> str:
    return client.cookies[settings.CSRF_COOKIE_NAME].value


def login(*, client: APIClient, username: str):
    return client.post(
        reverse("auth-login"),
        {"username": username, "password": TEST_PASSWORD},
        format="json",
        HTTP_X_CSRFTOKEN=csrf_token(client),
    )


def ticket_expires_at(value: str):
    return timezone.datetime.fromisoformat(value.replace("Z", "+00:00"))
