"""Explicit filter allowlist for deadlines."""

from __future__ import annotations

from django_filters import rest_framework as django_filters

from apps.deadlines.models import Deadline
from common.api.filters import CommonFilterSet


class DeadlineFilter(CommonFilterSet):
    matter = django_filters.UUIDFilter(field_name="matter_id")
    assignee = django_filters.UUIDFilter(field_name="assignee_id")
    status = django_filters.CharFilter(field_name="status")
    priority = django_filters.CharFilter(field_name="priority")
    due_after = django_filters.IsoDateTimeFilter(field_name="due_at", lookup_expr="gte")
    due_before = django_filters.IsoDateTimeFilter(field_name="due_at", lookup_expr="lte")

    class Meta:
        model = Deadline
        fields = (
            "matter",
            "assignee",
            "status",
            "priority",
            "due_after",
            "due_before",
        )
