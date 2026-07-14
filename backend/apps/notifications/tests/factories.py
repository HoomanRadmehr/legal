"""Test factories for notifications."""

from __future__ import annotations

import factory

from apps.notifications.models import (
    CHANNEL_IN_APP,
    DELIVERY_STATUS_PENDING,
    EVENT_NOTIFICATION_CREATED,
    Notification,
    NotificationDelivery,
    NotificationPreference,
)
from apps.organizations.tests.factories import MembershipFactory


class NotificationPreferenceFactory(factory.django.DjangoModelFactory):
    membership = factory.SubFactory(MembershipFactory)
    event_type = EVENT_NOTIFICATION_CREATED
    channel = CHANNEL_IN_APP
    reminder_offset_minutes = 0
    enabled = True

    class Meta:
        model = NotificationPreference


class NotificationFactory(factory.django.DjangoModelFactory):
    organization = factory.SelfAttribute("recipient.organization")
    recipient = factory.SubFactory(MembershipFactory)
    event_type = EVENT_NOTIFICATION_CREATED
    title = "Notification"
    body = "A notification is available."
    data = factory.LazyFunction(dict)

    class Meta:
        model = Notification


class NotificationDeliveryFactory(factory.django.DjangoModelFactory):
    notification = factory.SubFactory(NotificationFactory)
    organization = factory.SelfAttribute("notification.organization")
    recipient = factory.SelfAttribute("notification.recipient")
    channel = CHANNEL_IN_APP
    status = DELIVERY_STATUS_PENDING
    dedupe_key = factory.Sequence(lambda number: f"notification:{number}:channel:in_app")

    class Meta:
        model = NotificationDelivery
