"""Concrete legal case composition models."""

from __future__ import annotations

from django.core.exceptions import ValidationError
from django.db import models
from django.utils.translation import gettext_lazy as _

from common.models import CommonModel

CASE_TYPE_LITIGATION = "litigation"
CASE_TYPE_REGULATORY = "regulatory"
CASE_TYPE_INTERNAL = "internal"
CASE_TYPE_OTHER = "other"
CASE_TYPE_CHOICES = (
    (CASE_TYPE_LITIGATION, _("Litigation")),
    (CASE_TYPE_REGULATORY, _("Regulatory")),
    (CASE_TYPE_INTERNAL, _("Internal")),
    (CASE_TYPE_OTHER, _("Other")),
)

PARTY_ROLE_CLIENT = "client"
PARTY_ROLE_OPPOSING = "opposing"
PARTY_ROLE_COURT = "court"
PARTY_ROLE_WITNESS = "witness"
PARTY_ROLE_OTHER = "other"
PARTY_ROLE_CHOICES = (
    (PARTY_ROLE_CLIENT, _("Client")),
    (PARTY_ROLE_OPPOSING, _("Opposing party")),
    (PARTY_ROLE_COURT, _("Court or authority")),
    (PARTY_ROLE_WITNESS, _("Witness")),
    (PARTY_ROLE_OTHER, _("Other")),
)


class LegalCase(models.Model):
    matter = models.OneToOneField(
        "matters.Matter",
        on_delete=models.PROTECT,
        primary_key=True,
        related_name="legal_case",
        verbose_name=_("matter"),
    )
    case_type = models.CharField(_("case type"), max_length=32, choices=CASE_TYPE_CHOICES)
    court_or_authority = models.CharField(_("court or authority"), max_length=255, blank=True)
    filing_date = models.DateField(_("filing date"), blank=True, null=True)
    outcome_summary = models.TextField(_("outcome summary"), blank=True)

    class Meta:
        indexes = [
            models.Index(fields=("case_type",), name="case_type_idx"),
            models.Index(fields=("filing_date",), name="case_filing_date_idx"),
        ]
        ordering = ("matter__reference_code",)
        verbose_name = _("legal case")
        verbose_name_plural = _("legal cases")

    def __str__(self) -> str:
        return self.matter.reference_code


class CaseParty(CommonModel):
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.PROTECT,
        related_name="case_parties",
        verbose_name=_("organization"),
    )
    case = models.ForeignKey(
        LegalCase,
        on_delete=models.PROTECT,
        related_name="parties",
        verbose_name=_("case"),
    )
    name = models.CharField(_("name"), max_length=255)
    role = models.CharField(_("role"), max_length=32, choices=PARTY_ROLE_CHOICES)
    contact_summary = models.CharField(_("contact summary"), max_length=500, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=("organization", "role"), name="case_party_org_role_idx"),
            models.Index(fields=("case", "role"), name="case_party_case_role_idx"),
        ]
        ordering = ("name",)
        verbose_name = _("case party")
        verbose_name_plural = _("case parties")

    def clean(self) -> None:
        if self.case.matter.organization_id != self.organization_id:
            raise ValidationError({"organization": _("Party must match the case organization.")})

    def __str__(self) -> str:
        return self.name
