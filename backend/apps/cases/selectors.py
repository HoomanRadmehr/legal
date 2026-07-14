"""Read selectors for legal cases."""

from __future__ import annotations

from django.db.models import F
from rest_framework.exceptions import NotFound

from apps.activity.models import ActivityLog
from apps.cases.models import LegalCase
from apps.matters.models import KIND_CASE, Matter
from apps.matters.permissions import filter_visible_matters
from apps.organizations.permissions import resolve_active_membership


def case_base_queryset():
    return LegalCase.objects.select_related(
        "matter",
        "matter__organization",
        "matter__owner",
        "matter__owner__user",
        "matter__created_by",
        "matter__created_by__user",
        "matter__archived_by",
        "matter__archived_by__user",
    ).prefetch_related("parties", "matter__access_grants")


def case_list(*, actor, organization):
    membership = resolve_active_membership(actor=actor, organization=organization)
    matters = Matter.objects.filter(organization=organization, kind=KIND_CASE)
    visible_matters = filter_visible_matters(queryset=matters, membership=membership)
    return (
        case_base_queryset()
        .filter(matter__in=visible_matters)
        .annotate(
            created_at=F("matter__created_at"),
            updated_at=F("matter__updated_at"),
            priority=F("matter__priority"),
            reference_code=F("matter__reference_code"),
        )
    )


def case_get(*, actor, organization, case_id) -> LegalCase:
    legal_case = case_list(actor=actor, organization=organization).filter(matter_id=case_id).first()
    if legal_case is None:
        raise NotFound("Not found.")
    return legal_case


def case_timeline(*, actor, organization, case_id):
    legal_case = case_get(actor=actor, organization=organization, case_id=case_id)
    return (
        ActivityLog.objects.select_related("actor_membership", "actor_user", "matter")
        .filter(organization=organization, matter=legal_case.matter)
        .order_by("-created_at")
    )
