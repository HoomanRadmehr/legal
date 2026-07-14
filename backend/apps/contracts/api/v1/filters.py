"""Explicit filter allowlist for contracts."""

from __future__ import annotations

from django.db.models import Q
from django_filters import rest_framework as django_filters

from apps.contracts.models import Contract
from common.api.filters import CommonFilterSet


class ContractFilter(CommonFilterSet):
    status = django_filters.CharFilter(field_name="matter__status")
    priority = django_filters.CharFilter(field_name="matter__priority")
    owner = django_filters.UUIDFilter(field_name="matter__owner_id")
    contract_type = django_filters.CharFilter(field_name="contract_type")
    counterparty = django_filters.CharFilter(field_name="counterparty", lookup_expr="icontains")
    effective_after = django_filters.DateFilter(field_name="effective_date", lookup_expr="gte")
    effective_before = django_filters.DateFilter(field_name="effective_date", lookup_expr="lte")
    expiration_after = django_filters.DateFilter(field_name="expiration_date", lookup_expr="gte")
    expiration_before = django_filters.DateFilter(field_name="expiration_date", lookup_expr="lte")
    renewal_after = django_filters.DateFilter(field_name="renewal_date", lookup_expr="gte")
    renewal_before = django_filters.DateFilter(field_name="renewal_date", lookup_expr="lte")
    archived = django_filters.BooleanFilter(method="filter_archived")
    search = django_filters.CharFilter(method="filter_search")

    class Meta:
        model = Contract
        fields = (
            "status",
            "priority",
            "owner",
            "contract_type",
            "counterparty",
            "effective_after",
            "effective_before",
            "expiration_after",
            "expiration_before",
            "renewal_after",
            "renewal_before",
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
