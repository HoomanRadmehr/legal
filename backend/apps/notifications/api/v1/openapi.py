"""OpenAPI declarations for notification endpoints."""

from __future__ import annotations

from drf_spectacular.utils import (
    OpenApiExample,
    OpenApiParameter,
    OpenApiResponse,
    extend_schema,
    extend_schema_view,
)

from apps.notifications.api.v1.serializers import (
    NotificationPreferenceReplaceSerializer,
    NotificationPreferenceSerializer,
    NotificationSerializer,
    ReadAllResponseSerializer,
)
from common.api.openapi import COMMON_ERROR_RESPONSES

NOTIFICATION_EXAMPLE = OpenApiExample(
    "Notification",
    value={
        "id": "11111111-1111-1111-1111-111111111111",
        "recipient_id": "22222222-2222-2222-2222-222222222222",
        "event_type": "deadline.reminder.created",
        "title": "Deadline reminder",
        "body": "A deadline needs attention.",
        "data": {"deadline_id": "33333333-3333-3333-3333-333333333333"},
        "read_at": None,
        "created_at": "2026-07-14T10:00:00Z",
        "updated_at": "2026-07-14T10:00:00Z",
    },
)

NOTIFICATION_ID_PARAMETER = OpenApiParameter(
    name="id",
    type=str,
    location=OpenApiParameter.PATH,
    description="Notification UUID.",
)


notification_schema = extend_schema_view(
    list=extend_schema(
        operation_id="notifications_list",
        summary="List own notifications",
        responses={200: OpenApiResponse(NotificationSerializer, examples=[NOTIFICATION_EXAMPLE])},
    ),
    retrieve=extend_schema(
        operation_id="notifications_retrieve",
        summary="Retrieve an own notification",
        parameters=[NOTIFICATION_ID_PARAMETER],
        responses={200: NotificationSerializer, 404: COMMON_ERROR_RESPONSES[404]},
    ),
    read=extend_schema(
        operation_id="notifications_read",
        summary="Mark an own notification read",
        parameters=[NOTIFICATION_ID_PARAMETER],
        responses={200: NotificationSerializer, 404: COMMON_ERROR_RESPONSES[404]},
    ),
    read_all=extend_schema(
        operation_id="notifications_read_all",
        summary="Mark all own notifications read",
        responses={200: ReadAllResponseSerializer},
    ),
)


notification_preference_list_schema = extend_schema(
    operation_id="notification_preferences_list",
    summary="List own notification preferences",
    responses={200: NotificationPreferenceSerializer(many=True)},
)

notification_preference_replace_schema = extend_schema(
    operation_id="notification_preferences_replace",
    summary="Replace own notification preferences",
    request=NotificationPreferenceReplaceSerializer,
    responses={
        200: NotificationPreferenceSerializer(many=True),
        400: COMMON_ERROR_RESPONSES[400],
        403: COMMON_ERROR_RESPONSES[403],
    },
)
