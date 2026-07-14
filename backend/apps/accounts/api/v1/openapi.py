"""OpenAPI declarations for account authentication endpoints."""

from __future__ import annotations

from drf_spectacular.utils import OpenApiExample, OpenApiResponse, extend_schema

from apps.accounts.api.v1.serializers import (
    AuthSessionSerializer,
    LoginInputSerializer,
    MeSerializer,
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
