"""OpenAPI declarations for legal notice endpoints."""

from __future__ import annotations

from drf_spectacular.utils import (
    OpenApiExample,
    OpenApiParameter,
    OpenApiResponse,
    extend_schema,
    extend_schema_view,
)

from apps.notices.api.v1.serializers import (
    NoticeArchiveSerializer,
    NoticeCreateSerializer,
    NoticeDetailSerializer,
    NoticeListSerializer,
    NoticeTimelineSerializer,
    NoticeUpdateSerializer,
)
from common.api.openapi import COMMON_ERROR_RESPONSES

NOTICE_EXAMPLE = OpenApiExample(
    "Legal notice",
    value={
        "id": "11111111-1111-1111-1111-111111111111",
        "title": "Regulatory demand letter",
        "reference_code": "NOT-2026-001",
        "status": "response_due",
        "priority": "high",
        "owner_id": "22222222-2222-2222-2222-222222222222",
        "sender": "City Authority",
        "received_date": "2026-07-14",
        "response_deadline": "2026-07-21T12:00:00Z",
        "response_status": "pending",
        "version": 1,
    },
)

NOTICE_ID_PARAMETER = OpenApiParameter(
    name="id",
    type=str,
    location=OpenApiParameter.PATH,
    description="Notice identifier. This is the underlying Matter UUID.",
)


notice_schema = extend_schema_view(
    list=extend_schema(
        operation_id="notices_list",
        summary="List visible legal notices",
        responses={200: OpenApiResponse(NoticeListSerializer, examples=[NOTICE_EXAMPLE])},
    ),
    retrieve=extend_schema(
        operation_id="notices_retrieve",
        summary="Retrieve a visible legal notice",
        parameters=[NOTICE_ID_PARAMETER],
        responses={200: NoticeDetailSerializer, 404: COMMON_ERROR_RESPONSES[404]},
    ),
    create=extend_schema(
        operation_id="notices_create",
        summary="Create a legal notice with linked response deadline",
        request=NoticeCreateSerializer,
        responses={
            201: NoticeDetailSerializer,
            400: COMMON_ERROR_RESPONSES[400],
            403: COMMON_ERROR_RESPONSES[403],
            404: COMMON_ERROR_RESPONSES[404],
            409: COMMON_ERROR_RESPONSES[409],
            422: COMMON_ERROR_RESPONSES[422],
        },
    ),
    partial_update=extend_schema(
        operation_id="notices_partial_update",
        summary="Update a legal notice and synchronize its response deadline",
        parameters=[NOTICE_ID_PARAMETER],
        request=NoticeUpdateSerializer,
        responses={
            200: NoticeDetailSerializer,
            400: COMMON_ERROR_RESPONSES[400],
            403: COMMON_ERROR_RESPONSES[403],
            404: COMMON_ERROR_RESPONSES[404],
            409: COMMON_ERROR_RESPONSES[409],
            422: COMMON_ERROR_RESPONSES[422],
        },
    ),
    archive=extend_schema(
        operation_id="notices_archive",
        summary="Archive a legal notice and cancel its response deadline",
        parameters=[NOTICE_ID_PARAMETER],
        request=NoticeArchiveSerializer,
        responses={
            200: NoticeDetailSerializer,
            403: COMMON_ERROR_RESPONSES[403],
            404: COMMON_ERROR_RESPONSES[404],
            409: COMMON_ERROR_RESPONSES[409],
        },
    ),
    timeline=extend_schema(
        operation_id="notices_timeline",
        summary="Return permission-aware notice activity timeline",
        parameters=[NOTICE_ID_PARAMETER],
        responses={200: NoticeTimelineSerializer(many=True), 404: COMMON_ERROR_RESPONSES[404]},
    ),
)
