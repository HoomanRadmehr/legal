"""Tests for notification services."""

from __future__ import annotations

import pytest
from django.db import transaction

from apps.notifications.models import (
    CHANNEL_EMAIL,
    CHANNEL_IN_APP,
    CHANNEL_PUSH,
    CHANNEL_SMS,
    DELIVERY_STATUS_PENDING,
    DELIVERY_STATUS_SENT,
    DELIVERY_STATUS_SKIPPED,
    ERROR_CHANNEL_DISABLED,
    ERROR_PROVIDER_UNCONFIGURED,
    EVENT_NOTIFICATION_CREATED,
    NotificationPreference,
)
from apps.notifications.services import (
    create_notification,
    publish_notification_created,
    replace_own_preferences,
    safe_notification_data,
    send_delivery,
)
from apps.notifications.tests.factories import NotificationDeliveryFactory, NotificationFactory
from apps.organizations.tests.factories import MembershipFactory

pytestmark = pytest.mark.django_db


def test_replace_own_preferences_writes_only_actor_membership() -> None:
    actor_membership = MembershipFactory()
    other_membership = MembershipFactory()
    NotificationPreference.objects.create(
        membership=other_membership,
        event_type=EVENT_NOTIFICATION_CREATED,
        channel=CHANNEL_EMAIL,
        enabled=False,
    )

    preferences = replace_own_preferences(
        actor=actor_membership.user,
        preferences=[
            {
                "event_type": EVENT_NOTIFICATION_CREATED,
                "channel": CHANNEL_EMAIL,
                "reminder_offset_minutes": 0,
                "enabled": False,
            }
        ],
    )

    assert [preference.membership for preference in preferences] == [actor_membership]
    assert NotificationPreference.objects.filter(membership=other_membership).count() == 1


def test_create_notification_records_truthful_delivery_statuses() -> None:
    recipient = MembershipFactory()
    NotificationPreference.objects.create(
        membership=recipient,
        event_type=EVENT_NOTIFICATION_CREATED,
        channel=CHANNEL_EMAIL,
        enabled=False,
    )
    NotificationPreference.objects.create(
        membership=recipient,
        event_type=EVENT_NOTIFICATION_CREATED,
        channel=CHANNEL_SMS,
        enabled=True,
    )

    notification = create_notification(
        recipient=recipient,
        event_type=EVENT_NOTIFICATION_CREATED,
        title="Review needed",
        body="Please review.",
        data={"token": "secret", "task_id": recipient.id},
        dedupe_key="event:1",
    )

    deliveries = {delivery.channel: delivery for delivery in notification.deliveries.all()}
    assert deliveries[CHANNEL_IN_APP].status == DELIVERY_STATUS_PENDING
    assert deliveries[CHANNEL_EMAIL].safe_error_code == ERROR_CHANNEL_DISABLED
    assert deliveries[CHANNEL_SMS].status == DELIVERY_STATUS_PENDING
    assert deliveries[CHANNEL_PUSH].safe_error_code == ERROR_CHANNEL_DISABLED
    assert notification.data == {"task_id": str(recipient.id)}


def test_duplicate_delivery_intent_is_blocked() -> None:
    recipient = MembershipFactory()
    create_notification(
        recipient=recipient,
        event_type=EVENT_NOTIFICATION_CREATED,
        title="One",
        dedupe_key="duplicate-event",
    )

    with pytest.raises(Exception) as error:
        create_notification(
            recipient=recipient,
            event_type=EVENT_NOTIFICATION_CREATED,
            title="Two",
            dedupe_key="duplicate-event",
        )

    assert "delivery_duplicate" in str(error.value.get_codes())


def test_unconfigured_sms_and_push_are_skipped_with_safe_code() -> None:
    sms_delivery = NotificationDeliveryFactory(channel=CHANNEL_SMS)
    push_delivery = NotificationDeliveryFactory(channel=CHANNEL_PUSH)

    assert send_delivery(delivery=sms_delivery) == DELIVERY_STATUS_SKIPPED
    assert send_delivery(delivery=push_delivery) == DELIVERY_STATUS_SKIPPED

    sms_delivery.refresh_from_db()
    push_delivery.refresh_from_db()
    assert sms_delivery.safe_error_code == ERROR_PROVIDER_UNCONFIGURED
    assert push_delivery.safe_error_code == ERROR_PROVIDER_UNCONFIGURED


def test_in_app_delivery_marks_sent_without_provider_response() -> None:
    delivery = NotificationDeliveryFactory(channel=CHANNEL_IN_APP)

    assert send_delivery(delivery=delivery) == DELIVERY_STATUS_SENT

    delivery.refresh_from_db()
    assert delivery.provider_message_id == "in_app_sent"
    assert delivery.safe_error_code == ""


def test_safe_notification_data_excludes_secret_fields() -> None:
    data = safe_notification_data(
        data={
            "matter_id": "matter-1",
            "url": "https://minio.example/presigned",
            "token": "jwt",
            "raw_response": {"secret": True},
        }
    )

    assert data == {"matter_id": "matter-1"}


@pytest.mark.django_db(transaction=True)
def test_notification_created_event_publishes_after_commit(monkeypatch: pytest.MonkeyPatch) -> None:
    calls = []
    recipient = MembershipFactory()

    def fake_publish_user_event(*, user_id, event_type, data):
        calls.append((user_id, event_type, data))
        return "published"

    monkeypatch.setattr("apps.notifications.services.publish_user_event", fake_publish_user_event)

    with transaction.atomic():
        notification = NotificationFactory(recipient=recipient)
        transaction.on_commit(lambda: publish_notification_created(notification=notification))

    assert calls == [
        (
            recipient.user_id,
            EVENT_NOTIFICATION_CREATED,
            {"notification_id": str(notification.id)},
        )
    ]
