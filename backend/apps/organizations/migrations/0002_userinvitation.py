# Generated for BE-026.5 user invitations.

from __future__ import annotations

import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("organizations", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="UserInvitation",
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
                    "token_hash",
                    models.CharField(max_length=64, unique=True, verbose_name="token hash"),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("pending", "Pending"),
                            ("accepted", "Accepted"),
                            ("expired", "Expired"),
                            ("revoked", "Revoked"),
                        ],
                        default="pending",
                        max_length=16,
                        verbose_name="status",
                    ),
                ),
                ("expires_at", models.DateTimeField(verbose_name="expires at")),
                (
                    "accepted_at",
                    models.DateTimeField(blank=True, null=True, verbose_name="accepted at"),
                ),
                (
                    "invited_by",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="sent_invitations",
                        to="organizations.membership",
                        verbose_name="invited by",
                    ),
                ),
                (
                    "membership",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="invitation",
                        to="organizations.membership",
                        verbose_name="membership",
                    ),
                ),
                (
                    "organization",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="user_invitations",
                        to="organizations.organization",
                        verbose_name="organization",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="user_invitations",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="user",
                    ),
                ),
            ],
            options={
                "verbose_name": "user invitation",
                "verbose_name_plural": "user invitations",
                "ordering": ("-created_at",),
                "indexes": [
                    models.Index(
                        fields=("organization", "status", "expires_at"),
                        name="org_invitation_status_exp_idx",
                    ),
                ],
            },
        ),
    ]
