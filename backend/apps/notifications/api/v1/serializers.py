"""Serializers for notification endpoints."""

from __future__ import annotations

from rest_framework import serializers

from apps.notifications.models import (
    CHANNEL_IN_APP,
    NOTIFICATION_CHANNEL_CHOICES,
    Notification,
    NotificationPreference,
)


class NotificationSerializer(serializers.ModelSerializer):
    recipient_id = serializers.UUIDField(read_only=True)

    class Meta:
        model = Notification
        fields = (
            "id",
            "recipient_id",
            "event_type",
            "title",
            "body",
            "data",
            "read_at",
            "created_at",
            "updated_at",
        )


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = (
            "id",
            "event_type",
            "channel",
            "reminder_offset_minutes",
            "enabled",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class NotificationPreferenceInputSerializer(serializers.Serializer):
    event_type = serializers.CharField(max_length=128)
    channel = serializers.ChoiceField(choices=NOTIFICATION_CHANNEL_CHOICES)
    reminder_offset_minutes = serializers.IntegerField(default=0, min_value=0)
    enabled = serializers.BooleanField(default=True)

    def validate(self, attrs: dict) -> dict:
        if attrs["channel"] == CHANNEL_IN_APP and not attrs["enabled"]:
            raise serializers.ValidationError(
                {"enabled": ["In-app notifications cannot be disabled."]}
            )
        return attrs


class NotificationPreferenceReplaceSerializer(serializers.Serializer):
    preferences = NotificationPreferenceInputSerializer(many=True)

    def validate_preferences(self, preferences: list[dict]) -> list[dict]:
        seen = set()
        for preference in preferences:
            key = preference_key(preference=preference)
            if key in seen:
                raise serializers.ValidationError("Duplicate preference.")
            seen.add(key)
        return preferences


class ReadAllResponseSerializer(serializers.Serializer):
    updated = serializers.IntegerField(min_value=0)


def preference_key(*, preference: dict) -> tuple:
    return (
        preference["event_type"],
        preference["channel"],
        preference.get("reminder_offset_minutes", 0),
    )
