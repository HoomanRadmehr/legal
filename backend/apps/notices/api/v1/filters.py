"""Explicit filter allowlist for legal notices."""

from __future__ import annotations

from django.db.models import Q
from django.utils import timezone
from django_filters import rest_framework as django_filters

from apps.deadlines.models import STATUS_OPEN
from apps.notices.models import LegalNotice
from common.api.filters import CommonFilterSet


class NoticeFilter(CommonFilterSet):
    sender = django_filters.CharFilter(field_name="sender", lookup_expr="icontains")
    response_status = django_filters.CharFilter(field_name="response_status")
    owner = django_filters.UUIDFilter(field_name="matter__owner_id")
    status = django_filters.CharFilter(field_name="matter__status")
    received_after = django_filters.DateFilter(field_name="received_date", lookup_expr="gte")
    received_before = django_filters.DateFilter(field_name="received_date", lookup_expr="lte")
    response_deadline_after = django_filters.IsoDateTimeFilter(
        field_name="response_deadline",
        lookup_expr="gte",
    )
    response_deadline_before = django_filters.IsoDateTimeFilter(
        field_name="response_deadline",
        lookup_expr="lte",
    )
    overdue = django_filters.BooleanFilter(method="filter_overdue")
    archived = django_filters.BooleanFilter(method="filter_archived")
    search = django_filters.CharFilter(method="filter_search")

    class Meta:
        model = LegalNotice
        fields = (
            "sender",
            "response_status",
            "owner",
            "status",
            "received_after",
            "received_before",
            "response_deadline_after",
            "response_deadline_before",
            "overdue",
            "archived",
            "search",
        )

    def filter_overdue(self, queryset, name, value):
        if not value:
            return queryset
        return queryset.filter(
            linked_deadline__status=STATUS_OPEN,
            linked_deadline__due_at__lt=timezone.now(),
        )

    def filter_archived(self, queryset, name, value):
        if value:
            return queryset.filter(matter__archived_at__isnull=False)
        return queryset.filter(matter__archived_at__isnull=True)

    def filter_search(self, queryset, name, value):
        return queryset.filter(
            Q(matter__title__icontains=value) | Q(matter__reference_code__icontains=value)
        )
