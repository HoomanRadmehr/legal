"""Concrete deadline model."""

from __future__ import annotations

from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q
from django.utils.translation import gettext_lazy as _

from common.models import CommonModel

STATUS_OPEN = "open"
STATUS_COMPLETED = "completed"
STATUS_CANCELLED = "cancelled"
DEADLINE_STATUS_CHOICES = (
    (STATUS_OPEN, _("Open")),
    (STATUS_COMPLETED, _("Completed")),
    (STATUS_CANCELLED, _("Cancelled")),
)

PRIORITY_LOW = "low"
PRIORITY_NORMAL = "normal"
PRIORITY_HIGH = "high"
PRIORITY_CRITICAL = "critical"
DEADLINE_PRIORITY_CHOICES = (
    (PRIORITY_LOW, _("Low")),
    (PRIORITY_NORMAL, _("Normal")),
    (PRIORITY_HIGH, _("High")),
    (PRIORITY_CRITICAL, _("Critical")),
)


class Deadline(CommonModel):
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.PROTECT,
        related_name="deadlines",
        verbose_name=_("organization"),
    )
    matter = models.ForeignKey(
        "matters.Matter",
        on_delete=models.PROTECT,
        related_name="deadlines",
        verbose_name=_("matter"),
    )
    title = models.CharField(_("title"), max_length=255)
    description = models.TextField(_("description"), blank=True)
    due_at = models.DateTimeField(_("due at"))
    assignee = models.ForeignKey(
        "organizations.Membership",
        on_delete=models.PROTECT,
        related_name="assigned_deadlines",
        verbose_name=_("assignee"),
    )
    status = models.CharField(
        _("status"),
        max_length=16,
        choices=DEADLINE_STATUS_CHOICES,
        default=STATUS_OPEN,
    )
    priority = models.CharField(
        _("priority"),
        max_length=16,
        choices=DEADLINE_PRIORITY_CHOICES,
        default=PRIORITY_NORMAL,
    )
    reminder_enabled = models.BooleanField(_("reminder enabled"), default=True)
    completed_at = models.DateTimeField(_("completed at"), blank=True, null=True)
    completed_by = models.ForeignKey(
        "organizations.Membership",
        on_delete=models.PROTECT,
        blank=True,
        null=True,
        related_name="completed_deadlines",
        verbose_name=_("completed by"),
    )
    cancelled_at = models.DateTimeField(_("cancelled at"), blank=True, null=True)
    cancelled_by = models.ForeignKey(
        "organizations.Membership",
        on_delete=models.PROTECT,
        blank=True,
        null=True,
        related_name="cancelled_deadlines",
        verbose_name=_("cancelled by"),
    )
    version = models.PositiveIntegerField(_("version"), default=1)

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=Q(version__gte=1),
                name="deadlines_deadline_version_gte_1",
            ),
        ]
        indexes = [
            models.Index(
                fields=("organization", "status", "due_at"), name="deadline_org_status_due_idx"
            ),
            models.Index(
                fields=("organization", "assignee", "status", "due_at"),
                name="deadline_org_assignee_idx",
            ),
            models.Index(
                fields=("organization", "matter", "status"), name="deadline_org_matter_idx"
            ),
            models.Index(fields=("priority",), name="deadline_priority_idx"),
        ]
        ordering = ("due_at", "created_at")
        verbose_name = _("deadline")
        verbose_name_plural = _("deadlines")

    def clean(self) -> None:
        validate_member_organization(
            membership=self.assignee,
            organization_id=self.organization_id,
            field_name="assignee",
        )
        validate_optional_member_organization(
            membership=self.completed_by,
            organization_id=self.organization_id,
            field_name="completed_by",
        )
        validate_optional_member_organization(
            membership=self.cancelled_by,
            organization_id=self.organization_id,
            field_name="cancelled_by",
        )
        if self.matter_id and self.matter.organization_id != self.organization_id:
            raise ValidationError({"matter": _("Matter must belong to the organization.")})

    def __str__(self) -> str:
        return self.title


def validate_member_organization(*, membership, organization_id, field_name: str) -> None:
    if membership is None:
        return
    if membership.organization_id != organization_id:
        raise ValidationError({field_name: _("Membership must belong to the organization.")})


def validate_optional_member_organization(*, membership, organization_id, field_name: str) -> None:
    if membership is not None:
        validate_member_organization(
            membership=membership,
            organization_id=organization_id,
            field_name=field_name,
        )
