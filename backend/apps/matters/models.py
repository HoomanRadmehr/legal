"""Concrete matter boundary models."""

from __future__ import annotations

from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import F, Q
from django.utils.translation import gettext_lazy as _

from common.models import CommonModel

KIND_CASE = "case"
KIND_CONTRACT = "contract"
KIND_NOTICE = "notice"
MATTER_KIND_CHOICES = (
    (KIND_CASE, _("Case")),
    (KIND_CONTRACT, _("Contract")),
    (KIND_NOTICE, _("Notice")),
)

STATUS_OPEN = "open"
STATUS_PENDING = "pending"
STATUS_ON_HOLD = "on_hold"
STATUS_CLOSED = "closed"
STATUS_ARCHIVED = "archived"
STATUS_DRAFT = "draft"
STATUS_ACTIVE = "active"
STATUS_EXPIRED = "expired"
STATUS_TERMINATED = "terminated"
STATUS_RECEIVED = "received"
STATUS_UNDER_REVIEW = "under_review"
STATUS_RESPONSE_DUE = "response_due"
STATUS_RESPONDED = "responded"
MATTER_STATUS_CHOICES = (
    (STATUS_OPEN, _("Open")),
    (STATUS_PENDING, _("Pending")),
    (STATUS_ON_HOLD, _("On hold")),
    (STATUS_CLOSED, _("Closed")),
    (STATUS_ARCHIVED, _("Archived")),
    (STATUS_DRAFT, _("Draft")),
    (STATUS_ACTIVE, _("Active")),
    (STATUS_EXPIRED, _("Expired")),
    (STATUS_TERMINATED, _("Terminated")),
    (STATUS_RECEIVED, _("Received")),
    (STATUS_UNDER_REVIEW, _("Under review")),
    (STATUS_RESPONSE_DUE, _("Response due")),
    (STATUS_RESPONDED, _("Responded")),
)

PRIORITY_LOW = "low"
PRIORITY_NORMAL = "normal"
PRIORITY_HIGH = "high"
PRIORITY_CRITICAL = "critical"
PRIORITY_CHOICES = (
    (PRIORITY_LOW, _("Low")),
    (PRIORITY_NORMAL, _("Normal")),
    (PRIORITY_HIGH, _("High")),
    (PRIORITY_CRITICAL, _("Critical")),
)

ACCESS_LEVEL_VIEW = "view"
ACCESS_LEVEL_EDIT = "edit"
MATTER_ACCESS_LEVEL_CHOICES = (
    (ACCESS_LEVEL_VIEW, _("View")),
    (ACCESS_LEVEL_EDIT, _("Edit")),
)

RELATION_RELATED = "related"
RELATION_DEPENDS_ON = "depends_on"
RELATION_SUPERSEDES = "supersedes"
MATTER_RELATION_TYPE_CHOICES = (
    (RELATION_RELATED, _("Related")),
    (RELATION_DEPENDS_ON, _("Depends on")),
    (RELATION_SUPERSEDES, _("Supersedes")),
)


class Matter(CommonModel):
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.PROTECT,
        related_name="matters",
        verbose_name=_("organization"),
    )
    kind = models.CharField(_("kind"), max_length=16, choices=MATTER_KIND_CHOICES)
    title = models.CharField(_("title"), max_length=255)
    reference_code = models.CharField(_("reference code"), max_length=64)
    status = models.CharField(_("status"), max_length=32, choices=MATTER_STATUS_CHOICES)
    priority = models.CharField(_("priority"), max_length=16, choices=PRIORITY_CHOICES)
    owner = models.ForeignKey(
        "organizations.Membership",
        on_delete=models.PROTECT,
        related_name="owned_matters",
        verbose_name=_("owner"),
    )
    description = models.TextField(_("description"), blank=True)
    opened_on = models.DateField(_("opened on"), blank=True, null=True)
    closed_on = models.DateField(_("closed on"), blank=True, null=True)
    version = models.PositiveIntegerField(_("version"), default=1)
    archived_at = models.DateTimeField(_("archived at"), blank=True, null=True)
    archived_by = models.ForeignKey(
        "organizations.Membership",
        on_delete=models.PROTECT,
        blank=True,
        null=True,
        related_name="archived_matters",
        verbose_name=_("archived by"),
    )
    created_by = models.ForeignKey(
        "organizations.Membership",
        on_delete=models.PROTECT,
        related_name="created_matters",
        verbose_name=_("created by"),
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=("organization", "reference_code"),
                name="matters_matter_unique_organization_reference",
            ),
            models.CheckConstraint(
                condition=Q(version__gte=1), name="matters_matter_version_gte_1"
            ),
        ]
        indexes = [
            models.Index(fields=("organization", "reference_code"), name="matter_org_ref_idx"),
            models.Index(fields=("organization", "status"), name="matter_org_status_idx"),
            models.Index(fields=("organization", "owner"), name="matter_org_owner_idx"),
            models.Index(
                fields=("organization", "kind", "status"), name="matter_org_kind_status_idx"
            ),
        ]
        ordering = ("reference_code",)
        verbose_name = _("matter")
        verbose_name_plural = _("matters")

    def clean(self) -> None:
        validate_membership_organization(
            membership=self.owner,
            organization=self.organization,
            field_name="owner",
        )
        validate_optional_membership_organization(
            membership=self.created_by,
            organization=self.organization,
            field_name="created_by",
        )
        validate_optional_membership_organization(
            membership=self.archived_by,
            organization=self.organization,
            field_name="archived_by",
        )

    def __str__(self) -> str:
        return self.reference_code


class MatterAccess(CommonModel):
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.PROTECT,
        related_name="matter_access_grants",
        verbose_name=_("organization"),
    )
    matter = models.ForeignKey(
        Matter,
        on_delete=models.PROTECT,
        related_name="access_grants",
        verbose_name=_("matter"),
    )
    membership = models.ForeignKey(
        "organizations.Membership",
        on_delete=models.PROTECT,
        related_name="matter_access_grants",
        verbose_name=_("membership"),
    )
    level = models.CharField(_("level"), max_length=8, choices=MATTER_ACCESS_LEVEL_CHOICES)
    granted_by = models.ForeignKey(
        "organizations.Membership",
        on_delete=models.PROTECT,
        related_name="granted_matter_access",
        verbose_name=_("granted by"),
    )
    revoked_at = models.DateTimeField(_("revoked at"), blank=True, null=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=("matter", "membership"),
                condition=Q(revoked_at__isnull=True),
                name="matters_access_unique_active_matter_membership",
            ),
        ]
        indexes = [
            models.Index(fields=("organization", "membership"), name="access_org_membership_idx"),
            models.Index(fields=("matter", "revoked_at"), name="access_matter_revoked_idx"),
        ]
        ordering = ("matter__reference_code", "membership__user__username")
        verbose_name = _("matter access")
        verbose_name_plural = _("matter access grants")

    def clean(self) -> None:
        validate_matter_organization(
            matter=self.matter,
            organization=self.organization,
            field_name="matter",
        )
        validate_membership_organization(
            membership=self.membership,
            organization=self.organization,
            field_name="membership",
        )
        validate_membership_organization(
            membership=self.granted_by,
            organization=self.organization,
            field_name="granted_by",
        )

    def __str__(self) -> str:
        return f"{self.membership_id} {self.level} {self.matter_id}"


class MatterRelation(CommonModel):
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.PROTECT,
        related_name="matter_relations",
        verbose_name=_("organization"),
    )
    source = models.ForeignKey(
        Matter,
        on_delete=models.PROTECT,
        related_name="outgoing_relations",
        verbose_name=_("source matter"),
    )
    target = models.ForeignKey(
        Matter,
        on_delete=models.PROTECT,
        related_name="incoming_relations",
        verbose_name=_("target matter"),
    )
    relation_type = models.CharField(
        _("relation type"),
        max_length=32,
        choices=MATTER_RELATION_TYPE_CHOICES,
    )

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=~Q(source=F("target")),
                name="matters_relation_source_not_target",
            ),
            models.UniqueConstraint(
                fields=("organization", "source", "target", "relation_type"),
                name="matters_relation_unique_org_source_target_type",
            ),
        ]
        indexes = [
            models.Index(fields=("organization", "source"), name="relation_org_source_idx"),
            models.Index(fields=("organization", "target"), name="relation_org_target_idx"),
        ]
        ordering = ("source__reference_code", "target__reference_code")
        verbose_name = _("matter relation")
        verbose_name_plural = _("matter relations")

    def clean(self) -> None:
        if self.source_id == self.target_id:
            raise ValidationError({"target": _("A matter cannot relate to itself.")})
        validate_matter_organization(
            matter=self.source,
            organization=self.organization,
            field_name="source",
        )
        validate_matter_organization(
            matter=self.target,
            organization=self.organization,
            field_name="target",
        )

    def __str__(self) -> str:
        return f"{self.source_id} {self.relation_type} {self.target_id}"


def validate_membership_organization(*, membership, organization, field_name: str) -> None:
    if membership.organization_id != organization.id:
        raise ValidationError({field_name: _("Membership must belong to the matter organization.")})


def validate_optional_membership_organization(*, membership, organization, field_name: str) -> None:
    if membership is not None:
        validate_membership_organization(
            membership=membership,
            organization=organization,
            field_name=field_name,
        )


def validate_matter_organization(*, matter, organization, field_name: str) -> None:
    if matter.organization_id != organization.id:
        raise ValidationError({field_name: _("Matter must belong to the relation organization.")})
