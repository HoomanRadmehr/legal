"""Append-only activity and transactional outbox models."""

from __future__ import annotations

from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from common.models import CommonModel

ACTION_CASE_CREATED = "case.created"
ACTION_CASE_UPDATED = "case.updated"
ACTION_MATTER_ARCHIVED = "matter.archived"
ACTION_MATTER_OWNER_CHANGED = "matter.owner_changed"
ACTION_MATTER_ACCESS_GRANTED = "matter.access_granted"
ACTION_MATTER_ACCESS_REVOKED = "matter.access_revoked"
ACTION_CONTRACT_CREATED = "contract.created"
ACTION_CONTRACT_UPDATED = "contract.updated"
ACTION_NOTICE_CREATED = "notice.created"
ACTION_NOTICE_RESPONSE_DEADLINE_CHANGED = "notice.response_deadline_changed"
ACTION_DEADLINE_CREATED = "deadline.created"
ACTION_DEADLINE_COMPLETED = "deadline.completed"
ACTION_TASK_CREATED = "task.created"
ACTION_TASK_COMPLETED = "task.completed"
ACTION_DOCUMENT_UPLOAD_INITIATED = "document.upload_initiated"
ACTION_DOCUMENT_UPLOAD_COMPLETED = "document.upload_completed"
ACTION_DOCUMENT_AVAILABLE = "document.available"
ACTION_DOCUMENT_DOWNLOAD_REQUESTED = "document.download_requested"
ACTION_OFFBOARDING_EXECUTED = "offboarding.executed"

ACTIVITY_ACTION_CHOICES = (
    (ACTION_CASE_CREATED, _("Case created")),
    (ACTION_CASE_UPDATED, _("Case updated")),
    (ACTION_MATTER_ARCHIVED, _("Matter archived")),
    (ACTION_MATTER_OWNER_CHANGED, _("Matter owner changed")),
    (ACTION_MATTER_ACCESS_GRANTED, _("Matter access granted")),
    (ACTION_MATTER_ACCESS_REVOKED, _("Matter access revoked")),
    (ACTION_CONTRACT_CREATED, _("Contract created")),
    (ACTION_CONTRACT_UPDATED, _("Contract updated")),
    (ACTION_NOTICE_CREATED, _("Notice created")),
    (ACTION_NOTICE_RESPONSE_DEADLINE_CHANGED, _("Notice response deadline changed")),
    (ACTION_DEADLINE_CREATED, _("Deadline created")),
    (ACTION_DEADLINE_COMPLETED, _("Deadline completed")),
    (ACTION_TASK_CREATED, _("Task created")),
    (ACTION_TASK_COMPLETED, _("Task completed")),
    (ACTION_DOCUMENT_UPLOAD_INITIATED, _("Document upload initiated")),
    (ACTION_DOCUMENT_UPLOAD_COMPLETED, _("Document upload completed")),
    (ACTION_DOCUMENT_AVAILABLE, _("Document available")),
    (ACTION_DOCUMENT_DOWNLOAD_REQUESTED, _("Document download requested")),
    (ACTION_OFFBOARDING_EXECUTED, _("Offboarding executed")),
)

IDEMPOTENCY_STATUS_STARTED = "started"
IDEMPOTENCY_STATUS_COMPLETED = "completed"
IDEMPOTENCY_STATUS_CHOICES = (
    (IDEMPOTENCY_STATUS_STARTED, _("Started")),
    (IDEMPOTENCY_STATUS_COMPLETED, _("Completed")),
)


class ActivityLog(CommonModel):
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.PROTECT,
        related_name="activity_logs",
        verbose_name=_("organization"),
    )
    matter = models.ForeignKey(
        "matters.Matter",
        on_delete=models.PROTECT,
        blank=True,
        null=True,
        related_name="activity_logs",
        verbose_name=_("matter"),
    )
    actor_membership = models.ForeignKey(
        "organizations.Membership",
        on_delete=models.PROTECT,
        blank=True,
        null=True,
        related_name="activity_logs",
        verbose_name=_("actor membership"),
    )
    actor_user = models.ForeignKey(
        "accounts.User",
        on_delete=models.PROTECT,
        blank=True,
        null=True,
        related_name="activity_logs",
        verbose_name=_("actor user"),
    )
    action = models.CharField(_("action"), max_length=64, choices=ACTIVITY_ACTION_CHOICES)
    target_type = models.CharField(_("target type"), max_length=64)
    target_id = models.UUIDField(_("target id"), blank=True, null=True)
    before_values = models.JSONField(_("before values"), default=dict, blank=True)
    after_values = models.JSONField(_("after values"), default=dict, blank=True)
    metadata = models.JSONField(_("metadata"), default=dict, blank=True)
    request_id = models.CharField(_("request id"), max_length=64, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=("organization", "-created_at"), name="activity_org_created_idx"),
            models.Index(fields=("matter", "-created_at"), name="activity_matter_created_idx"),
            models.Index(fields=("action", "-created_at"), name="activity_action_created_idx"),
        ]
        ordering = ("-created_at",)
        verbose_name = _("activity log")
        verbose_name_plural = _("activity logs")

    def save(self, *args, **kwargs):
        if self.pk and not self._state.adding:
            raise ValidationError(_("Activity logs are append-only."))
        return super().save(*args, **kwargs)

    def __str__(self) -> str:
        return self.action


class OutboxEvent(CommonModel):
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.PROTECT,
        blank=True,
        null=True,
        related_name="outbox_events",
        verbose_name=_("organization"),
    )
    event_type = models.CharField(_("event type"), max_length=128)
    event_version = models.PositiveSmallIntegerField(_("event version"), default=1)
    aggregate_type = models.CharField(_("aggregate type"), max_length=64)
    aggregate_id = models.UUIDField(_("aggregate id"))
    payload = models.JSONField(_("payload"), default=dict)
    available_at = models.DateTimeField(_("available at"), default=timezone.now)
    published_at = models.DateTimeField(_("published at"), blank=True, null=True)
    attempt_count = models.PositiveSmallIntegerField(_("attempt count"), default=0)
    last_error_code = models.CharField(_("last error code"), max_length=64, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=("published_at", "available_at"), name="outbox_publish_ready_idx"),
            models.Index(fields=("organization", "event_type"), name="outbox_org_event_type_idx"),
            models.Index(fields=("aggregate_type", "aggregate_id"), name="outbox_aggregate_idx"),
        ]
        ordering = ("available_at", "created_at")
        verbose_name = _("outbox event")
        verbose_name_plural = _("outbox events")

    def __str__(self) -> str:
        return self.event_type


class IdempotencyRecord(CommonModel):
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.PROTECT,
        related_name="idempotency_records",
        verbose_name=_("organization"),
    )
    actor_membership = models.ForeignKey(
        "organizations.Membership",
        on_delete=models.PROTECT,
        related_name="idempotency_records",
        verbose_name=_("actor membership"),
    )
    scope = models.CharField(_("scope"), max_length=128)
    key_hash = models.CharField(_("key hash"), max_length=64)
    request_hash = models.CharField(_("request hash"), max_length=64)
    status = models.CharField(
        _("status"),
        max_length=16,
        choices=IDEMPOTENCY_STATUS_CHOICES,
        default=IDEMPOTENCY_STATUS_STARTED,
    )
    response_status = models.PositiveSmallIntegerField(
        _("response status"),
        blank=True,
        null=True,
    )
    response_body = models.JSONField(_("response body"), default=dict, blank=True)
    expires_at = models.DateTimeField(_("expires at"))
    completed_at = models.DateTimeField(_("completed at"), blank=True, null=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=("organization", "actor_membership", "scope", "key_hash"),
                name="activity_idem_unique_org_actor_scope_key",
            ),
        ]
        indexes = [
            models.Index(
                fields=("organization", "actor_membership", "scope"),
                name="idem_org_actor_scope_idx",
            ),
            models.Index(fields=("expires_at",), name="idem_expires_at_idx"),
        ]
        ordering = ("-created_at",)
        verbose_name = _("idempotency record")
        verbose_name_plural = _("idempotency records")

    def clean(self) -> None:
        if self.actor_membership.organization_id != self.organization_id:
            raise ValidationError(
                {"actor_membership": _("Actor membership must belong to the organization.")}
            )

    def __str__(self) -> str:
        return f"{self.scope}:{self.key_hash[:12]}"
