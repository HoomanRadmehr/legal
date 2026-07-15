"""Serializers for offboarding endpoints."""

from __future__ import annotations

from rest_framework import serializers

from apps.offboarding.services import CONFIRMATION_VALUE


class OffboardingPreviewRequestSerializer(serializers.Serializer):
    departing_membership_id = serializers.UUIDField()
    replacement_membership_id = serializers.UUIDField()


class OffboardingExecuteRequestSerializer(OffboardingPreviewRequestSerializer):
    preview_fingerprint = serializers.CharField(max_length=64)
    confirmation = serializers.CharField(max_length=32)

    def validate_confirmation(self, value: str) -> str:
        if value != CONFIRMATION_VALUE:
            raise serializers.ValidationError("Enter OFFBOARD to confirm.")
        return value


class OffboardingMembershipSummarySerializer(serializers.Serializer):
    id = serializers.UUIDField()
    display_name = serializers.CharField()
    role = serializers.CharField()


class MatterSummarySerializer(serializers.Serializer):
    id = serializers.UUIDField()
    reference_code = serializers.CharField()
    title = serializers.CharField()
    version = serializers.IntegerField()


class WorkSummarySerializer(serializers.Serializer):
    id = serializers.UUIDField()
    matter_id = serializers.UUIDField()
    title = serializers.CharField()
    version = serializers.IntegerField()


class AccessSummarySerializer(serializers.Serializer):
    id = serializers.UUIDField()
    matter_id = serializers.UUIDField()
    level = serializers.CharField()


class OffboardingCountsSerializer(serializers.Serializer):
    owned_matters = serializers.IntegerField()
    open_tasks = serializers.IntegerField()
    open_deadlines = serializers.IntegerField()
    active_access_grants = serializers.IntegerField()


class OffboardingPreviewSerializer(serializers.Serializer):
    departing = OffboardingMembershipSummarySerializer()
    replacement = OffboardingMembershipSummarySerializer()
    owned_matters = MatterSummarySerializer(many=True)
    open_tasks = WorkSummarySerializer(many=True)
    open_deadlines = WorkSummarySerializer(many=True)
    active_access_grants = AccessSummarySerializer(many=True)
    warnings = serializers.ListField(child=serializers.CharField())
    counts = OffboardingCountsSerializer()
    fingerprint = serializers.CharField()


class OffboardingRunSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    status = serializers.CharField()
    organization_id = serializers.UUIDField()
    departing_membership_id = serializers.UUIDField()
    replacement_membership_id = serializers.UUIDField()
    preview = OffboardingPreviewSerializer()
    executed_at = serializers.DateTimeField()
