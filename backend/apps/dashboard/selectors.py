"""Permission-aware dashboard aggregate selectors."""

from __future__ import annotations

from datetime import timedelta

from django.db.models import Q
from django.utils import timezone

from apps.accounts.selectors import get_current_membership
from apps.activity.models import ActivityLog
from apps.cases.selectors import case_list
from apps.contracts.selectors import contract_list
from apps.deadlines.selectors import (
    deadline_list_assigned_to_me,
    deadline_list_overdue,
    deadline_list_today,
    deadline_list_upcoming,
)
from apps.matters.models import PRIORITY_CRITICAL, PRIORITY_HIGH, STATUS_OPEN
from apps.matters.selectors import matter_list
from apps.notices.models import RESPONSE_STATUS_PENDING
from apps.notices.selectors import notice_list
from apps.tasks.models import OPEN_TASK_STATUSES
from apps.tasks.selectors import task_list_assigned_to_me

CONTRACT_HORIZON_DAYS = 90
RECENT_ACTIVITY_LIMIT = 10


def dashboard_summary(*, actor):
    membership = current_membership(actor=actor)
    if membership is None:
        return empty_dashboard()
    organization = membership.organization
    now = timezone.now()
    return {
        "cases": case_summary(actor=actor, organization=organization),
        "contracts": contract_summary(actor=actor, organization=organization, now=now),
        "notices": notice_summary(actor=actor, organization=organization, now=now),
        "deadlines": deadline_summary(actor=actor, organization=organization, now=now),
        "tasks": task_summary(actor=actor, organization=organization, now=now),
        "recent_activity": recent_activity(actor=actor, organization=organization),
    }


def case_summary(*, actor, organization) -> dict:
    cases = case_list(actor=actor, organization=organization)
    return {
        "total": cases.count(),
        "open": cases.filter(matter__status=STATUS_OPEN).count(),
        "high_priority": cases.filter(
            matter__priority__in=(PRIORITY_HIGH, PRIORITY_CRITICAL)
        ).count(),
    }


def contract_summary(*, actor, organization, now) -> dict:
    contracts = contract_list(actor=actor, organization=organization)
    today = now.date()
    horizon = now.date() + timedelta(days=CONTRACT_HORIZON_DAYS)
    expiring_query = Q(expiration_date__gte=today, expiration_date__lte=horizon) | Q(
        renewal_date__gte=today,
        renewal_date__lte=horizon,
    )
    return {
        "total": contracts.count(),
        "expiring_soon": contracts.filter(expiring_query).count(),
    }


def notice_summary(*, actor, organization, now) -> dict:
    notices = notice_list(actor=actor, organization=organization)
    open_notices = notices.filter(response_status=RESPONSE_STATUS_PENDING)
    return {
        "open": open_notices.count(),
        "response_overdue": open_notices.filter(response_deadline__lt=now).count(),
    }


def deadline_summary(*, actor, organization, now) -> dict:
    return {
        "today": deadline_list_today(actor=actor, organization=organization, now=now).count(),
        "overdue": deadline_list_overdue(actor=actor, organization=organization, now=now).count(),
        "upcoming": deadline_list_upcoming(actor=actor, organization=organization, now=now).count(),
        "assigned_to_me": deadline_list_assigned_to_me(
            actor=actor, organization=organization
        ).count(),
    }


def task_summary(*, actor, organization, now) -> dict:
    tasks = task_list_assigned_to_me(actor=actor, organization=organization)
    return {
        "assigned_to_me": tasks.count(),
        "overdue": tasks.filter(
            due_at__lt=now,
            status__in=OPEN_TASK_STATUSES,
        ).count(),
    }


def recent_activity(*, actor, organization):
    visible_matters = matter_list(actor=actor, organization=organization)
    return (
        ActivityLog.objects.filter(organization=organization, matter__in=visible_matters)
        .select_related("actor_membership", "actor_user", "matter")
        .order_by("-created_at")[:RECENT_ACTIVITY_LIMIT]
    )


def current_membership(*, actor):
    return get_current_membership(user=actor)


def empty_dashboard() -> dict:
    return {
        "cases": {"total": 0, "open": 0, "high_priority": 0},
        "contracts": {"total": 0, "expiring_soon": 0},
        "notices": {"open": 0, "response_overdue": 0},
        "deadlines": {"today": 0, "overdue": 0, "upcoming": 0, "assigned_to_me": 0},
        "tasks": {"assigned_to_me": 0, "overdue": 0},
        "recent_activity": [],
    }
