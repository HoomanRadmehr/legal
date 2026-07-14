"""Serializers for deadline API endpoints."""

from __future__ import annotations

from rest_framework import serializers

from apps.deadlines.models import DEADLINE_PRIORITY_CHOICES, Deadline


class DeadlineListSerializer(serializers.ModelSerializer):
    matter_id = serializers.UUIDField(read_only=True)
    assignee_id = serializers.UUIDField(read_only=True)
    status = serializers.CharField(read_only=True)
    completed_by_id = serializers.UUIDField(read_only=True)
    cancelled_by_id = serializers.UUIDField(read_only=True)

    class Meta:
        model = Deadline
        fields = (
            "id",
            "matter_id",
            "title",
            "due_at",
            "assignee_id",
            "status",
            "priority",
            "reminder_enabled",
            "completed_at",
            "completed_by_id",
            "cancelled_at",
            "cancelled_by_id",
            "version",
            "created_at",
            "updated_at",
        )


class DeadlineDetailSerializer(DeadlineListSerializer):
    description = serializers.CharField(read_only=True)

    class Meta:
        model = Deadline
        fields = DeadlineListSerializer.Meta.fields + ("description",)


class DeadlineCreateSerializer(serializers.ModelSerializer):
    matter_id = serializers.UUIDField()
    assignee_id = serializers.UUIDField()
    description = serializers.CharField(allow_blank=True, required=False)
    priority = serializers.ChoiceField(choices=DEADLINE_PRIORITY_CHOICES)
    reminder_enabled = serializers.BooleanField(required=False)

    class Meta:
        model = Deadline
        fields = (
            "matter_id",
            "title",
            "description",
            "due_at",
            "assignee_id",
            "priority",
            "reminder_enabled",
        )


class DeadlineUpdateSerializer(DeadlineCreateSerializer):
    version = serializers.IntegerField(min_value=1)
    matter_id = serializers.UUIDField(required=False)
    title = serializers.CharField(max_length=255, required=False)
    due_at = serializers.DateTimeField(required=False)
    assignee_id = serializers.UUIDField(required=False)
    priority = serializers.ChoiceField(choices=DEADLINE_PRIORITY_CHOICES, required=False)

    class Meta(DeadlineCreateSerializer.Meta):
        fields = DeadlineCreateSerializer.Meta.fields + ("version",)

    def validate(self, attrs: dict) -> dict:
        if "version" not in attrs:
            raise serializers.ValidationError({"version": ["This field is required."]})
        return attrs


class DeadlineActionSerializer(serializers.Serializer):
    version = serializers.IntegerField(min_value=1)
