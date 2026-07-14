"""Initial notification models."""

from __future__ import annotations

import uuid

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("organizations", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Notification",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4, editable=False, primary_key=True, serialize=False
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="created at")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="updated at")),
                ("event_type", models.CharField(max_length=128, verbose_name="event type")),
                ("title", models.CharField(max_length=160, verbose_name="title")),
                ("body", models.TextField(blank=True, verbose_name="body")),
                ("data", models.JSONField(blank=True, default=dict, verbose_name="data")),
                ("read_at", models.DateTimeField(blank=True, null=True, verbose_name="read at")),
                (
                    "organization",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="notifications",
                        to="organizations.organization",
                        verbose_name="organization",
                    ),
                ),
                (
                    "recipient",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="notifications",
                        to="organizations.membership",
                        verbose_name="recipient",
                    ),
                ),
            ],
            options={
                "verbose_name": "notification",
                "verbose_name_plural": "notifications",
                "ordering": ("-created_at",),
            },
        ),
        migrations.CreateModel(
            name="NotificationDelivery",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4, editable=False, primary_key=True, serialize=False
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="created at")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="updated at")),
                (
                    "channel",
                    models.CharField(
                        choices=[
                            ("in_app", "In app"),
                            ("email", "Email"),
                            ("sms", "SMS"),
                            ("push", "Push"),
                        ],
                        max_length=16,
                        verbose_name="channel",
                    ),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("pending", "Pending"),
                            ("sent", "Sent"),
                            ("failed", "Failed"),
                            ("skipped", "Skipped"),
                        ],
                        default="pending",
                        max_length=16,
                        verbose_name="status",
                    ),
                ),
                (
                    "dedupe_key",
                    models.CharField(max_length=255, unique=True, verbose_name="dedupe key"),
                ),
                (
                    "safe_error_code",
                    models.CharField(blank=True, max_length=64, verbose_name="safe error code"),
                ),
                (
                    "provider_message_id",
                    models.CharField(
                        blank=True, max_length=128, verbose_name="provider message id"
                    ),
                ),
                (
                    "attempt_count",
                    models.PositiveSmallIntegerField(default=0, verbose_name="attempt count"),
                ),
                ("sent_at", models.DateTimeField(blank=True, null=True, verbose_name="sent at")),
                (
                    "failed_at",
                    models.DateTimeField(blank=True, null=True, verbose_name="failed at"),
                ),
                (
                    "skipped_at",
                    models.DateTimeField(blank=True, null=True, verbose_name="skipped at"),
                ),
                (
                    "notification",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="deliveries",
                        to="notifications.notification",
                        verbose_name="notification",
                    ),
                ),
                (
                    "organization",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="notification_deliveries",
                        to="organizations.organization",
                        verbose_name="organization",
                    ),
                ),
                (
                    "recipient",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="notification_deliveries",
                        to="organizations.membership",
                        verbose_name="recipient",
                    ),
                ),
            ],
            options={
                "verbose_name": "notification delivery",
                "verbose_name_plural": "notification deliveries",
                "ordering": ("created_at",),
            },
        ),
        migrations.CreateModel(
            name="NotificationPreference",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4, editable=False, primary_key=True, serialize=False
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="created at")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="updated at")),
                ("event_type", models.CharField(max_length=128, verbose_name="event type")),
                (
                    "channel",
                    models.CharField(
                        choices=[
                            ("in_app", "In app"),
                            ("email", "Email"),
                            ("sms", "SMS"),
                            ("push", "Push"),
                        ],
                        max_length=16,
                        verbose_name="channel",
                    ),
                ),
                (
                    "reminder_offset_minutes",
                    models.IntegerField(default=0, verbose_name="reminder offset minutes"),
                ),
                ("enabled", models.BooleanField(default=True, verbose_name="enabled")),
                (
                    "membership",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="notification_preferences",
                        to="organizations.membership",
                        verbose_name="membership",
                    ),
                ),
            ],
            options={
                "verbose_name": "notification preference",
                "verbose_name_plural": "notification preferences",
                "ordering": ("event_type", "reminder_offset_minutes", "channel"),
            },
        ),
        migrations.AddIndex(
            model_name="notification",
            index=models.Index(
                fields=["recipient", "read_at", "-created_at"],
                name="notif_recipient_read_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="notification",
            index=models.Index(fields=["organization", "event_type"], name="notif_org_event_idx"),
        ),
        migrations.AddIndex(
            model_name="notificationdelivery",
            index=models.Index(fields=["status", "created_at"], name="notif_delivery_status_idx"),
        ),
        migrations.AddIndex(
            model_name="notificationdelivery",
            index=models.Index(
                fields=["recipient", "channel", "-created_at"],
                name="notif_delivery_recipient_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="notificationpreference",
            index=models.Index(
                fields=["membership", "event_type"],
                name="notif_pref_member_event_idx",
            ),
        ),
        migrations.AddConstraint(
            model_name="notificationpreference",
            constraint=models.UniqueConstraint(
                fields=("membership", "event_type", "channel", "reminder_offset_minutes"),
                name="notification_pref_unique_member_event_channel_offset",
            ),
        ),
    ]
