"""OpenAPI declarations for task endpoints."""

from __future__ import annotations

from drf_spectacular.utils import (
    OpenApiExample,
    OpenApiParameter,
    OpenApiResponse,
    extend_schema,
    extend_schema_view,
)

from apps.tasks.api.v1.serializers import (
    TaskActionSerializer,
    TaskCreateSerializer,
    TaskDetailSerializer,
    TaskListSerializer,
    TaskUpdateSerializer,
)
from common.api.openapi import COMMON_ERROR_RESPONSES

TASK_EXAMPLE = OpenApiExample(
    "Task",
    value={
        "id": "11111111-1111-1111-1111-111111111111",
        "matter_id": "22222222-2222-2222-2222-222222222222",
        "title": "Review draft response",
        "due_at": "2027-07-15T12:00:00Z",
        "assignee_id": "33333333-3333-3333-3333-333333333333",
        "status": "todo",
        "version": 1,
        "created_at": "2026-07-14T10:00:00Z",
        "updated_at": "2026-07-14T10:00:00Z",
    },
)

TASK_ID_PARAMETER = OpenApiParameter(
    name="id",
    type=str,
    location=OpenApiParameter.PATH,
    description="Task UUID.",
)

TASK_VIEW_PARAMETER = OpenApiParameter(
    name="view",
    type=str,
    location=OpenApiParameter.QUERY,
    enum=["assigned_to_me"],
    description=(
        "Optional task view. The assigned_to_me view returns open tasks assigned to the current "
        "active membership unless a status filter is supplied."
    ),
)


task_schema = extend_schema_view(
    list=extend_schema(
        operation_id="tasks_list",
        summary="List visible tasks",
        parameters=[TASK_VIEW_PARAMETER],
        responses={200: OpenApiResponse(TaskListSerializer, examples=[TASK_EXAMPLE])},
    ),
    retrieve=extend_schema(
        operation_id="tasks_retrieve",
        summary="Retrieve a visible task",
        parameters=[TASK_ID_PARAMETER],
        responses={200: TaskDetailSerializer, 404: COMMON_ERROR_RESPONSES[404]},
    ),
    create=extend_schema(
        operation_id="tasks_create",
        summary="Create a task",
        request=TaskCreateSerializer,
        responses={
            201: TaskDetailSerializer,
            400: COMMON_ERROR_RESPONSES[400],
            403: COMMON_ERROR_RESPONSES[403],
            404: COMMON_ERROR_RESPONSES[404],
            422: COMMON_ERROR_RESPONSES[422],
        },
    ),
    partial_update=extend_schema(
        operation_id="tasks_partial_update",
        summary="Update a task with expected version",
        parameters=[TASK_ID_PARAMETER],
        request=TaskUpdateSerializer,
        responses={
            200: TaskDetailSerializer,
            400: COMMON_ERROR_RESPONSES[400],
            403: COMMON_ERROR_RESPONSES[403],
            404: COMMON_ERROR_RESPONSES[404],
            409: COMMON_ERROR_RESPONSES[409],
            422: COMMON_ERROR_RESPONSES[422],
        },
    ),
    complete=extend_schema(
        operation_id="tasks_complete",
        summary="Complete a task idempotently",
        parameters=[TASK_ID_PARAMETER],
        request=TaskActionSerializer,
        responses={
            200: TaskDetailSerializer,
            403: COMMON_ERROR_RESPONSES[403],
            404: COMMON_ERROR_RESPONSES[404],
            409: COMMON_ERROR_RESPONSES[409],
        },
    ),
    cancel=extend_schema(
        operation_id="tasks_cancel",
        summary="Cancel a task idempotently",
        parameters=[TASK_ID_PARAMETER],
        request=TaskActionSerializer,
        responses={
            200: TaskDetailSerializer,
            403: COMMON_ERROR_RESPONSES[403],
            404: COMMON_ERROR_RESPONSES[404],
            409: COMMON_ERROR_RESPONSES[409],
        },
    ),
)
