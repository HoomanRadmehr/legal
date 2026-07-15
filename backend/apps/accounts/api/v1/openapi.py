"""OpenAPI declarations for account authentication endpoints."""

from __future__ import annotations

from drf_spectacular.utils import (
    OpenApiExample,
    OpenApiParameter,
    OpenApiResponse,
    extend_schema,
    extend_schema_view,
)

from apps.accounts.api.v1.serializers import (
    AuthSessionSerializer,
    InvitationAcceptResponseSerializer,
    InvitationAcceptSerializer,
    LoginInputSerializer,
    MeSerializer,
    UserChoicePageSerializer,
    WebSocketTicketSerializer,
)
from common.api.openapi import COMMON_ERROR_RESPONSES, RETRY_AFTER_HEADER

AUTH_SESSION_EXAMPLE = OpenApiExample(
    "Authenticated session",
    value={
        "access": "<access-jwt>",
        "user": {
            "id": "11111111-1111-1111-1111-111111111111",
            "display_name": "Legal Counsel",
            "preferred_language": "en",
        },
        "membership": {
            "id": "22222222-2222-2222-2222-222222222222",
            "organization_id": "33333333-3333-3333-3333-333333333333",
            "organization_name": "Example Legal",
            "role": "legal_counsel",
        },
    },
)

csrf_schema = extend_schema(
    operation_id="auth_csrf",
    summary="Ensure CSRF cookie",
    responses={200: OpenApiResponse(description="CSRF cookie ensured")},
)

login_schema = extend_schema(
    operation_id="auth_login",
    summary="Log in and set refresh cookie",
    parameters=[RETRY_AFTER_HEADER],
    request=LoginInputSerializer,
    responses={
        200: OpenApiResponse(AuthSessionSerializer, examples=[AUTH_SESSION_EXAMPLE]),
        400: COMMON_ERROR_RESPONSES[400],
        401: COMMON_ERROR_RESPONSES[401],
        403: COMMON_ERROR_RESPONSES[403],
        429: COMMON_ERROR_RESPONSES[429],
    },
)

refresh_schema = extend_schema(
    operation_id="auth_refresh",
    summary="Rotate refresh cookie and return a new access token",
    parameters=[RETRY_AFTER_HEADER],
    request=None,
    responses={
        200: OpenApiResponse(AuthSessionSerializer, examples=[AUTH_SESSION_EXAMPLE]),
        401: COMMON_ERROR_RESPONSES[401],
        403: COMMON_ERROR_RESPONSES[403],
        429: COMMON_ERROR_RESPONSES[429],
    },
)

logout_schema = extend_schema(
    operation_id="auth_logout",
    summary="Revoke and clear refresh cookie",
    request=None,
    responses={
        204: OpenApiResponse(description="Logged out"),
        403: COMMON_ERROR_RESPONSES[403],
    },
)

invitation_accept_schema = extend_schema(
    operation_id="auth_invitations_accept",
    summary="Accept a user invitation without logging in",
    parameters=[RETRY_AFTER_HEADER],
    request=InvitationAcceptSerializer,
    responses={
        200: InvitationAcceptResponseSerializer,
        400: COMMON_ERROR_RESPONSES[400],
        429: COMMON_ERROR_RESPONSES[429],
    },
)

me_schema = extend_schema(
    operation_id="auth_me",
    summary="Return current user and active membership",
    responses={
        200: MeSerializer,
        401: COMMON_ERROR_RESPONSES[401],
    },
)

ws_ticket_schema = extend_schema(
    operation_id="auth_ws_ticket",
    summary="Issue a short-lived one-time WebSocket ticket",
    parameters=[RETRY_AFTER_HEADER],
    request=None,
    responses={
        200: WebSocketTicketSerializer,
        401: COMMON_ERROR_RESPONSES[401],
        429: COMMON_ERROR_RESPONSES[429],
    },
)

USER_CHOICE_PURPOSE_PARAMETER = OpenApiParameter(
    name="purpose",
    type=str,
    location=OpenApiParameter.QUERY,
    required=True,
    enum=["owner", "assignee", "participant", "offboarding_replacement"],
    description="Form purpose that selects explicit role rules.",
)
USER_CHOICE_QUERY_PARAMETER = OpenApiParameter(
    name="q",
    type=str,
    location=OpenApiParameter.QUERY,
    description="Optional search across first name, last name, and email.",
)
USER_CHOICE_CURSOR_PARAMETER = OpenApiParameter(
    name="cursor",
    type=str,
    location=OpenApiParameter.QUERY,
    description="Opaque cursor from the previous response.",
)
USER_CHOICE_PAGE_SIZE_PARAMETER = OpenApiParameter(
    name="page_size",
    type=int,
    location=OpenApiParameter.QUERY,
    description="Page size from 1 to 50. Defaults to 20.",
)
USER_CHOICE_EXCLUDE_USER_PARAMETER = OpenApiParameter(
    name="exclude_user_id",
    type=str,
    location=OpenApiParameter.QUERY,
    description="User UUID to exclude, used by offboarding replacement choices.",
)

user_schema = extend_schema_view(
    list=extend_schema(exclude=True),
    retrieve=extend_schema(exclude=True),
    choices=extend_schema(
        operation_id="users_choices",
        summary="List permission-scoped user choices",
        description=(
            "Returns active same-organization users permitted for the requested form purpose. "
            "The response uses opaque cursor pagination and exposes only user ID, label, "
            "email, and role."
        ),
        parameters=[
            USER_CHOICE_PURPOSE_PARAMETER,
            USER_CHOICE_QUERY_PARAMETER,
            USER_CHOICE_CURSOR_PARAMETER,
            USER_CHOICE_PAGE_SIZE_PARAMETER,
            USER_CHOICE_EXCLUDE_USER_PARAMETER,
            RETRY_AFTER_HEADER,
        ],
        responses={
            200: UserChoicePageSerializer,
            400: COMMON_ERROR_RESPONSES[400],
            401: COMMON_ERROR_RESPONSES[401],
            403: COMMON_ERROR_RESPONSES[403],
            429: COMMON_ERROR_RESPONSES[429],
        },
    ),
)
