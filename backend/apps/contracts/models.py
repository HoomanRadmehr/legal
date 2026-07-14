"""Concrete contract composition model."""

from __future__ import annotations

from django.db import models
from django.utils.translation import gettext_lazy as _

CONTRACT_TYPE_SERVICE = "service"
CONTRACT_TYPE_VENDOR = "vendor"
CONTRACT_TYPE_EMPLOYMENT = "employment"
CONTRACT_TYPE_NDA = "nda"
CONTRACT_TYPE_OTHER = "other"
CONTRACT_TYPE_CHOICES = (
    (CONTRACT_TYPE_SERVICE, _("Service")),
    (CONTRACT_TYPE_VENDOR, _("Vendor")),
    (CONTRACT_TYPE_EMPLOYMENT, _("Employment")),
    (CONTRACT_TYPE_NDA, _("NDA")),
    (CONTRACT_TYPE_OTHER, _("Other")),
)

MAX_KEY_TERMS_BYTES = 8192


class Contract(models.Model):
    matter = models.OneToOneField(
        "matters.Matter",
        on_delete=models.PROTECT,
        primary_key=True,
        related_name="contract",
        verbose_name=_("matter"),
    )
    contract_type = models.CharField(
        _("contract type"),
        max_length=32,
        choices=CONTRACT_TYPE_CHOICES,
    )
    counterparty = models.CharField(_("counterparty"), max_length=255)
    effective_date = models.DateField(_("effective date"))
    expiration_date = models.DateField(_("expiration date"), blank=True, null=True)
    renewal_date = models.DateField(_("renewal date"), blank=True, null=True)
    key_terms = models.JSONField(_("key terms"), default=dict, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=("contract_type",), name="contract_type_idx"),
            models.Index(fields=("counterparty",), name="contract_counterparty_idx"),
            models.Index(fields=("effective_date",), name="contract_effective_idx"),
            models.Index(fields=("expiration_date",), name="contract_expiration_idx"),
            models.Index(fields=("renewal_date",), name="contract_renewal_idx"),
        ]
        ordering = ("matter__reference_code",)
        verbose_name = _("contract")
        verbose_name_plural = _("contracts")

    def __str__(self) -> str:
        return self.matter.reference_code
