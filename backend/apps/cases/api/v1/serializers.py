"""Serializers for legal case API endpoints."""

from __future__ import annotations

from rest_framework import serializers

from apps.cases.models import CASE_TYPE_CHOICES, CaseParty, LegalCase
from apps.matters.models import MATTER_STATUS_CHOICES, PRIORITY_CHOICES
from common.api.serializers import CommonModelSerializer


class CasePartySerializer(CommonModelSerializer):
    class Meta:
        model = CaseParty
        fields = ("id", "name", "role", "contact_summary")
        read_only_fields = ("id",)


class CasePartyInputSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    role = serializers.CharField(max_length=32)
    contact_summary = serializers.CharField(max_length=500, allow_blank=True, required=False)


class CaseListSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(source="matter.id", read_only=True)
    title = serializers.CharField(source="matter.title", read_only=True)
    reference_code = serializers.CharField(source="matter.reference_code", read_only=True)
    status = serializers.CharField(source="matter.status", read_only=True)
    priority = serializers.CharField(source="matter.priority", read_only=True)
    owner_id = serializers.UUIDField(source="matter.owner_id", read_only=True)
    version = serializers.IntegerField(source="matter.version", read_only=True)
    archived_at = serializers.DateTimeField(source="matter.archived_at", read_only=True)
    created_at = serializers.DateTimeField(source="matter.created_at", read_only=True)
    updated_at = serializers.DateTimeField(source="matter.updated_at", read_only=True)

    class Meta:
        model = LegalCase
        fields = (
            "id",
            "title",
            "reference_code",
            "status",
            "priority",
            "owner_id",
            "case_type",
            "version",
            "archived_at",
            "created_at",
            "updated_at",
        )


class CaseDetailSerializer(CaseListSerializer):
    description = serializers.CharField(source="matter.description", read_only=True)
    opened_on = serializers.DateField(source="matter.opened_on", read_only=True)
    closed_on = serializers.DateField(source="matter.closed_on", read_only=True)
    court_or_authority = serializers.CharField(read_only=True)
    filing_date = serializers.DateField(read_only=True)
    outcome_summary = serializers.CharField(read_only=True)
    parties = CasePartySerializer(many=True, read_only=True)

    class Meta:
        model = LegalCase
        fields = CaseListSerializer.Meta.fields + (
            "description",
            "opened_on",
            "closed_on",
            "court_or_authority",
            "filing_date",
            "outcome_summary",
            "parties",
        )


class CaseCreateSerializer(serializers.ModelSerializer):
    title = serializers.CharField(max_length=255)
    reference_code = serializers.CharField(max_length=64)
    status = serializers.ChoiceField(choices=MATTER_STATUS_CHOICES, required=False)
    priority = serializers.ChoiceField(choices=PRIORITY_CHOICES)
    description = serializers.CharField(allow_blank=True, required=False)
    opened_on = serializers.DateField(required=False, allow_null=True)
    closed_on = serializers.DateField(required=False, allow_null=True)
    owner_id = serializers.UUIDField(required=False)
    parties = CasePartyInputSerializer(many=True, required=False)

    class Meta:
        model = LegalCase
        fields = (
            "title",
            "reference_code",
            "status",
            "priority",
            "description",
            "opened_on",
            "closed_on",
            "owner_id",
            "case_type",
            "court_or_authority",
            "filing_date",
            "outcome_summary",
            "parties",
        )
        extra_kwargs = {
            "court_or_authority": {"required": False, "allow_blank": True},
            "filing_date": {"required": False, "allow_null": True},
            "outcome_summary": {"required": False, "allow_blank": True},
        }


class CaseUpdateSerializer(CaseCreateSerializer):
    version = serializers.IntegerField(min_value=1)
    title = serializers.CharField(max_length=255, required=False)
    reference_code = serializers.CharField(max_length=64, required=False)
    priority = serializers.ChoiceField(choices=PRIORITY_CHOICES, required=False)
    case_type = serializers.ChoiceField(choices=CASE_TYPE_CHOICES, required=False)

    class Meta(CaseCreateSerializer.Meta):
        fields = CaseCreateSerializer.Meta.fields + ("version",)

    def validate(self, attrs: dict) -> dict:
        if "version" not in attrs:
            raise serializers.ValidationError({"version": ["This field is required."]})
        return attrs


class CaseArchiveSerializer(serializers.Serializer):
    version = serializers.IntegerField(min_value=1)


class CaseTimelineSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    action = serializers.CharField()
    actor_membership_id = serializers.UUIDField(allow_null=True)
    target_type = serializers.CharField()
    target_id = serializers.UUIDField(allow_null=True)
    before_values = serializers.DictField()
    after_values = serializers.DictField()
    metadata = serializers.DictField()
    created_at = serializers.DateTimeField()
