"""Filters for notification endpoints."""

from __future__ import annotations

from django_filters import rest_framework as filters

from apps.notifications.models import Notification
from common.api.filters import CommonFilterSet


class NotificationFilter(CommonFilterSet):
    unread = filters.BooleanFilter(method="filter_unread")

    class Meta:
        model = Notification
        fields = ("event_type", "unread")

    def filter_unread(self, queryset, name, value):
        if value:
            return queryset.filter(read_at__isnull=True)
        return queryset
