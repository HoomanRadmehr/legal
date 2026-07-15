"""Serializers for matter choice endpoints."""

from __future__ import annotations

from rest_framework import serializers

from apps.matters.models import Matter
from common.api.serializers import CommonModelSerializer


class MatterChoiceSerializer(CommonModelSerializer):
    label = serializers.CharField(source="title", read_only=True)
    secondary_label = serializers.CharField(source="reference_code", read_only=True)
    kind = serializers.CharField(read_only=True)

    class Meta:
        model = Matter
        fields = ("id", "label", "secondary_label", "kind")
        read_only_fields = fields


class MatterChoicePageSerializer(serializers.Serializer):
    next_cursor = serializers.CharField(allow_null=True)
    has_more = serializers.BooleanField()
    results = MatterChoiceSerializer(many=True)
