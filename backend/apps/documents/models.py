"""Private document models and direct upload intent state."""

from __future__ import annotations

from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q
from django.utils.translation import gettext_lazy as _

from common.models import CommonModel

DOCUMENT_STATUS_PENDING_UPLOAD = "pending_upload"
DOCUMENT_STATUS_VERIFYING = "verifying"
DOCUMENT_STATUS_AVAILABLE = "available"
DOCUMENT_STATUS_FAILED = "failed"
DOCUMENT_STATUS_EXPIRED = "expired"
DOCUMENT_STATUS_CANCELLED = "cancelled"
DOCUMENT_STATUS_CHOICES = (
    (DOCUMENT_STATUS_PENDING_UPLOAD, _("Pending upload")),
    (DOCUMENT_STATUS_VERIFYING, _("Verifying")),
    (DOCUMENT_STATUS_AVAILABLE, _("Available")),
    (DOCUMENT_STATUS_FAILED, _("Failed")),
    (DOCUMENT_STATUS_EXPIRED, _("Expired")),
    (DOCUMENT_STATUS_CANCELLED, _("Cancelled")),
)
ACTIVE_DOCUMENT_UPLOAD_STATUSES = (
    DOCUMENT_STATUS_PENDING_UPLOAD,
    DOCUMENT_STATUS_VERIFYING,
)


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
    object_key = models.CharField(_("object key"), max_length=255, unique=True)
    original_filename = models.CharField(_("original filename"), max_length=255)
    content_type = models.CharField(_("content type"), max_length=127)
    expected_size = models.PositiveBigIntegerField(_("expected size"))
    actual_size = models.PositiveBigIntegerField(_("actual size"), blank=True, null=True)
    expected_checksum = models.CharField(_("expected checksum"), max_length=128, blank=True)
    actual_checksum = models.CharField(_("actual checksum"), max_length=128, blank=True)
    etag = models.CharField(_("ETag"), max_length=128, blank=True)
    status = models.CharField(
        _("status"),
        max_length=16,
        choices=DOCUMENT_STATUS_CHOICES,
        default=DOCUMENT_STATUS_PENDING_UPLOAD,
    )
    description = models.TextField(_("description"), blank=True)
    uploaded_by = models.ForeignKey(
        "organizations.Membership",
        on_delete=models.PROTECT,
        related_name="uploaded_documents",
        verbose_name=_("uploaded by"),
    )
    upload_expires_at = models.DateTimeField(_("upload expires at"), blank=True, null=True)
    uploaded_at = models.DateTimeField(_("uploaded at"), blank=True, null=True)
    failure_code = models.CharField(_("failure code"), max_length=64, blank=True)

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=Q(expected_size__gt=0),
                name="documents_document_expected_size_gt_0",
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
            models.Index(
                fields=("organization", "status", "upload_expires_at"),
                name="doc_org_status_exp_idx",
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

    def __str__(self) -> str:
        return self.original_filename
