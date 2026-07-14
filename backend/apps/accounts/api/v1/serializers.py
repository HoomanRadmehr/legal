"""Serializers for account authentication endpoints."""

from __future__ import annotations

from rest_framework import serializers

from apps.accounts.models import User
from apps.organizations.models import Membership


class LoginInputSerializer(serializers.Serializer):
    username = serializers.CharField(trim_whitespace=True)
    password = serializers.CharField(write_only=True, trim_whitespace=False)


class SafeUserSerializer(serializers.ModelSerializer):
    display_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ("id", "display_name", "preferred_language")

    def get_display_name(self, user: User) -> str:
        full_name = user.get_full_name().strip()
        return full_name or user.username


class MembershipSummarySerializer(serializers.ModelSerializer):
    organization_id = serializers.UUIDField(source="organization.id")
    organization_name = serializers.CharField(source="organization.name")

    class Meta:
        model = Membership
        fields = ("id", "organization_id", "organization_name", "role")


class AuthSessionSerializer(serializers.Serializer):
    access = serializers.CharField()
    user = SafeUserSerializer()
    membership = MembershipSummarySerializer()


class MeSerializer(serializers.Serializer):
    user = SafeUserSerializer()
    membership = MembershipSummarySerializer()


class WebSocketTicketSerializer(serializers.Serializer):
    ticket = serializers.CharField()
    expires_at = serializers.DateTimeField()
    websocket_url = serializers.CharField()
