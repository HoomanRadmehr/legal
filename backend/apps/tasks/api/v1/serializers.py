"""Serializers for task API endpoints."""

from __future__ import annotations

from rest_framework import serializers

from apps.tasks.models import (
    OPEN_TASK_STATUSES,
    STATUS_CANCELLED,
    STATUS_DONE,
    TASK_STATUS_CHOICES,
    Task,
)
from common.api.serializers import CommonModelSerializer

FINAL_TASK_STATUSES = (STATUS_DONE, STATUS_CANCELLED)


class TaskListSerializer(CommonModelSerializer):
    matter_id = serializers.UUIDField(read_only=True)
    assignee_id = serializers.UUIDField(read_only=True)
    status = serializers.CharField(read_only=True)
    completed_by_id = serializers.UUIDField(read_only=True)
    cancelled_by_id = serializers.UUIDField(read_only=True)

    class Meta:
        model = Task
        fields = (
            "id",
            "matter_id",
            "title",
            "due_at",
            "assignee_id",
            "status",
            "completed_at",
            "completed_by_id",
            "cancelled_at",
            "cancelled_by_id",
            "version",
            "created_at",
            "updated_at",
        )


class TaskDetailSerializer(TaskListSerializer):
    description = serializers.CharField(read_only=True)

    class Meta:
        model = Task
        fields = TaskListSerializer.Meta.fields + ("description",)


class TaskCreateSerializer(CommonModelSerializer):
    matter_id = serializers.UUIDField()
    assignee_id = serializers.UUIDField()
    description = serializers.CharField(allow_blank=True, required=False)
    due_at = serializers.DateTimeField(allow_null=True, required=False)
    status = serializers.ChoiceField(choices=TASK_STATUS_CHOICES)

    class Meta:
        model = Task
        fields = (
            "matter_id",
            "title",
            "description",
            "due_at",
            "assignee_id",
            "status",
        )

    def validate_status(self, value: str) -> str:
        if value in FINAL_TASK_STATUSES:
            raise serializers.ValidationError("Use the complete or cancel action for final states.")
        return value


class TaskUpdateSerializer(TaskCreateSerializer):
    version = serializers.IntegerField(min_value=1)
    matter_id = serializers.UUIDField(required=False)
    title = serializers.CharField(max_length=255, required=False)
    assignee_id = serializers.UUIDField(required=False)
    status = serializers.ChoiceField(choices=OPEN_TASK_STATUSES, required=False)

    class Meta(TaskCreateSerializer.Meta):
        fields = TaskCreateSerializer.Meta.fields + ("version",)

    def validate(self, attrs: dict) -> dict:
        if "version" not in attrs:
            raise serializers.ValidationError({"version": ["This field is required."]})
        return attrs


class TaskActionSerializer(serializers.Serializer):
    version = serializers.IntegerField(min_value=1)
