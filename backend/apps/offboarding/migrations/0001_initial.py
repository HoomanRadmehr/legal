"""Initial offboarding run model."""

from __future__ import annotations

import django.db.models.deletion
from django.db import migrations, models

import common.models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("activity", "0002_idempotencyrecord"),
        ("organizations", "0002_userinvitation"),
    ]

    operations = [
        migrations.CreateModel(
            name="OffboardingRun",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=common.models.uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="created at")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="updated at")),
                (
                    "status",
                    models.CharField(
                        choices=[("completed", "Completed")],
                        default="completed",
                        max_length=16,
                        verbose_name="status",
                    ),
                ),
                (
                    "preview_snapshot",
                    models.JSONField(default=dict, verbose_name="preview snapshot"),
                ),
                ("executed_at", models.DateTimeField(verbose_name="executed at")),
                (
                    "failure_code",
                    models.CharField(blank=True, max_length=64, verbose_name="failure code"),
                ),
                (
                    "departing_membership",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="departing_offboarding_runs",
                        to="organizations.membership",
                        verbose_name="departing membership",
                    ),
                ),
                (
                    "idempotency_record",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="offboarding_run",
                        to="activity.idempotencyrecord",
                        verbose_name="idempotency record",
                    ),
                ),
                (
                    "initiated_by",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="initiated_offboarding_runs",
                        to="organizations.membership",
                        verbose_name="initiated by",
                    ),
                ),
                (
                    "organization",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="offboarding_runs",
                        to="organizations.organization",
                        verbose_name="organization",
                    ),
                ),
                (
                    "replacement_membership",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="replacement_offboarding_runs",
                        to="organizations.membership",
                        verbose_name="replacement membership",
                    ),
                ),
            ],
            options={
                "verbose_name": "offboarding run",
                "verbose_name_plural": "offboarding runs",
                "ordering": ("-created_at",),
            },
        ),
        migrations.AddIndex(
            model_name="offboardingrun",
            index=models.Index(
                fields=["organization", "-created_at"],
                name="offboarding_org_created_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="offboardingrun",
            index=models.Index(
                fields=["departing_membership", "-created_at"],
                name="offboarding_departing_idx",
            ),
        ),
    ]
