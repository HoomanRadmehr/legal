"""Explicit filter allowlist for legal cases."""

from __future__ import annotations

from django.db.models import Q
from django_filters import rest_framework as django_filters

from apps.cases.models import LegalCase
from common.api.filters import CommonFilterSet


class CaseFilter(CommonFilterSet):
    status = django_filters.CharFilter(field_name="matter__status")
    priority = django_filters.CharFilter(field_name="matter__priority")
    owner = django_filters.UUIDFilter(field_name="matter__owner_id")
    case_type = django_filters.CharFilter(field_name="case_type")
    created_after = django_filters.IsoDateTimeFilter(
        field_name="matter__created_at",
        lookup_expr="gte",
    )
    created_before = django_filters.IsoDateTimeFilter(
        field_name="matter__created_at",
        lookup_expr="lte",
    )
    opened_after = django_filters.DateFilter(field_name="matter__opened_on", lookup_expr="gte")
    opened_before = django_filters.DateFilter(field_name="matter__opened_on", lookup_expr="lte")
    archived = django_filters.BooleanFilter(method="filter_archived")
    search = django_filters.CharFilter(method="filter_search")

    class Meta:
        model = LegalCase
        fields = (
            "status",
            "priority",
            "owner",
            "case_type",
            "created_after",
            "created_before",
            "opened_after",
            "opened_before",
            "archived",
            "search",
        )

    def filter_archived(self, queryset, name, value):
        if value:
            return queryset.filter(matter__archived_at__isnull=False)
        return queryset.filter(matter__archived_at__isnull=True)

    def filter_search(self, queryset, name, value):
        return queryset.filter(
            Q(matter__title__icontains=value) | Q(matter__reference_code__icontains=value)
        )
