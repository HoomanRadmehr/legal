"""Read selectors for matter-linked tasks."""

from __future__ import annotations

from rest_framework.exceptions import NotFound

from apps.matters.models import Matter
from apps.matters.permissions import filter_visible_matters
from apps.organizations.permissions import resolve_active_membership
from apps.tasks.models import OPEN_TASK_STATUSES, Task


def task_base_queryset():
    return Task.objects.select_related(
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


def task_list(*, actor, organization):
    membership = resolve_active_membership(actor=actor, organization=organization)
    matters = Matter.objects.filter(organization=organization)
    visible_matters = filter_visible_matters(queryset=matters, membership=membership)
    return task_base_queryset().filter(organization=organization, matter__in=visible_matters)


def task_get(*, actor, organization, task_id) -> Task:
    task = task_list(actor=actor, organization=organization).filter(id=task_id).first()
    if task is None:
        raise NotFound("Not found.")
    return task


def task_list_assigned_to_me(*, actor, organization, include_closed: bool = False):
    membership = resolve_active_membership(actor=actor, organization=organization)
    queryset = task_list(actor=actor, organization=organization).filter(assignee=membership)
    return maybe_open_tasks(queryset=queryset, include_closed=include_closed)


def maybe_open_tasks(*, queryset, include_closed: bool):
    if include_closed:
        return queryset
    return queryset.filter(status__in=OPEN_TASK_STATUSES)
