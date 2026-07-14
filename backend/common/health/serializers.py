"""Health endpoint serializers."""

from __future__ import annotations

from rest_framework import serializers


class HealthResponseSerializer(serializers.Serializer):
    status = serializers.CharField()
    checks = serializers.DictField(child=serializers.CharField(), required=False)
