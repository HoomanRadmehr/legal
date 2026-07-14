"""Mutation and delivery services for notifications."""

from __future__ import annotations

from django.core.mail import send_mail
from django.db import IntegrityError, transaction
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from rest_framework.exceptions import PermissionDenied

from apps.accounts.selectors import get_current_membership
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
    NOTIFICATION_CHANNELS,
    Notification,
    NotificationDelivery,
    NotificationPreference,
)
from common.api.errors import ConflictError
from common.realtime.publisher import publish_user_event

EMAIL_SENT_CODE = "email_sent"
IN_APP_SENT_CODE = "in_app_sent"


def replace_own_preferences(*, actor, preferences: list[dict]) -> list[NotificationPreference]:
    membership = require_notification_actor(actor=actor)
    with transaction.atomic():
        NotificationPreference.objects.filter(membership=membership).delete()
        created = [
            NotificationPreference.objects.create(membership=membership, **preference)
            for preference in preferences
        ]
    return created


def create_notification(
    *,
    recipient,
    event_type: str,
    title: str,
    body: str = "",
    data: dict | None = None,
    dedupe_key: str,
    reminder_offset_minutes: int = 0,
) -> Notification:
    with transaction.atomic():
        notification = Notification.objects.create(
            organization=recipient.organization,
            recipient=recipient,
            event_type=event_type,
            title=title,
            body=body,
            data=safe_notification_data(data=data or {}),
        )
        create_delivery_rows(
            notification=notification,
            dedupe_key=dedupe_key,
            reminder_offset_minutes=reminder_offset_minutes,
        )
        transaction.on_commit(lambda: publish_notification_created(notification=notification))
    return notification


def create_delivery_rows(
    *, notification: Notification, dedupe_key: str, reminder_offset_minutes: int = 0
) -> list[NotificationDelivery]:
    preferences = preferences_for_event(
        recipient=notification.recipient,
        event_type=notification.event_type,
        reminder_offset_minutes=reminder_offset_minutes,
    )
    return [
        create_delivery_row(
            notification=notification,
            channel=channel,
            enabled=channel_enabled(channel=channel, preferences=preferences),
            dedupe_key=delivery_dedupe_key(
                base_key=dedupe_key,
                recipient_id=notification.recipient_id,
                channel=channel,
                reminder_offset_minutes=reminder_offset_minutes,
            ),
        )
        for channel in NOTIFICATION_CHANNELS
    ]


def create_delivery_row(
    *, notification: Notification, channel: str, enabled: bool, dedupe_key: str
) -> NotificationDelivery:
    status = DELIVERY_STATUS_PENDING if enabled else DELIVERY_STATUS_SKIPPED
    error_code = "" if enabled else ERROR_CHANNEL_DISABLED
    try:
        return NotificationDelivery.objects.create(
            notification=notification,
            organization=notification.organization,
            recipient=notification.recipient,
            channel=channel,
            status=status,
            dedupe_key=dedupe_key,
            safe_error_code=error_code,
            skipped_at=timezone.now() if error_code else None,
        )
    except IntegrityError as error:
        raise ConflictError(
            _("Duplicate notification delivery."), code="delivery_duplicate"
        ) from error


def send_delivery_by_id(*, delivery_id) -> str:
    delivery = NotificationDelivery.objects.select_related("notification", "recipient__user").get(
        id=delivery_id
    )
    return send_delivery(delivery=delivery)


def send_delivery(*, delivery: NotificationDelivery) -> str:
    if delivery.status != DELIVERY_STATUS_PENDING:
        return delivery.status
    if delivery.channel == CHANNEL_IN_APP:
        return send_in_app_delivery(delivery=delivery)
    if delivery.channel == CHANNEL_EMAIL:
        return send_email_delivery(delivery=delivery)
    if delivery.channel == CHANNEL_SMS:
        return send_sms_delivery(delivery=delivery)
    if delivery.channel == CHANNEL_PUSH:
        return send_push_delivery(delivery=delivery)
    return mark_delivery_skipped(delivery=delivery, safe_error_code=ERROR_PROVIDER_UNCONFIGURED)


def send_in_app_delivery(*, delivery: NotificationDelivery) -> str:
    return mark_delivery_sent(delivery=delivery, provider_message_id=IN_APP_SENT_CODE)


def send_email_delivery(*, delivery: NotificationDelivery) -> str:
    send_mail(
        subject=delivery.notification.title,
        message=delivery.notification.body,
        from_email=None,
        recipient_list=[delivery.recipient.user.email],
        fail_silently=False,
    )
    return mark_delivery_sent(delivery=delivery, provider_message_id=EMAIL_SENT_CODE)


def send_sms_delivery(*, delivery: NotificationDelivery) -> str:
    return mark_delivery_skipped(delivery=delivery, safe_error_code=ERROR_PROVIDER_UNCONFIGURED)


def send_push_delivery(*, delivery: NotificationDelivery) -> str:
    return mark_delivery_skipped(delivery=delivery, safe_error_code=ERROR_PROVIDER_UNCONFIGURED)


def mark_notification_read(*, actor, notification: Notification) -> Notification:
    membership = require_notification_actor(actor=actor)
    if notification.recipient_id != membership.id:
        raise PermissionDenied(_("You can only read your own notifications."))
    if notification.read_at is None:
        notification.read_at = timezone.now()
        notification.save(update_fields=["read_at", "updated_at"])
    return notification


def mark_all_notifications_read(*, actor) -> int:
    membership = require_notification_actor(actor=actor)
    return Notification.objects.filter(recipient=membership, read_at__isnull=True).update(
        read_at=timezone.now(),
        updated_at=timezone.now(),
    )


def require_notification_actor(*, actor):
    membership = get_current_membership(user=actor)
    if membership is None:
        raise PermissionDenied(_("An active organization membership is required."))
    return membership


def preferences_for_event(*, recipient, event_type: str, reminder_offset_minutes: int) -> dict:
    rows = NotificationPreference.objects.filter(
        membership=recipient,
        event_type=event_type,
        reminder_offset_minutes=reminder_offset_minutes,
    )
    return {preference.channel: preference.enabled for preference in rows}


def channel_enabled(*, channel: str, preferences: dict) -> bool:
    if channel == CHANNEL_IN_APP:
        return True
    if channel == CHANNEL_EMAIL:
        return preferences.get(channel, True)
    return preferences.get(channel, False)


def delivery_dedupe_key(
    *, base_key: str, recipient_id, channel: str, reminder_offset_minutes: int
) -> str:
    return (
        f"{base_key}:recipient:{recipient_id}:offset:{reminder_offset_minutes}:channel:{channel}"
    )[:255]


def mark_delivery_sent(*, delivery: NotificationDelivery, provider_message_id: str) -> str:
    delivery.status = DELIVERY_STATUS_SENT
    delivery.sent_at = timezone.now()
    delivery.safe_error_code = ""
    delivery.provider_message_id = provider_message_id[:128]
    delivery.attempt_count += 1
    delivery.save(update_fields=delivery_update_fields())
    return DELIVERY_STATUS_SENT


def mark_delivery_skipped(*, delivery: NotificationDelivery, safe_error_code: str) -> str:
    delivery.status = DELIVERY_STATUS_SKIPPED
    delivery.skipped_at = timezone.now()
    delivery.safe_error_code = safe_error_code[:64]
    delivery.attempt_count += 1
    delivery.save(
        update_fields=["status", "skipped_at", "safe_error_code", "attempt_count", "updated_at"]
    )
    return DELIVERY_STATUS_SKIPPED


def delivery_update_fields() -> list[str]:
    return [
        "status",
        "sent_at",
        "safe_error_code",
        "provider_message_id",
        "attempt_count",
        "updated_at",
    ]


def publish_notification_created(*, notification: Notification) -> str:
    return publish_user_event(
        user_id=notification.recipient.user_id,
        event_type=EVENT_NOTIFICATION_CREATED,
        data={"notification_id": str(notification.id)},
    )


def safe_notification_data(*, data: dict) -> dict:
    allowed = {"matter_id", "deadline_id", "task_id", "document_id", "run_id"}
    return {key: str(data[key]) for key in data if key in allowed}
