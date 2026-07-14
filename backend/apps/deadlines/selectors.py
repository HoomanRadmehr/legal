"""Read selectors for deadlines."""

from __future__ import annotations

from datetime import UTC, datetime, time, timedelta
from zoneinfo import ZoneInfo

from django.utils import timezone
from rest_framework.exceptions import NotFound

from apps.deadlines.models import STATUS_OPEN, Deadline
from apps.matters.models import Matter
from apps.matters.permissions import filter_visible_matters
from apps.organizations.permissions import resolve_active_membership


def deadline_base_queryset():
    return Deadline.objects.select_related(
        "organization",
        "matter",
        "matter__owner",
        "assignee",
        "assignee__user",
        "completed_by",
        "completed_by__user",
        "cancelled_by",
        "cancelled_by__user",
    )


def deadline_list(*, actor, organization):
    membership = resolve_active_membership(actor=actor, organization=organization)
    matters = Matter.objects.filter(organization=organization)
    visible_matters = filter_visible_matters(queryset=matters, membership=membership)
    return deadline_base_queryset().filter(organization=organization, matter__in=visible_matters)


def deadline_get(*, actor, organization, deadline_id) -> Deadline:
    deadline = deadline_list(actor=actor, organization=organization).filter(id=deadline_id).first()
    if deadline is None:
        raise NotFound("Not found.")
    return deadline


def deadline_list_today(*, actor, organization, now=None, include_closed: bool = False):
    start_at, end_at = organization_day_bounds(organization=organization, now=now)
    queryset = deadline_list(actor=actor, organization=organization).filter(
        due_at__gte=start_at,
        due_at__lt=end_at,
    )
    return maybe_open_deadlines(queryset=queryset, include_closed=include_closed)


def deadline_list_upcoming(*, actor, organization, now=None, include_closed: bool = False):
    current_time = now or timezone.now()
    queryset = deadline_list(actor=actor, organization=organization).filter(due_at__gt=current_time)
    return maybe_open_deadlines(queryset=queryset, include_closed=include_closed)


def deadline_list_overdue(*, actor, organization, now=None, include_closed: bool = False):
    current_time = now or timezone.now()
    queryset = deadline_list(actor=actor, organization=organization).filter(due_at__lt=current_time)
    return maybe_open_deadlines(queryset=queryset, include_closed=include_closed)


def deadline_list_assigned_to_me(*, actor, organization, include_closed: bool = False):
    membership = resolve_active_membership(actor=actor, organization=organization)
    queryset = deadline_list(actor=actor, organization=organization).filter(assignee=membership)
    return maybe_open_deadlines(queryset=queryset, include_closed=include_closed)


def maybe_open_deadlines(*, queryset, include_closed: bool):
    if include_closed:
        return queryset
    return queryset.filter(status=STATUS_OPEN)


def organization_day_bounds(*, organization, now=None):
    current_time = now or timezone.now()
    organization_zone = ZoneInfo(organization.timezone)
    local_time = current_time.astimezone(organization_zone)
    local_start = datetime.combine(local_time.date(), time.min, tzinfo=organization_zone)
    local_end = local_start + timedelta(days=1)
    return local_start.astimezone(UTC), local_end.astimezone(UTC)
