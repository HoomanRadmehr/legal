"""OpenAPI declarations for organization membership endpoints."""

from __future__ import annotations

from drf_spectacular.utils import (
    OpenApiParameter,
    OpenApiResponse,
    extend_schema,
    extend_schema_view,
)

from apps.organizations.api.v1.serializers import (
    MembershipChoicePageSerializer,
    MembershipInvitationCreateSerializer,
    MembershipInvitationSerializer,
    MembershipRoleChangeSerializer,
    MembershipSerializer,
)
from common.api.openapi import COMMON_ERROR_RESPONSES, IDEMPOTENCY_KEY_HEADER, RETRY_AFTER_HEADER

MEMBERSHIP_CHOICE_PURPOSE_PARAMETER = OpenApiParameter(
    name="purpose",
    type=str,
    location=OpenApiParameter.QUERY,
    required=True,
    enum=["owner", "assignee", "participant", "offboarding_replacement"],
    description="Form purpose that selects explicit membership role rules.",
)
MEMBERSHIP_CHOICE_QUERY_PARAMETER = OpenApiParameter(
    name="q",
    type=str,
    location=OpenApiParameter.QUERY,
    description="Optional search across first name, last name, and email.",
)
MEMBERSHIP_CHOICE_CURSOR_PARAMETER = OpenApiParameter(
    name="cursor",
    type=str,
    location=OpenApiParameter.QUERY,
    description="Opaque cursor from the previous response.",
)
MEMBERSHIP_CHOICE_PAGE_SIZE_PARAMETER = OpenApiParameter(
    name="page_size",
    type=int,
    location=OpenApiParameter.QUERY,
    description="Page size from 1 to 50. Defaults to 20.",
)
MEMBERSHIP_CHOICE_EXCLUDE_PARAMETER = OpenApiParameter(
    name="exclude_membership_id",
    type=str,
    location=OpenApiParameter.QUERY,
    description="Membership UUID to exclude, used by offboarding replacement choices.",
)

membership_schema = extend_schema_view(
    list=extend_schema(
        operation_id="memberships_list",
        summary="List current organization memberships",
        responses={
            200: OpenApiResponse(MembershipSerializer(many=True)),
            403: COMMON_ERROR_RESPONSES[403],
        },
    ),
    create=extend_schema(
        operation_id="memberships_create_invitation",
        summary="Invite an organization user",
        parameters=[IDEMPOTENCY_KEY_HEADER],
        request=MembershipInvitationCreateSerializer,
        responses={
            201: OpenApiResponse(MembershipInvitationSerializer),
            400: COMMON_ERROR_RESPONSES[400],
            403: COMMON_ERROR_RESPONSES[403],
            409: COMMON_ERROR_RESPONSES[409],
        },
    ),
    change_role=extend_schema(
        operation_id="memberships_change_role",
        summary="Change a current organization membership role",
        request=MembershipRoleChangeSerializer,
        responses={
            200: OpenApiResponse(MembershipSerializer),
            400: COMMON_ERROR_RESPONSES[400],
            403: COMMON_ERROR_RESPONSES[403],
            404: COMMON_ERROR_RESPONSES[404],
            409: COMMON_ERROR_RESPONSES[409],
        },
    ),
    choices=extend_schema(
        operation_id="memberships_choices",
        summary="List permission-scoped membership choices",
        description=(
            "Returns active same-organization memberships permitted for the requested "
            "form purpose. The `id` field is the Membership.id value submitted by "
            "forms; `user_id` is informational only."
        ),
        parameters=[
            MEMBERSHIP_CHOICE_PURPOSE_PARAMETER,
            MEMBERSHIP_CHOICE_QUERY_PARAMETER,
            MEMBERSHIP_CHOICE_CURSOR_PARAMETER,
            MEMBERSHIP_CHOICE_PAGE_SIZE_PARAMETER,
            MEMBERSHIP_CHOICE_EXCLUDE_PARAMETER,
            RETRY_AFTER_HEADER,
        ],
        responses={
            200: MembershipChoicePageSerializer,
            400: COMMON_ERROR_RESPONSES[400],
            401: COMMON_ERROR_RESPONSES[401],
            403: COMMON_ERROR_RESPONSES[403],
            429: COMMON_ERROR_RESPONSES[429],
        },
    ),
)
