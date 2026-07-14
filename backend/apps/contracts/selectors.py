"""Read selectors for contracts."""

from __future__ import annotations

from django.db.models import F
from rest_framework.exceptions import NotFound

from apps.activity.models import ActivityLog
from apps.contracts.models import Contract
from apps.matters.models import KIND_CONTRACT, Matter
from apps.matters.permissions import filter_visible_matters
from apps.organizations.permissions import resolve_active_membership


def contract_base_queryset():
    return Contract.objects.select_related(
        "matter",
        "matter__organization",
        "matter__owner",
        "matter__owner__user",
        "matter__created_by",
        "matter__created_by__user",
        "matter__archived_by",
        "matter__archived_by__user",
    ).prefetch_related("matter__access_grants")


def contract_list(*, actor, organization):
    membership = resolve_active_membership(actor=actor, organization=organization)
    matters = Matter.objects.filter(organization=organization, kind=KIND_CONTRACT)
    visible_matters = filter_visible_matters(queryset=matters, membership=membership)
    return (
        contract_base_queryset()
        .filter(matter__in=visible_matters)
        .annotate(
            created_at=F("matter__created_at"),
            updated_at=F("matter__updated_at"),
            priority=F("matter__priority"),
            reference_code=F("matter__reference_code"),
        )
    )


def contract_get(*, actor, organization, contract_id) -> Contract:
    contract = (
        contract_list(actor=actor, organization=organization).filter(matter_id=contract_id).first()
    )
    if contract is None:
        raise NotFound("Not found.")
    return contract


def contract_timeline(*, actor, organization, contract_id):
    contract = contract_get(actor=actor, organization=organization, contract_id=contract_id)
    return (
        ActivityLog.objects.select_related("actor_membership", "actor_user", "matter")
        .filter(organization=organization, matter=contract.matter)
        .order_by("-created_at")
    )
