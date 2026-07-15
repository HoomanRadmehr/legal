"""Filters for activity endpoints."""

from __future__ import annotations

from django_filters import rest_framework as filters

from apps.activity.models import ActivityLog
from common.api.filters import CommonFilterSet


class ActivityFilter(CommonFilterSet):
    action = filters.CharFilter(field_name="action")
    actor = filters.UUIDFilter(field_name="actor_membership_id")
    matter = filters.UUIDFilter(field_name="matter_id")
    target_type = filters.CharFilter(field_name="target_type")
    target_id = filters.UUIDFilter(field_name="target_id")
    created_after = filters.IsoDateTimeFilter(field_name="created_at", lookup_expr="gte")
    created_before = filters.IsoDateTimeFilter(field_name="created_at", lookup_expr="lte")

    class Meta:
        model = ActivityLog
        fields = (
            "action",
            "actor",
            "matter",
            "target_type",
            "target_id",
            "created_after",
            "created_before",
        )
