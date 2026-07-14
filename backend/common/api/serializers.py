"""Common serializer primitives."""

from __future__ import annotations

from rest_framework import serializers


class CommonModelSerializer(serializers.ModelSerializer):
    class Meta:
        abstract = True
        read_only_fields = ("id", "created_at", "updated_at")
