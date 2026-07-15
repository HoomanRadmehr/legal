"""Concrete offboarding run model."""

from __future__ import annotations

from django.db import models
from django.utils.translation import gettext_lazy as _

from common.models import CommonModel

STATUS_COMPLETED = "completed"
OFFBOARDING_STATUS_CHOICES = ((STATUS_COMPLETED, _("Completed")),)


class OffboardingRun(CommonModel):
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.PROTECT,
        related_name="offboarding_runs",
        verbose_name=_("organization"),
    )
    departing_membership = models.ForeignKey(
        "organizations.Membership",
        on_delete=models.PROTECT,
        related_name="departing_offboarding_runs",
        verbose_name=_("departing membership"),
    )
    replacement_membership = models.ForeignKey(
        "organizations.Membership",
        on_delete=models.PROTECT,
        related_name="replacement_offboarding_runs",
        verbose_name=_("replacement membership"),
    )
    initiated_by = models.ForeignKey(
        "organizations.Membership",
        on_delete=models.PROTECT,
        related_name="initiated_offboarding_runs",
        verbose_name=_("initiated by"),
    )
    idempotency_record = models.OneToOneField(
        "activity.IdempotencyRecord",
        on_delete=models.PROTECT,
        related_name="offboarding_run",
        verbose_name=_("idempotency record"),
    )
    status = models.CharField(
        _("status"),
        max_length=16,
        choices=OFFBOARDING_STATUS_CHOICES,
        default=STATUS_COMPLETED,
    )
    preview_snapshot = models.JSONField(_("preview snapshot"), default=dict)
    executed_at = models.DateTimeField(_("executed at"))
    failure_code = models.CharField(_("failure code"), max_length=64, blank=True)

    class Meta:
        indexes = [
            models.Index(
                fields=("organization", "-created_at"),
                name="offboarding_org_created_idx",
            ),
            models.Index(
                fields=("departing_membership", "-created_at"),
                name="offboarding_departing_idx",
            ),
        ]
        ordering = ("-created_at",)
        verbose_name = _("offboarding run")
        verbose_name_plural = _("offboarding runs")

    def __str__(self) -> str:
        return str(self.id)
