"""Concrete matter-linked task model."""

from __future__ import annotations

from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q
from django.utils.translation import gettext_lazy as _

from common.models import CommonModel

STATUS_TODO = "todo"
STATUS_IN_PROGRESS = "in_progress"
STATUS_DONE = "done"
STATUS_CANCELLED = "cancelled"
TASK_STATUS_CHOICES = (
    (STATUS_TODO, _("To do")),
    (STATUS_IN_PROGRESS, _("In progress")),
    (STATUS_DONE, _("Done")),
    (STATUS_CANCELLED, _("Cancelled")),
)
OPEN_TASK_STATUSES = (STATUS_TODO, STATUS_IN_PROGRESS)


class Task(CommonModel):
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.PROTECT,
        related_name="tasks",
        verbose_name=_("organization"),
    )
    matter = models.ForeignKey(
        "matters.Matter",
        on_delete=models.PROTECT,
        related_name="tasks",
        verbose_name=_("matter"),
    )
    title = models.CharField(_("title"), max_length=255)
    description = models.TextField(_("description"), blank=True)
    assignee = models.ForeignKey(
        "organizations.Membership",
        on_delete=models.PROTECT,
        related_name="assigned_tasks",
        verbose_name=_("assignee"),
    )
    due_at = models.DateTimeField(_("due at"), blank=True, null=True)
    status = models.CharField(
        _("status"),
        max_length=16,
        choices=TASK_STATUS_CHOICES,
        default=STATUS_TODO,
    )
    completed_at = models.DateTimeField(_("completed at"), blank=True, null=True)
    completed_by = models.ForeignKey(
        "organizations.Membership",
        on_delete=models.PROTECT,
        blank=True,
        null=True,
        related_name="completed_tasks",
        verbose_name=_("completed by"),
    )
    cancelled_at = models.DateTimeField(_("cancelled at"), blank=True, null=True)
    cancelled_by = models.ForeignKey(
        "organizations.Membership",
        on_delete=models.PROTECT,
        blank=True,
        null=True,
        related_name="cancelled_tasks",
        verbose_name=_("cancelled by"),
    )
    version = models.PositiveIntegerField(_("version"), default=1)

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=Q(version__gte=1),
                name="tasks_task_version_gte_1",
            ),
        ]
        indexes = [
            models.Index(
                fields=("organization", "status", "due_at"), name="task_org_status_due_idx"
            ),
            models.Index(
                fields=("organization", "assignee", "status"), name="task_org_assignee_idx"
            ),
            models.Index(fields=("organization", "matter", "status"), name="task_org_matter_idx"),
        ]
        ordering = ("due_at", "created_at")
        verbose_name = _("task")
        verbose_name_plural = _("tasks")

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
