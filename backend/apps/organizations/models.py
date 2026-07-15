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

INVITATION_STATUS_PENDING = "pending"
INVITATION_STATUS_ACCEPTED = "accepted"
INVITATION_STATUS_EXPIRED = "expired"
INVITATION_STATUS_REVOKED = "revoked"
INVITATION_STATUS_CHOICES = (
    (INVITATION_STATUS_PENDING, _("Pending")),
    (INVITATION_STATUS_ACCEPTED, _("Accepted")),
    (INVITATION_STATUS_EXPIRED, _("Expired")),
    (INVITATION_STATUS_REVOKED, _("Revoked")),
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


class UserInvitation(CommonModel):
    organization = models.ForeignKey(
        Organization,
        on_delete=models.PROTECT,
        related_name="user_invitations",
        verbose_name=_("organization"),
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="user_invitations",
        verbose_name=_("user"),
    )
    membership = models.OneToOneField(
        Membership,
        on_delete=models.PROTECT,
        related_name="invitation",
        verbose_name=_("membership"),
    )
    invited_by = models.ForeignKey(
        Membership,
        on_delete=models.PROTECT,
        related_name="sent_invitations",
        verbose_name=_("invited by"),
    )
    token_hash = models.CharField(_("token hash"), max_length=64, unique=True)
    status = models.CharField(
        _("status"),
        max_length=16,
        choices=INVITATION_STATUS_CHOICES,
        default=INVITATION_STATUS_PENDING,
    )
    expires_at = models.DateTimeField(_("expires at"))
    accepted_at = models.DateTimeField(_("accepted at"), blank=True, null=True)

    class Meta:
        indexes = [
            models.Index(
                fields=("organization", "status", "expires_at"),
                name="org_invitation_status_exp_idx",
            ),
        ]
        ordering = ("-created_at",)
        verbose_name = _("user invitation")
        verbose_name_plural = _("user invitations")

    def clean(self) -> None:
        validate_invitation_member(
            organization_id=self.organization_id,
            membership=self.membership,
            field_name="membership",
        )
        validate_invitation_member(
            organization_id=self.organization_id,
            membership=self.invited_by,
            field_name="invited_by",
        )

    def __str__(self) -> str:
        return f"{self.user} invited to {self.organization}"


def validate_invitation_member(*, organization_id, membership, field_name: str) -> None:
    if membership is None:
        return
    if membership.organization_id != organization_id:
        raise ValidationError({field_name: _("Membership must belong to the organization.")})
