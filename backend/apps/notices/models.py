"""Concrete legal notice composition model."""

from __future__ import annotations

from django.db import models
from django.utils.translation import gettext_lazy as _

RESPONSE_STATUS_PENDING = "pending"
RESPONSE_STATUS_RESPONDED = "responded"
RESPONSE_STATUS_CANCELLED = "cancelled"
RESPONSE_STATUS_CHOICES = (
    (RESPONSE_STATUS_PENDING, _("Pending")),
    (RESPONSE_STATUS_RESPONDED, _("Responded")),
    (RESPONSE_STATUS_CANCELLED, _("Cancelled")),
)


class LegalNotice(models.Model):
    matter = models.OneToOneField(
        "matters.Matter",
        on_delete=models.PROTECT,
        primary_key=True,
        related_name="notice",
        verbose_name=_("matter"),
    )
    sender = models.CharField(_("sender"), max_length=255)
    received_date = models.DateField(_("received date"))
    response_deadline = models.DateTimeField(_("response deadline"))
    response_status = models.CharField(
        _("response status"),
        max_length=16,
        choices=RESPONSE_STATUS_CHOICES,
        default=RESPONSE_STATUS_PENDING,
    )
    linked_deadline = models.OneToOneField(
        "deadlines.Deadline",
        on_delete=models.PROTECT,
        related_name="linked_notice",
        verbose_name=_("linked response deadline"),
    )

    class Meta:
        indexes = [
            models.Index(fields=("sender",), name="notice_sender_idx"),
            models.Index(fields=("received_date",), name="notice_received_idx"),
            models.Index(fields=("response_deadline",), name="notice_response_due_idx"),
            models.Index(fields=("response_status",), name="notice_response_status_idx"),
        ]
        ordering = ("matter__reference_code",)
        verbose_name = _("legal notice")
        verbose_name_plural = _("legal notices")

    def __str__(self) -> str:
        return self.matter.reference_code
