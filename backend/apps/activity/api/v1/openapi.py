"""OpenAPI declarations for activity endpoints."""

from __future__ import annotations

from drf_spectacular.utils import OpenApiParameter, extend_schema, extend_schema_view

from apps.activity.api.v1.serializers import ActivityLogSerializer
from common.api.openapi import COMMON_ERROR_RESPONSES

MATTER_ID_PARAMETER = OpenApiParameter(
    name="matter_id",
    type=str,
    location=OpenApiParameter.PATH,
    description="Matter identifier.",
)


activity_schema = extend_schema_view(
    list=extend_schema(
        operation_id="activity_list",
        summary="List visible activity",
        responses={200: ActivityLogSerializer(many=True)},
    ),
    retrieve=extend_schema(
        operation_id="activity_retrieve",
        summary="Retrieve visible activity",
        responses={200: ActivityLogSerializer, 404: COMMON_ERROR_RESPONSES[404]},
    ),
)

matter_timeline_schema = extend_schema(
    operation_id="matters_timeline",
    summary="List permission-scoped matter activity timeline",
    parameters=[MATTER_ID_PARAMETER],
    responses={200: ActivityLogSerializer(many=True), 404: COMMON_ERROR_RESPONSES[404]},
)
