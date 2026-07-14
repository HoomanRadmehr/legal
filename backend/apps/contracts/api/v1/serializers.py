"""Serializers for contract API endpoints."""

from __future__ import annotations

from rest_framework import serializers

from apps.contracts.models import CONTRACT_TYPE_CHOICES, MAX_KEY_TERMS_BYTES, Contract
from apps.matters.models import MATTER_STATUS_CHOICES, PRIORITY_CHOICES


class ContractListSerializer(serializers.ModelSerializer):
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
        model = Contract
        fields = (
            "id",
            "title",
            "reference_code",
            "status",
            "priority",
            "owner_id",
            "contract_type",
            "counterparty",
            "effective_date",
            "expiration_date",
            "renewal_date",
            "version",
            "archived_at",
            "created_at",
            "updated_at",
        )


class ContractDetailSerializer(ContractListSerializer):
    description = serializers.CharField(source="matter.description", read_only=True)
    opened_on = serializers.DateField(source="matter.opened_on", read_only=True)
    closed_on = serializers.DateField(source="matter.closed_on", read_only=True)
    key_terms = serializers.JSONField(read_only=True)

    class Meta:
        model = Contract
        fields = ContractListSerializer.Meta.fields + (
            "description",
            "opened_on",
            "closed_on",
            "key_terms",
        )


class ContractCreateSerializer(serializers.ModelSerializer):
    title = serializers.CharField(max_length=255)
    reference_code = serializers.CharField(max_length=64)
    status = serializers.ChoiceField(choices=MATTER_STATUS_CHOICES, required=False)
    priority = serializers.ChoiceField(choices=PRIORITY_CHOICES)
    description = serializers.CharField(allow_blank=True, required=False)
    opened_on = serializers.DateField(required=False, allow_null=True)
    closed_on = serializers.DateField(required=False, allow_null=True)
    owner_id = serializers.UUIDField(required=False)
    key_terms = serializers.JSONField(
        default=dict,
        help_text=(
            f"Small structured key terms object. Maximum serialized size is "
            f"{MAX_KEY_TERMS_BYTES} bytes. Uploaded file content is not allowed here."
        ),
    )

    class Meta:
        model = Contract
        fields = (
            "title",
            "reference_code",
            "status",
            "priority",
            "description",
            "opened_on",
            "closed_on",
            "owner_id",
            "contract_type",
            "counterparty",
            "effective_date",
            "expiration_date",
            "renewal_date",
            "key_terms",
        )
        extra_kwargs = {
            "expiration_date": {"required": False, "allow_null": True},
            "renewal_date": {"required": False, "allow_null": True},
        }


class ContractUpdateSerializer(ContractCreateSerializer):
    version = serializers.IntegerField(min_value=1)
    title = serializers.CharField(max_length=255, required=False)
    reference_code = serializers.CharField(max_length=64, required=False)
    priority = serializers.ChoiceField(choices=PRIORITY_CHOICES, required=False)
    contract_type = serializers.ChoiceField(choices=CONTRACT_TYPE_CHOICES, required=False)
    counterparty = serializers.CharField(max_length=255, required=False)
    effective_date = serializers.DateField(required=False)
    key_terms = serializers.JSONField(required=False)

    class Meta(ContractCreateSerializer.Meta):
        fields = ContractCreateSerializer.Meta.fields + ("version",)

    def validate(self, attrs: dict) -> dict:
        if "version" not in attrs:
            raise serializers.ValidationError({"version": ["This field is required."]})
        return attrs


class ContractArchiveSerializer(serializers.Serializer):
    version = serializers.IntegerField(min_value=1)


class ContractTimelineSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    action = serializers.CharField()
    actor_membership_id = serializers.UUIDField(allow_null=True)
    target_type = serializers.CharField()
    target_id = serializers.UUIDField(allow_null=True)
    before_values = serializers.DictField()
    after_values = serializers.DictField()
    metadata = serializers.DictField()
    created_at = serializers.DateTimeField()
