"""Tests for deadline reminder scheduling."""

from __future__ import annotations

import datetime as dt
from zoneinfo import ZoneInfo

import pytest
from django.core import mail

from apps.deadlines.models import STATUS_CANCELLED, STATUS_COMPLETED
from apps.deadlines.services import (
    EVENT_DEADLINE_REMINDER_CREATED,
    scan_deadline_reminders,
)
from apps.deadlines.tasks import scan_deadline_reminders_task
from apps.deadlines.tests.factories import DeadlineFactory
from apps.notifications.models import (
    CHANNEL_EMAIL,
    CHANNEL_IN_APP,
    CHANNEL_PUSH,
    CHANNEL_SMS,
    DELIVERY_STATUS_PENDING,
    DELIVERY_STATUS_SKIPPED,
    ERROR_CHANNEL_DISABLED,
    Notification,
    NotificationDelivery,
    NotificationPreference,
)
from apps.organizations.tests.factories import MembershipFactory, OrganizationFactory

pytestmark = pytest.mark.django_db


def test_repeated_scan_creates_no_duplicate_delivery_intent() -> None:
    assignee = MembershipFactory()
    now = aware(2026, 7, 14, 9, 0)
    DeadlineFactory(
        matter__organization=assignee.organization,
        matter__owner=assignee,
        assignee=assignee,
        due_at=now + dt.timedelta(hours=1, minutes=2),
    )

    assert scan_deadline_reminders(now=now) == 1
    assert scan_deadline_reminders(now=now) == 0

    assert Notification.objects.count() == 1
    assert NotificationDelivery.objects.count() == 4


def test_completed_cancelled_and_disabled_deadlines_are_skipped() -> None:
    assignee = MembershipFactory()
    now = aware(2026, 7, 14, 9, 0)
    for status in (STATUS_COMPLETED, STATUS_CANCELLED):
        DeadlineFactory(
            matter__organization=assignee.organization,
            matter__owner=assignee,
            assignee=assignee,
            status=status,
            due_at=now + dt.timedelta(hours=1),
        )
    DeadlineFactory(
        matter__organization=assignee.organization,
        matter__owner=assignee,
        assignee=assignee,
        reminder_enabled=False,
        due_at=now + dt.timedelta(hours=1),
    )

    assert scan_deadline_reminders(now=now) == 0
    assert Notification.objects.count() == 0


def test_preference_disabled_channel_is_respected() -> None:
    assignee = MembershipFactory()
    now = aware(2026, 7, 14, 9, 0)
    NotificationPreference.objects.create(
        membership=assignee,
        event_type=EVENT_DEADLINE_REMINDER_CREATED,
        channel=CHANNEL_EMAIL,
        reminder_offset_minutes=60,
        enabled=False,
    )
    DeadlineFactory(
        matter__organization=assignee.organization,
        matter__owner=assignee,
        assignee=assignee,
        due_at=now + dt.timedelta(hours=1),
    )

    assert scan_deadline_reminders(now=now) == 1

    deliveries = {delivery.channel: delivery for delivery in NotificationDelivery.objects.all()}
    assert deliveries[CHANNEL_IN_APP].status == DELIVERY_STATUS_PENDING
    assert deliveries[CHANNEL_EMAIL].status == DELIVERY_STATUS_SKIPPED
    assert deliveries[CHANNEL_EMAIL].safe_error_code == ERROR_CHANNEL_DISABLED
    assert deliveries[CHANNEL_SMS].status == DELIVERY_STATUS_SKIPPED
    assert deliveries[CHANNEL_PUSH].status == DELIVERY_STATUS_SKIPPED


def test_scan_does_not_call_delivery_providers() -> None:
    assignee = MembershipFactory()
    now = aware(2026, 7, 14, 9, 0)
    DeadlineFactory(
        matter__organization=assignee.organization,
        matter__owner=assignee,
        assignee=assignee,
        due_at=now + dt.timedelta(hours=1),
    )

    assert scan_deadline_reminders(now=now) == 1

    assert len(mail.outbox) == 0
    assert NotificationDelivery.objects.filter(status=DELIVERY_STATUS_PENDING).count() == 2


def test_timezone_boundary_deadline_enters_utc_window() -> None:
    organization = OrganizationFactory(timezone="Asia/Tehran")
    assignee = MembershipFactory(organization=organization)
    local_due = dt.datetime(2026, 7, 15, 0, 2, tzinfo=ZoneInfo("Asia/Tehran"))
    now = local_due.astimezone(dt.UTC) - dt.timedelta(hours=1)
    DeadlineFactory(
        matter__organization=organization,
        matter__owner=assignee,
        assignee=assignee,
        due_at=local_due.astimezone(dt.UTC),
    )

    assert scan_deadline_reminders(now=now) == 1

    notification = Notification.objects.get()
    assert notification.data["deadline_id"]
    assert notification.event_type == EVENT_DEADLINE_REMINDER_CREATED


def test_celery_task_calls_scan(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr("apps.deadlines.tasks.scan_deadline_reminders", lambda: 7)

    assert scan_deadline_reminders_task() == 7


def aware(year: int, month: int, day: int, hour: int, minute: int):
    return dt.datetime(year, month, day, hour, minute, tzinfo=dt.UTC)
