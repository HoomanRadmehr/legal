"""Read selectors for recipient-scoped notifications."""

from __future__ import annotations

from apps.accounts.selectors import get_current_membership
from apps.notifications.models import Notification, NotificationPreference


def notification_list(*, actor):
    membership = get_current_membership(user=actor)
    if membership is None:
        return Notification.objects.none()
    return (
        Notification.objects.filter(
            organization=membership.organization,
            recipient=membership,
        )
        .select_related("recipient", "organization")
        .order_by("-created_at")
    )


def notification_preference_list(*, actor):
    membership = get_current_membership(user=actor)
    if membership is None:
        return NotificationPreference.objects.none()
    return NotificationPreference.objects.filter(membership=membership).order_by(
        "event_type",
        "reminder_offset_minutes",
        "channel",
    )
