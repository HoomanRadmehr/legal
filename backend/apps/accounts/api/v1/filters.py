"""Choice query validation for account endpoints."""

from __future__ import annotations

from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

USER_CHOICE_PURPOSE_OWNER = "owner"
USER_CHOICE_PURPOSE_ASSIGNEE = "assignee"
USER_CHOICE_PURPOSE_PARTICIPANT = "participant"
USER_CHOICE_PURPOSE_OFFBOARDING_REPLACEMENT = "offboarding_replacement"
USER_CHOICE_PURPOSES = (
    USER_CHOICE_PURPOSE_OWNER,
    USER_CHOICE_PURPOSE_ASSIGNEE,
    USER_CHOICE_PURPOSE_PARTICIPANT,
    USER_CHOICE_PURPOSE_OFFBOARDING_REPLACEMENT,
)
FORBIDDEN_USER_CHOICE_FIELDS = {"organization", "organization_id", "role", "status"}


class UserChoiceFilter(serializers.Serializer):
    q = serializers.CharField(max_length=80, required=False, allow_blank=True, trim_whitespace=True)
    purpose = serializers.ChoiceField(choices=USER_CHOICE_PURPOSES)
    cursor = serializers.CharField(required=False, allow_blank=True)
    page_size = serializers.IntegerField(required=False, min_value=1)
    exclude_user_id = serializers.UUIDField(required=False)

    def validate(self, attrs):
        forbidden = FORBIDDEN_USER_CHOICE_FIELDS.intersection(self.initial_data)
        if forbidden:
            raise serializers.ValidationError(
                {field: [_("This field is not accepted.")] for field in sorted(forbidden)}
            )
        attrs["q"] = attrs.get("q", "")
        return attrs
