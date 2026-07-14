"""OpenAPI declarations for deadline endpoints."""

from __future__ import annotations

from drf_spectacular.utils import (
    OpenApiExample,
    OpenApiParameter,
    OpenApiResponse,
    extend_schema,
    extend_schema_view,
)

from apps.deadlines.api.v1.serializers import (
    DeadlineActionSerializer,
    DeadlineCreateSerializer,
    DeadlineDetailSerializer,
    DeadlineListSerializer,
    DeadlineUpdateSerializer,
)
from common.api.openapi import COMMON_ERROR_RESPONSES

DEADLINE_EXAMPLE = OpenApiExample(
    "Deadline",
    value={
        "id": "11111111-1111-1111-1111-111111111111",
        "matter_id": "22222222-2222-2222-2222-222222222222",
        "title": "File response",
        "due_at": "2026-07-14T12:00:00Z",
        "assignee_id": "33333333-3333-3333-3333-333333333333",
        "status": "open",
        "priority": "normal",
        "reminder_enabled": True,
        "version": 1,
        "created_at": "2026-07-14T10:00:00Z",
        "updated_at": "2026-07-14T10:00:00Z",
    },
)

DEADLINE_ID_PARAMETER = OpenApiParameter(
    name="id",
    type=str,
    location=OpenApiParameter.PATH,
    description="Deadline UUID.",
)

DEADLINE_VIEW_PARAMETER = OpenApiParameter(
    name="view",
    type=str,
    location=OpenApiParameter.QUERY,
    enum=["upcoming", "overdue", "today", "assigned_to_me"],
    description=(
        "Optional deadline view. Open views exclude completed and cancelled deadlines unless "
        "a status filter is supplied. Today uses the organization timezone. Upcoming is open "
        "deadlines after the current instant with no MVP horizon."
    ),
)


deadline_schema = extend_schema_view(
    list=extend_schema(
        operation_id="deadlines_list",
        summary="List visible deadlines",
        parameters=[DEADLINE_VIEW_PARAMETER],
        responses={200: OpenApiResponse(DeadlineListSerializer, examples=[DEADLINE_EXAMPLE])},
    ),
    retrieve=extend_schema(
        operation_id="deadlines_retrieve",
        summary="Retrieve a visible deadline",
        parameters=[DEADLINE_ID_PARAMETER],
        responses={200: DeadlineDetailSerializer, 404: COMMON_ERROR_RESPONSES[404]},
    ),
    create=extend_schema(
        operation_id="deadlines_create",
        summary="Create a deadline",
        request=DeadlineCreateSerializer,
        responses={
            201: DeadlineDetailSerializer,
            400: COMMON_ERROR_RESPONSES[400],
            403: COMMON_ERROR_RESPONSES[403],
            404: COMMON_ERROR_RESPONSES[404],
            422: COMMON_ERROR_RESPONSES[422],
        },
    ),
    partial_update=extend_schema(
        operation_id="deadlines_partial_update",
        summary="Update a deadline with expected version",
        parameters=[DEADLINE_ID_PARAMETER],
        request=DeadlineUpdateSerializer,
        responses={
            200: DeadlineDetailSerializer,
            400: COMMON_ERROR_RESPONSES[400],
            403: COMMON_ERROR_RESPONSES[403],
            404: COMMON_ERROR_RESPONSES[404],
            409: COMMON_ERROR_RESPONSES[409],
            422: COMMON_ERROR_RESPONSES[422],
        },
    ),
    complete=extend_schema(
        operation_id="deadlines_complete",
        summary="Complete a deadline idempotently",
        parameters=[DEADLINE_ID_PARAMETER],
        request=DeadlineActionSerializer,
        responses={
            200: DeadlineDetailSerializer,
            403: COMMON_ERROR_RESPONSES[403],
            404: COMMON_ERROR_RESPONSES[404],
            409: COMMON_ERROR_RESPONSES[409],
        },
    ),
    cancel=extend_schema(
        operation_id="deadlines_cancel",
        summary="Cancel a deadline idempotently",
        parameters=[DEADLINE_ID_PARAMETER],
        request=DeadlineActionSerializer,
        responses={
            200: DeadlineDetailSerializer,
            403: COMMON_ERROR_RESPONSES[403],
            404: COMMON_ERROR_RESPONSES[404],
            409: COMMON_ERROR_RESPONSES[409],
        },
    ),
)
