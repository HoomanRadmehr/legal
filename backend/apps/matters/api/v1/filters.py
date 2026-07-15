"""Choice query validation for matter endpoints."""

from __future__ import annotations

from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

from apps.matters.models import KIND_CASE, KIND_CONTRACT, KIND_NOTICE

MATTER_CHOICE_PURPOSE_LINK = "link"
MATTER_CHOICE_PURPOSE_DOCUMENT_UPLOAD = "document_upload"
MATTER_CHOICE_PURPOSE_DEADLINE_CREATE = "deadline_create"
MATTER_CHOICE_PURPOSE_TASK_CREATE = "task_create"
MATTER_CHOICE_PURPOSE_NOTICE_RELATION = "notice_relation"
MATTER_CHOICE_PURPOSES = (
    MATTER_CHOICE_PURPOSE_LINK,
    MATTER_CHOICE_PURPOSE_DOCUMENT_UPLOAD,
    MATTER_CHOICE_PURPOSE_DEADLINE_CREATE,
    MATTER_CHOICE_PURPOSE_TASK_CREATE,
    MATTER_CHOICE_PURPOSE_NOTICE_RELATION,
)
MATTER_CHOICE_KINDS = (KIND_CASE, KIND_CONTRACT, KIND_NOTICE)
FORBIDDEN_MATTER_CHOICE_FIELDS = {
    "access_level",
    "organization",
    "organization_id",
    "owner",
    "owner_id",
    "status",
}


class MatterChoiceFilter(serializers.Serializer):
    q = serializers.CharField(max_length=80, required=False, allow_blank=True, trim_whitespace=True)
    purpose = serializers.ChoiceField(choices=MATTER_CHOICE_PURPOSES)
    kind = serializers.ChoiceField(choices=MATTER_CHOICE_KINDS, required=False)
    cursor = serializers.CharField(required=False, allow_blank=True)
    page_size = serializers.IntegerField(required=False, min_value=1)
    exclude_matter_id = serializers.UUIDField(required=False)

    def validate(self, attrs):
        forbidden = FORBIDDEN_MATTER_CHOICE_FIELDS.intersection(self.initial_data)
        if forbidden:
            raise serializers.ValidationError(
                {field: [_("This field is not accepted.")] for field in sorted(forbidden)}
            )
        attrs["q"] = attrs.get("q", "")
        return attrs
