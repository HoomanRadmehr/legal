"""OpenAPI declarations for matter endpoints."""

from __future__ import annotations

from drf_spectacular.utils import (
    OpenApiParameter,
    extend_schema,
    extend_schema_view,
)

from apps.matters.api.v1.serializers import MatterChoicePageSerializer
from common.api.openapi import COMMON_ERROR_RESPONSES, RETRY_AFTER_HEADER

MATTER_CHOICE_PURPOSE_PARAMETER = OpenApiParameter(
    name="purpose",
    type=str,
    location=OpenApiParameter.QUERY,
    required=True,
    enum=["link", "document_upload", "deadline_create", "task_create", "notice_relation"],
    description="Form purpose that selects explicit matter permission rules.",
)
MATTER_CHOICE_KIND_PARAMETER = OpenApiParameter(
    name="kind",
    type=str,
    location=OpenApiParameter.QUERY,
    enum=["case", "contract", "notice"],
    description="Optional Matter kind filter.",
)
MATTER_CHOICE_QUERY_PARAMETER = OpenApiParameter(
    name="q",
    type=str,
    location=OpenApiParameter.QUERY,
    description="Optional search across title and reference code.",
)
MATTER_CHOICE_CURSOR_PARAMETER = OpenApiParameter(
    name="cursor",
    type=str,
    location=OpenApiParameter.QUERY,
    description="Opaque cursor from the previous response.",
)
MATTER_CHOICE_PAGE_SIZE_PARAMETER = OpenApiParameter(
    name="page_size",
    type=int,
    location=OpenApiParameter.QUERY,
    description="Page size from 1 to 50. Defaults to 20.",
)
MATTER_CHOICE_EXCLUDE_PARAMETER = OpenApiParameter(
    name="exclude_matter_id",
    type=str,
    location=OpenApiParameter.QUERY,
    description="Matter UUID to exclude from relation choices.",
)

matter_schema = extend_schema_view(
    list=extend_schema(exclude=True),
    retrieve=extend_schema(exclude=True),
    choices=extend_schema(
        operation_id="matters_choices",
        summary="List permission-scoped matter choices",
        description=(
            "Returns visible or editable Matters permitted for the requested form purpose. "
            "The response uses opaque cursor pagination and exposes only Matter ID, title, "
            "reference code, and kind."
        ),
        parameters=[
            MATTER_CHOICE_PURPOSE_PARAMETER,
            MATTER_CHOICE_KIND_PARAMETER,
            MATTER_CHOICE_QUERY_PARAMETER,
            MATTER_CHOICE_CURSOR_PARAMETER,
            MATTER_CHOICE_PAGE_SIZE_PARAMETER,
            MATTER_CHOICE_EXCLUDE_PARAMETER,
            RETRY_AFTER_HEADER,
        ],
        responses={
            200: MatterChoicePageSerializer,
            400: COMMON_ERROR_RESPONSES[400],
            401: COMMON_ERROR_RESPONSES[401],
            403: COMMON_ERROR_RESPONSES[403],
            429: COMMON_ERROR_RESPONSES[429],
        },
    ),
)
