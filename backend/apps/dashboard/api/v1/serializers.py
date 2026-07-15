"""Serializers for dashboard API responses."""

from __future__ import annotations

from rest_framework import serializers


class DashboardCaseSummarySerializer(serializers.Serializer):
    total = serializers.IntegerField(min_value=0)
    open = serializers.IntegerField(min_value=0)
    high_priority = serializers.IntegerField(min_value=0)


class DashboardContractSummarySerializer(serializers.Serializer):
    total = serializers.IntegerField(min_value=0)
    expiring_soon = serializers.IntegerField(min_value=0)


class DashboardNoticeSummarySerializer(serializers.Serializer):
    open = serializers.IntegerField(min_value=0)
    response_overdue = serializers.IntegerField(min_value=0)


class DashboardDeadlineSummarySerializer(serializers.Serializer):
    today = serializers.IntegerField(min_value=0)
    overdue = serializers.IntegerField(min_value=0)
    upcoming = serializers.IntegerField(min_value=0)
    assigned_to_me = serializers.IntegerField(min_value=0)


class DashboardTaskSummarySerializer(serializers.Serializer):
    assigned_to_me = serializers.IntegerField(min_value=0)
    overdue = serializers.IntegerField(min_value=0)


class DashboardActivitySerializer(serializers.Serializer):
    id = serializers.UUIDField()
    action = serializers.CharField()
    actor_membership_id = serializers.UUIDField(allow_null=True)
    matter_id = serializers.UUIDField(allow_null=True)
    target_type = serializers.CharField()
    target_id = serializers.UUIDField(allow_null=True)
    created_at = serializers.DateTimeField()


class DashboardSerializer(serializers.Serializer):
    cases = DashboardCaseSummarySerializer()
    contracts = DashboardContractSummarySerializer()
    notices = DashboardNoticeSummarySerializer()
    deadlines = DashboardDeadlineSummarySerializer()
    tasks = DashboardTaskSummarySerializer()
    recent_activity = DashboardActivitySerializer(many=True)
