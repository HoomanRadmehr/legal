"""Read selectors for legal notices."""

from __future__ import annotations

from django.db.models import F
from rest_framework.exceptions import NotFound

from apps.activity.models import ActivityLog
from apps.matters.models import KIND_NOTICE, Matter
from apps.matters.permissions import filter_visible_matters
from apps.notices.models import LegalNotice
from apps.organizations.permissions import resolve_active_membership


def notice_base_queryset():
    return LegalNotice.objects.select_related(
        "matter",
        "matter__organization",
        "matter__owner",
        "matter__owner__user",
        "matter__created_by",
        "matter__created_by__user",
        "matter__archived_by",
        "matter__archived_by__user",
        "linked_deadline",
        "linked_deadline__assignee",
    ).prefetch_related("matter__outgoing_relations")


def notice_list(*, actor, organization):
    membership = resolve_active_membership(actor=actor, organization=organization)
    matters = Matter.objects.filter(organization=organization, kind=KIND_NOTICE)
    visible_matters = filter_visible_matters(queryset=matters, membership=membership)
    return (
        notice_base_queryset()
        .filter(matter__in=visible_matters)
        .annotate(
            created_at=F("matter__created_at"),
            updated_at=F("matter__updated_at"),
            priority=F("matter__priority"),
            reference_code=F("matter__reference_code"),
        )
    )


def notice_get(*, actor, organization, notice_id) -> LegalNotice:
    notice = notice_list(actor=actor, organization=organization).filter(matter_id=notice_id).first()
    if notice is None:
        raise NotFound("Not found.")
    return notice


def notice_timeline(*, actor, organization, notice_id):
    notice = notice_get(actor=actor, organization=organization, notice_id=notice_id)
    return (
        ActivityLog.objects.select_related("actor_membership", "actor_user", "matter")
        .filter(organization=organization, matter=notice.matter)
        .order_by("-created_at")
    )
