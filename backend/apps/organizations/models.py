"""Organization tenancy models."""

from __future__ import annotations

from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from common.models import CommonModel

LANGUAGE_ENGLISH = "en"
LANGUAGE_PERSIAN = "fa"
DEFAULT_LANGUAGE_CHOICES = (
    (LANGUAGE_ENGLISH, _("English")),
    (LANGUAGE_PERSIAN, _("Persian")),
)

ROLE_LEGAL_ADMIN = "legal_admin"
ROLE_LEGAL_MANAGER = "legal_manager"
ROLE_LEGAL_COUNSEL = "legal_counsel"
ROLE_VIEWER = "viewer"
MEMBERSHIP_ROLE_CHOICES = (
    (ROLE_LEGAL_ADMIN, _("Legal admin")),
    (ROLE_LEGAL_MANAGER, _("Legal manager")),
    (ROLE_LEGAL_COUNSEL, _("Legal counsel")),
    (ROLE_VIEWER, _("Viewer")),
)

STATUS_ACTIVE = "active"
STATUS_SUSPENDED = "suspended"
STATUS_OFFBOARDED = "offboarded"
MEMBERSHIP_STATUS_CHOICES = (
    (STATUS_ACTIVE, _("Active")),
    (STATUS_SUSPENDED, _("Suspended")),
    (STATUS_OFFBOARDED, _("Offboarded")),
)


def validate_timezone(value: str) -> None:
    try:
        ZoneInfo(value)
    except ZoneInfoNotFoundError as error:
        raise ValidationError(_("Enter a valid IANA timezone."), code="invalid_timezone") from error


class Organization(CommonModel):
    name = models.CharField(_("name"), max_length=255)
    timezone = models.CharField(
        _("timezone"),
        max_length=64,
        default="UTC",
        validators=[validate_timezone],
    )
    default_language = models.CharField(
        _("default language"),
        max_length=2,
        choices=DEFAULT_LANGUAGE_CHOICES,
        default=LANGUAGE_ENGLISH,
    )
    is_active = models.BooleanField(_("active"), default=True)

    class Meta:
        ordering = ("name",)
        verbose_name = _("organization")
        verbose_name_plural = _("organizations")

    def __str__(self) -> str:
        return self.name


class Membership(CommonModel):
    organization = models.ForeignKey(
        Organization,
        on_delete=models.PROTECT,
        related_name="memberships",
        verbose_name=_("organization"),
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="memberships",
        verbose_name=_("user"),
    )
    role = models.CharField(_("role"), max_length=32, choices=MEMBERSHIP_ROLE_CHOICES)
    status = models.CharField(
        _("status"),
        max_length=16,
        choices=MEMBERSHIP_STATUS_CHOICES,
        default=STATUS_ACTIVE,
    )
    joined_at = models.DateTimeField(_("joined at"), default=timezone.now)
    offboarded_at = models.DateTimeField(_("offboarded at"), blank=True, null=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=("organization", "user"),
                name="organizations_membership_unique_organization_user",
            ),
        ]
        indexes = [
            models.Index(
                fields=("organization", "status", "role"),
                name="org_membership_status_role_idx",
            ),
        ]
        ordering = ("organization__name", "user__username")
        verbose_name = _("membership")
        verbose_name_plural = _("memberships")

    def __str__(self) -> str:
        return f"{self.user} in {self.organization}"
