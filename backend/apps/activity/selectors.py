"""Permission-scoped activity selectors."""

from __future__ import annotations

from django.db.models import Q

from apps.activity.models import ActivityLog
from apps.matters.models import Matter
from apps.matters.permissions import filter_visible_matters
from apps.matters.selectors import matter_get
from apps.organizations.permissions import is_admin_or_manager, resolve_active_membership


def activity_base_queryset():
    return ActivityLog.objects.select_related(
        "actor_membership",
        "actor_membership__user",
        "actor_user",
        "matter",
        "organization",
    )


def activity_list(*, actor, organization):
    membership = resolve_active_membership(actor=actor, organization=organization)
    matters = Matter.objects.filter(organization=organization)
    visible_matters = filter_visible_matters(queryset=matters, membership=membership)
    visible_query = Q(matter__in=visible_matters)
    if is_admin_or_manager(membership=membership):
        visible_query |= Q(matter__isnull=True)
    return (
        activity_base_queryset()
        .filter(organization=organization)
        .filter(visible_query)
        .order_by("-created_at")
    )


def matter_timeline(*, actor, organization, matter_id):
    matter = matter_get(actor=actor, organization=organization, matter_id=matter_id)
    return (
        activity_base_queryset()
        .filter(organization=organization, matter=matter)
        .order_by("-created_at")
    )
