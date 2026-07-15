"""OpenAPI declarations for organization membership endpoints."""

from __future__ import annotations

from drf_spectacular.utils import OpenApiResponse, extend_schema, extend_schema_view

from apps.organizations.api.v1.serializers import (
    MembershipInvitationCreateSerializer,
    MembershipInvitationSerializer,
    MembershipRoleChangeSerializer,
    MembershipSerializer,
)
from common.api.openapi import COMMON_ERROR_RESPONSES, IDEMPOTENCY_KEY_HEADER

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
)
