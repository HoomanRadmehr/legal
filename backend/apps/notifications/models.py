"""Notification preferences, notifications, and delivery rows."""

from __future__ import annotations

from django.db import models
from django.utils.translation import gettext_lazy as _

from common.models import CommonModel

CHANNEL_IN_APP = "in_app"
CHANNEL_EMAIL = "email"
CHANNEL_SMS = "sms"
CHANNEL_PUSH = "push"
NOTIFICATION_CHANNEL_CHOICES = (
    (CHANNEL_IN_APP, _("In app")),
    (CHANNEL_EMAIL, _("Email")),
    (CHANNEL_SMS, _("SMS")),
    (CHANNEL_PUSH, _("Push")),
)
NOTIFICATION_CHANNELS = (CHANNEL_IN_APP, CHANNEL_EMAIL, CHANNEL_SMS, CHANNEL_PUSH)

DELIVERY_STATUS_PENDING = "pending"
DELIVERY_STATUS_SENT = "sent"
DELIVERY_STATUS_FAILED = "failed"
DELIVERY_STATUS_SKIPPED = "skipped"
DELIVERY_STATUS_CHOICES = (
    (DELIVERY_STATUS_PENDING, _("Pending")),
    (DELIVERY_STATUS_SENT, _("Sent")),
    (DELIVERY_STATUS_FAILED, _("Failed")),
    (DELIVERY_STATUS_SKIPPED, _("Skipped")),
)

ERROR_CHANNEL_DISABLED = "channel_disabled"
ERROR_PROVIDER_UNCONFIGURED = "provider_unconfigured"
EVENT_NOTIFICATION_CREATED = "notification.created"


class NotificationPreference(CommonModel):
    membership = models.ForeignKey(
        "organizations.Membership",
        on_delete=models.CASCADE,
        related_name="notification_preferences",
        verbose_name=_("membership"),
    )
    event_type = models.CharField(_("event type"), max_length=128)
    channel = models.CharField(_("channel"), max_length=16, choices=NOTIFICATION_CHANNEL_CHOICES)
    reminder_offset_minutes = models.IntegerField(_("reminder offset minutes"), default=0)
    enabled = models.BooleanField(_("enabled"), default=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=("membership", "event_type", "channel", "reminder_offset_minutes"),
                name="notification_pref_unique_member_event_channel_offset",
            ),
        ]
        indexes = [
            models.Index(
                fields=("membership", "event_type"),
                name="notif_pref_member_event_idx",
            ),
        ]
        ordering = ("event_type", "reminder_offset_minutes", "channel")
        verbose_name = _("notification preference")
        verbose_name_plural = _("notification preferences")

    def __str__(self) -> str:
        return f"{self.membership_id}:{self.event_type}:{self.channel}"


class Notification(CommonModel):
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="notifications",
        verbose_name=_("organization"),
    )
    recipient = models.ForeignKey(
        "organizations.Membership",
        on_delete=models.CASCADE,
        related_name="notifications",
        verbose_name=_("recipient"),
    )
    event_type = models.CharField(_("event type"), max_length=128)
    title = models.CharField(_("title"), max_length=160)
    body = models.TextField(_("body"), blank=True)
    data = models.JSONField(_("data"), default=dict, blank=True)
    read_at = models.DateTimeField(_("read at"), blank=True, null=True)

    class Meta:
        indexes = [
            models.Index(
                fields=("recipient", "read_at", "-created_at"),
                name="notif_recipient_read_idx",
            ),
            models.Index(fields=("organization", "event_type"), name="notif_org_event_idx"),
        ]
        ordering = ("-created_at",)
        verbose_name = _("notification")
        verbose_name_plural = _("notifications")

    def __str__(self) -> str:
        return self.title


class NotificationDelivery(CommonModel):
    notification = models.ForeignKey(
        Notification,
        on_delete=models.CASCADE,
        related_name="deliveries",
        verbose_name=_("notification"),
    )
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="notification_deliveries",
        verbose_name=_("organization"),
    )
    recipient = models.ForeignKey(
        "organizations.Membership",
        on_delete=models.CASCADE,
        related_name="notification_deliveries",
        verbose_name=_("recipient"),
    )
    channel = models.CharField(_("channel"), max_length=16, choices=NOTIFICATION_CHANNEL_CHOICES)
    status = models.CharField(
        _("status"),
        max_length=16,
        choices=DELIVERY_STATUS_CHOICES,
        default=DELIVERY_STATUS_PENDING,
    )
    dedupe_key = models.CharField(_("dedupe key"), max_length=255, unique=True)
    safe_error_code = models.CharField(_("safe error code"), max_length=64, blank=True)
    provider_message_id = models.CharField(_("provider message id"), max_length=128, blank=True)
    attempt_count = models.PositiveSmallIntegerField(_("attempt count"), default=0)
    sent_at = models.DateTimeField(_("sent at"), blank=True, null=True)
    failed_at = models.DateTimeField(_("failed at"), blank=True, null=True)
    skipped_at = models.DateTimeField(_("skipped at"), blank=True, null=True)

    class Meta:
        indexes = [
            models.Index(fields=("status", "created_at"), name="notif_delivery_status_idx"),
            models.Index(
                fields=("recipient", "channel", "-created_at"),
                name="notif_delivery_recipient_idx",
            ),
        ]
        ordering = ("created_at",)
        verbose_name = _("notification delivery")
        verbose_name_plural = _("notification deliveries")

    def __str__(self) -> str:
        return f"{self.channel}:{self.status}"
