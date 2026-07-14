"""Serializers for legal notice API endpoints."""

from __future__ import annotations

from rest_framework import serializers

from apps.matters.models import MATTER_STATUS_CHOICES, PRIORITY_CHOICES
from apps.notices.models import RESPONSE_STATUS_CHOICES, LegalNotice


class NoticeListSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(source="matter.id", read_only=True)
    title = serializers.CharField(source="matter.title", read_only=True)
    reference_code = serializers.CharField(source="matter.reference_code", read_only=True)
    status = serializers.CharField(source="matter.status", read_only=True)
    priority = serializers.CharField(source="matter.priority", read_only=True)
    owner_id = serializers.UUIDField(source="matter.owner_id", read_only=True)
    linked_deadline_id = serializers.UUIDField(read_only=True)
    version = serializers.IntegerField(source="matter.version", read_only=True)
    archived_at = serializers.DateTimeField(source="matter.archived_at", read_only=True)
    created_at = serializers.DateTimeField(source="matter.created_at", read_only=True)
    updated_at = serializers.DateTimeField(source="matter.updated_at", read_only=True)

    class Meta:
        model = LegalNotice
        fields = (
            "id",
            "title",
            "reference_code",
            "status",
            "priority",
            "owner_id",
            "sender",
            "received_date",
            "response_deadline",
            "response_status",
            "linked_deadline_id",
            "version",
            "archived_at",
            "created_at",
            "updated_at",
        )


class NoticeDetailSerializer(NoticeListSerializer):
    description = serializers.CharField(source="matter.description", read_only=True)
    opened_on = serializers.DateField(source="matter.opened_on", read_only=True)
    closed_on = serializers.DateField(source="matter.closed_on", read_only=True)
    related_matter_ids = serializers.SerializerMethodField()

    class Meta:
        model = LegalNotice
        fields = NoticeListSerializer.Meta.fields + (
            "description",
            "opened_on",
            "closed_on",
            "related_matter_ids",
        )

    def get_related_matter_ids(self, notice) -> list[str]:
        relations = notice.matter.outgoing_relations.all()
        return [str(relation.target_id) for relation in relations]


class NoticeCreateSerializer(serializers.ModelSerializer):
    title = serializers.CharField(max_length=255)
    reference_code = serializers.CharField(max_length=64)
    status = serializers.ChoiceField(choices=MATTER_STATUS_CHOICES, required=False)
    priority = serializers.ChoiceField(choices=PRIORITY_CHOICES)
    description = serializers.CharField(allow_blank=True, required=False)
    opened_on = serializers.DateField(required=False, allow_null=True)
    closed_on = serializers.DateField(required=False, allow_null=True)
    owner_id = serializers.UUIDField(required=False)
    related_matter_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        allow_empty=True,
    )

    class Meta:
        model = LegalNotice
        fields = (
            "title",
            "reference_code",
            "status",
            "priority",
            "description",
            "opened_on",
            "closed_on",
            "owner_id",
            "sender",
            "received_date",
            "response_deadline",
            "response_status",
            "related_matter_ids",
        )
        extra_kwargs = {
            "response_status": {"required": False},
        }


class NoticeUpdateSerializer(NoticeCreateSerializer):
    version = serializers.IntegerField(min_value=1)
    title = serializers.CharField(max_length=255, required=False)
    reference_code = serializers.CharField(max_length=64, required=False)
    priority = serializers.ChoiceField(choices=PRIORITY_CHOICES, required=False)
    sender = serializers.CharField(max_length=255, required=False)
    received_date = serializers.DateField(required=False)
    response_deadline = serializers.DateTimeField(required=False)
    response_status = serializers.ChoiceField(choices=RESPONSE_STATUS_CHOICES, required=False)

    class Meta(NoticeCreateSerializer.Meta):
        fields = NoticeCreateSerializer.Meta.fields + ("version",)

    def validate(self, attrs: dict) -> dict:
        if "version" not in attrs:
            raise serializers.ValidationError({"version": ["This field is required."]})
        return attrs


class NoticeArchiveSerializer(serializers.Serializer):
    version = serializers.IntegerField(min_value=1)


class NoticeTimelineSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    action = serializers.CharField()
    actor_membership_id = serializers.UUIDField(allow_null=True)
    target_type = serializers.CharField()
    target_id = serializers.UUIDField(allow_null=True)
    before_values = serializers.DictField()
    after_values = serializers.DictField()
    metadata = serializers.DictField()
    created_at = serializers.DateTimeField()
