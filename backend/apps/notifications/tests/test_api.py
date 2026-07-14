"""API tests for notification endpoints."""

from __future__ import annotations

import pytest
from rest_framework.test import APIClient

from apps.notifications.models import CHANNEL_EMAIL, CHANNEL_IN_APP, EVENT_NOTIFICATION_CREATED
from apps.notifications.tests.factories import NotificationFactory, NotificationPreferenceFactory
from apps.organizations.tests.factories import MembershipFactory

pytestmark = pytest.mark.django_db


def test_notification_list_is_recipient_scoped() -> None:
    membership = MembershipFactory()
    other_membership = MembershipFactory()
    own_notification = NotificationFactory(recipient=membership)
    NotificationFactory(recipient=other_membership)
    client = authenticated_client(user=membership.user)

    response = client.get("/api/v1/notifications/")

    assert response.status_code == 200
    assert [item["id"] for item in response.data["results"]] == [str(own_notification.id)]


def test_cannot_mark_another_user_notification_read() -> None:
    membership = MembershipFactory()
    other_membership = MembershipFactory()
    other_notification = NotificationFactory(recipient=other_membership)
    client = authenticated_client(user=membership.user)

    response = client.patch(f"/api/v1/notifications/{other_notification.id}/read/")

    assert response.status_code == 404


def test_mark_all_read_updates_only_current_recipient() -> None:
    membership = MembershipFactory()
    other_membership = MembershipFactory()
    own_notification = NotificationFactory(recipient=membership)
    other_notification = NotificationFactory(recipient=other_membership)
    client = authenticated_client(user=membership.user)

    response = client.post("/api/v1/notifications/read-all/")
    own_notification.refresh_from_db()
    other_notification.refresh_from_db()

    assert response.status_code == 200
    assert response.data == {"updated": 1}
    assert own_notification.read_at is not None
    assert other_notification.read_at is None


def test_preference_list_returns_only_own_preferences() -> None:
    membership = MembershipFactory()
    other_membership = MembershipFactory()
    own_preference = NotificationPreferenceFactory(membership=membership, channel=CHANNEL_EMAIL)
    NotificationPreferenceFactory(membership=other_membership, channel=CHANNEL_IN_APP)
    client = authenticated_client(user=membership.user)

    response = client.get("/api/v1/notification-preferences/")

    assert response.status_code == 200
    assert [item["id"] for item in response.data] == [str(own_preference.id)]


def test_replace_preferences_rejects_disabled_in_app() -> None:
    membership = MembershipFactory()
    client = authenticated_client(user=membership.user)

    response = client.put(
        "/api/v1/notification-preferences/",
        {
            "preferences": [
                {
                    "event_type": EVENT_NOTIFICATION_CREATED,
                    "channel": CHANNEL_IN_APP,
                    "reminder_offset_minutes": 0,
                    "enabled": False,
                }
            ]
        },
        format="json",
    )

    assert response.status_code == 400


def test_replace_preferences_creates_current_user_preferences() -> None:
    membership = MembershipFactory()
    client = authenticated_client(user=membership.user)

    response = client.put(
        "/api/v1/notification-preferences/",
        {
            "preferences": [
                {
                    "event_type": EVENT_NOTIFICATION_CREATED,
                    "channel": CHANNEL_EMAIL,
                    "reminder_offset_minutes": 15,
                    "enabled": False,
                }
            ]
        },
        format="json",
    )

    assert response.status_code == 200
    assert response.data[0]["channel"] == CHANNEL_EMAIL
    assert response.data[0]["reminder_offset_minutes"] == 15
    assert response.data[0]["enabled"] is False


def authenticated_client(*, user) -> APIClient:
    client = APIClient()
    client.force_authenticate(user=user)
    return client
