"""OpenAPI declarations for legal case endpoints."""

from __future__ import annotations

from drf_spectacular.utils import (
    OpenApiExample,
    OpenApiParameter,
    OpenApiResponse,
    extend_schema,
    extend_schema_view,
)

from apps.cases.api.v1.serializers import (
    CaseArchiveSerializer,
    CaseCreateSerializer,
    CaseDetailSerializer,
    CaseListSerializer,
    CaseTimelineSerializer,
    CaseUpdateSerializer,
)
from common.api.openapi import COMMON_ERROR_RESPONSES

CASE_EXAMPLE = OpenApiExample(
    "Legal case",
    value={
        "id": "11111111-1111-1111-1111-111111111111",
        "title": "Employment dispute",
        "reference_code": "CASE-2026-001",
        "status": "open",
        "priority": "normal",
        "owner_id": "22222222-2222-2222-2222-222222222222",
        "case_type": "litigation",
        "version": 1,
        "archived_at": None,
        "created_at": "2026-07-14T12:00:00Z",
        "updated_at": "2026-07-14T12:00:00Z",
    },
)

CASE_ID_PARAMETER = OpenApiParameter(
    name="id",
    type=str,
    location=OpenApiParameter.PATH,
    description="Case identifier. This is the underlying Matter UUID.",
)


case_schema = extend_schema_view(
    list=extend_schema(
        operation_id="cases_list",
        summary="List visible legal cases",
        responses={200: OpenApiResponse(CaseListSerializer, examples=[CASE_EXAMPLE])},
    ),
    retrieve=extend_schema(
        operation_id="cases_retrieve",
        summary="Retrieve a visible legal case",
        parameters=[CASE_ID_PARAMETER],
        responses={200: CaseDetailSerializer, 404: COMMON_ERROR_RESPONSES[404]},
    ),
    create=extend_schema(
        operation_id="cases_create",
        summary="Create a legal case",
        request=CaseCreateSerializer,
        responses={
            201: CaseDetailSerializer,
            400: COMMON_ERROR_RESPONSES[400],
            403: COMMON_ERROR_RESPONSES[403],
            409: COMMON_ERROR_RESPONSES[409],
            422: COMMON_ERROR_RESPONSES[422],
        },
    ),
    partial_update=extend_schema(
        operation_id="cases_partial_update",
        summary="Update a legal case with expected version",
        parameters=[CASE_ID_PARAMETER],
        request=CaseUpdateSerializer,
        responses={
            200: CaseDetailSerializer,
            400: COMMON_ERROR_RESPONSES[400],
            403: COMMON_ERROR_RESPONSES[403],
            404: COMMON_ERROR_RESPONSES[404],
            409: COMMON_ERROR_RESPONSES[409],
        },
    ),
    archive=extend_schema(
        operation_id="cases_archive",
        summary="Archive a legal case without hard delete",
        parameters=[CASE_ID_PARAMETER],
        request=CaseArchiveSerializer,
        responses={
            200: CaseDetailSerializer,
            403: COMMON_ERROR_RESPONSES[403],
            404: COMMON_ERROR_RESPONSES[404],
            409: COMMON_ERROR_RESPONSES[409],
        },
    ),
    timeline=extend_schema(
        operation_id="cases_timeline",
        summary="Return permission-aware case activity timeline",
        parameters=[CASE_ID_PARAMETER],
        responses={200: CaseTimelineSerializer(many=True), 404: COMMON_ERROR_RESPONSES[404]},
    ),
)
