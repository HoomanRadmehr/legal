"""Serializers for activity endpoints."""

from __future__ import annotations

from rest_framework import serializers

from apps.activity.models import ACTIVITY_ACTION_CHOICES, ActivityLog
from common.api.serializers import CommonModelSerializer
from common.services.activity import SAFE_ACTIVITY_FIELDS

ALLOWED_ACTIVITY_ACTIONS = {choice[0] for choice in ACTIVITY_ACTION_CHOICES}


class ActivityLogSerializer(CommonModelSerializer):
    actor_membership_id = serializers.UUIDField(read_only=True, allow_null=True)
    actor_user_id = serializers.UUIDField(read_only=True, allow_null=True)
    matter_id = serializers.UUIDField(read_only=True, allow_null=True)
    before_values = serializers.SerializerMethodField()
    after_values = serializers.SerializerMethodField()
    metadata = serializers.SerializerMethodField()

    class Meta:
        model = ActivityLog
        fields = (
            "id",
            "action",
            "actor_membership_id",
            "actor_user_id",
            "matter_id",
            "target_type",
            "target_id",
            "before_values",
            "after_values",
            "metadata",
            "request_id",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields

    def get_before_values(self, obj) -> dict:
        return redacted_activity_values(action=obj.action, values=obj.before_values)

    def get_after_values(self, obj) -> dict:
        return redacted_activity_values(action=obj.action, values=obj.after_values)

    def get_metadata(self, obj) -> dict:
        return redacted_activity_values(action=obj.action, values=obj.metadata)


def redacted_activity_values(*, action: str, values) -> dict:
    if action not in ALLOWED_ACTIVITY_ACTIONS or not isinstance(values, dict):
        return {}
    return {
        key: values[key]
        for key in values
        if key in SAFE_ACTIVITY_FIELDS and is_safe_activity_value(value=values[key])
    }


def is_safe_activity_value(*, value) -> bool:
    return value is None or isinstance(value, bool | int | float | str)
