"""Serializers for organization membership endpoints."""

from __future__ import annotations

from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

from apps.accounts.models import LANGUAGE_ENGLISH, PREFERRED_LANGUAGE_CHOICES
from apps.organizations.models import MEMBERSHIP_ROLE_CHOICES, Membership
from common.api.serializers import CommonModelSerializer

FORBIDDEN_INVITATION_FIELDS = {"organization_id", "organization", "password"}


class MembershipInvitationCreateSerializer(serializers.Serializer):
    email = serializers.EmailField()
    first_name = serializers.CharField(max_length=150, allow_blank=True, required=False)
    last_name = serializers.CharField(max_length=150, allow_blank=True, required=False)
    preferred_language = serializers.ChoiceField(
        choices=PREFERRED_LANGUAGE_CHOICES,
        required=False,
    )
    role = serializers.ChoiceField(choices=MEMBERSHIP_ROLE_CHOICES)

    def validate(self, attrs):
        forbidden = FORBIDDEN_INVITATION_FIELDS.intersection(self.initial_data)
        if forbidden:
            raise serializers.ValidationError(
                {field: [_("This field is not accepted.")] for field in sorted(forbidden)}
            )
        organization = self.context.get("organization")
        default_language = getattr(organization, "default_language", LANGUAGE_ENGLISH)
        attrs["preferred_language"] = attrs.get("preferred_language") or default_language
        return attrs


class MembershipInvitationSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    organization_id = serializers.UUIDField()
    user_id = serializers.UUIDField()
    invitation_id = serializers.UUIDField()
    role = serializers.CharField()
    status = serializers.CharField()
    invitation_status = serializers.CharField()
    expires_at = serializers.DateTimeField()


class MembershipSerializer(CommonModelSerializer):
    organization_id = serializers.UUIDField(read_only=True)
    user_id = serializers.UUIDField(read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    display_name = serializers.SerializerMethodField()
    user_is_active = serializers.BooleanField(source="user.is_active", read_only=True)

    class Meta:
        model = Membership
        fields = (
            "id",
            "organization_id",
            "user_id",
            "email",
            "display_name",
            "role",
            "status",
            "user_is_active",
            "joined_at",
            "offboarded_at",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields

    def get_display_name(self, obj) -> str:
        full_name = obj.user.get_full_name().strip()
        return full_name or obj.user.username


class MembershipRoleChangeSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=MEMBERSHIP_ROLE_CHOICES)
