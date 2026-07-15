"""Private document upload models."""

from __future__ import annotations

from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q
from django.utils.translation import gettext_lazy as _

from common.models import CommonModel

UPLOAD_STATUS_INITIATED = "initiated"
UPLOAD_STATUS_VERIFYING = "verifying"
UPLOAD_STATUS_PROCESSING = "processing"
UPLOAD_STATUS_AVAILABLE = "available"
UPLOAD_STATUS_FAILED = "failed"
UPLOAD_STATUS_EXPIRED = "expired"
UPLOAD_STATUS_CANCELLED = "cancelled"
UPLOAD_STATUS_CHOICES = (
    (UPLOAD_STATUS_INITIATED, _("Initiated")),
    (UPLOAD_STATUS_VERIFYING, _("Verifying")),
    (UPLOAD_STATUS_PROCESSING, _("Processing")),
    (UPLOAD_STATUS_AVAILABLE, _("Available")),
    (UPLOAD_STATUS_FAILED, _("Failed")),
    (UPLOAD_STATUS_EXPIRED, _("Expired")),
    (UPLOAD_STATUS_CANCELLED, _("Cancelled")),
)
ACTIVE_UPLOAD_STATUSES = (
    UPLOAD_STATUS_INITIATED,
    UPLOAD_STATUS_VERIFYING,
    UPLOAD_STATUS_PROCESSING,
)

DOCUMENT_STATUS_PROCESSING = "processing"
DOCUMENT_STATUS_AVAILABLE = "available"
DOCUMENT_STATUS_FAILED = "failed"
DOCUMENT_STATUS_REVOKED = "revoked"
DOCUMENT_STATUS_CHOICES = (
    (DOCUMENT_STATUS_PROCESSING, _("Processing")),
    (DOCUMENT_STATUS_AVAILABLE, _("Available")),
    (DOCUMENT_STATUS_FAILED, _("Failed")),
    (DOCUMENT_STATUS_REVOKED, _("Revoked")),
)


class UploadSession(CommonModel):
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.PROTECT,
        related_name="upload_sessions",
        verbose_name=_("organization"),
    )
    matter = models.ForeignKey(
        "matters.Matter",
        on_delete=models.PROTECT,
        related_name="upload_sessions",
        verbose_name=_("matter"),
    )
    requested_by = models.ForeignKey(
        "organizations.Membership",
        on_delete=models.PROTECT,
        related_name="upload_sessions",
        verbose_name=_("requested by"),
    )
    object_key = models.CharField(_("object key"), max_length=255, unique=True)
    original_filename = models.CharField(_("original filename"), max_length=255)
    expected_size = models.PositiveBigIntegerField(_("expected size"))
    expected_content_type = models.CharField(_("expected content type"), max_length=127)
    expected_checksum = models.CharField(_("expected checksum"), max_length=128, blank=True)
    description = models.TextField(_("description"), blank=True)
    status = models.CharField(
        _("status"),
        max_length=16,
        choices=UPLOAD_STATUS_CHOICES,
        default=UPLOAD_STATUS_INITIATED,
    )
    expires_at = models.DateTimeField(_("expires at"))
    completed_at = models.DateTimeField(_("completed at"), blank=True, null=True)
    failure_code = models.CharField(_("failure code"), max_length=64, blank=True)

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=Q(expected_size__gt=0),
                name="documents_upload_expected_size_gt_0",
            ),
        ]
        indexes = [
            models.Index(
                fields=("organization", "status", "expires_at"),
                name="upload_org_status_exp_idx",
            ),
            models.Index(
                fields=("matter", "status", "-created_at"),
                name="upload_matter_status_idx",
            ),
            models.Index(
                fields=("requested_by", "status", "expires_at"),
                name="upload_requester_status_idx",
            ),
        ]
        ordering = ("-created_at",)
        verbose_name = _("upload session")
        verbose_name_plural = _("upload sessions")

    def clean(self) -> None:
        if self.matter_id and self.matter.organization_id != self.organization_id:
            raise ValidationError({"matter": _("Matter must belong to the organization.")})
        if self.requested_by_id and self.requested_by.organization_id != self.organization_id:
            raise ValidationError({"requested_by": _("Requester must belong to the organization.")})

    def __str__(self) -> str:
        return f"{self.id}:{self.status}"


class Document(CommonModel):
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.PROTECT,
        related_name="documents",
        verbose_name=_("organization"),
    )
    matter = models.ForeignKey(
        "matters.Matter",
        on_delete=models.PROTECT,
        related_name="documents",
        verbose_name=_("matter"),
    )
    upload_session = models.OneToOneField(
        UploadSession,
        on_delete=models.PROTECT,
        related_name="document",
        verbose_name=_("upload session"),
    )
    object_key = models.CharField(_("object key"), max_length=255, unique=True)
    original_filename = models.CharField(_("original filename"), max_length=255)
    content_type = models.CharField(_("content type"), max_length=127)
    size = models.PositiveBigIntegerField(_("size"))
    checksum = models.CharField(_("checksum"), max_length=128, blank=True)
    status = models.CharField(
        _("status"),
        max_length=16,
        choices=DOCUMENT_STATUS_CHOICES,
        default=DOCUMENT_STATUS_PROCESSING,
    )
    description = models.TextField(_("description"), blank=True)
    uploaded_by = models.ForeignKey(
        "organizations.Membership",
        on_delete=models.PROTECT,
        related_name="uploaded_documents",
        verbose_name=_("uploaded by"),
    )
    available_at = models.DateTimeField(_("available at"), blank=True, null=True)
    revoked_at = models.DateTimeField(_("revoked at"), blank=True, null=True)
    revoked_by = models.ForeignKey(
        "organizations.Membership",
        on_delete=models.PROTECT,
        blank=True,
        null=True,
        related_name="revoked_documents",
        verbose_name=_("revoked by"),
    )

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=Q(size__gt=0),
                name="documents_document_size_gt_0",
            ),
        ]
        indexes = [
            models.Index(
                fields=("organization", "status", "-created_at"),
                name="doc_org_status_created_idx",
            ),
            models.Index(
                fields=("matter", "status", "-created_at"),
                name="doc_matter_status_idx",
            ),
            models.Index(
                fields=("organization", "original_filename"),
                name="doc_org_filename_idx",
            ),
        ]
        ordering = ("-created_at",)
        verbose_name = _("document")
        verbose_name_plural = _("documents")

    def clean(self) -> None:
        if self.matter_id and self.matter.organization_id != self.organization_id:
            raise ValidationError({"matter": _("Matter must belong to the organization.")})
        if self.uploaded_by_id and self.uploaded_by.organization_id != self.organization_id:
            raise ValidationError({"uploaded_by": _("Uploader must belong to the organization.")})
        if self.revoked_by_id and self.revoked_by.organization_id != self.organization_id:
            raise ValidationError({"revoked_by": _("Revoker must belong to the organization.")})
        if self.upload_session_id:
            validate_upload_session_document(document=self)

    def __str__(self) -> str:
        return self.original_filename


def validate_upload_session_document(*, document: Document) -> None:
    upload = document.upload_session
    if upload.organization_id != document.organization_id:
        raise ValidationError({"upload_session": _("Upload must belong to the organization.")})
    if upload.matter_id != document.matter_id:
        raise ValidationError({"upload_session": _("Upload must belong to the matter.")})
