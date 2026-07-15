"""OpenAPI declarations for offboarding endpoints."""

from __future__ import annotations

from drf_spectacular.utils import OpenApiExample, OpenApiResponse, extend_schema

from apps.offboarding.api.v1.serializers import (
    OffboardingExecuteRequestSerializer,
    OffboardingPreviewRequestSerializer,
    OffboardingPreviewSerializer,
    OffboardingRunSerializer,
)
from common.api.openapi import COMMON_ERROR_RESPONSES, IDEMPOTENCY_KEY_HEADER

PREVIEW_EXAMPLE = OpenApiExample(
    "Offboarding preview",
    value={
        "departing": {
            "id": "11111111-1111-1111-1111-111111111111",
            "display_name": "Demo Counsel",
            "role": "legal_counsel",
        },
        "replacement": {
            "id": "22222222-2222-2222-2222-222222222222",
            "display_name": "Demo Manager",
            "role": "legal_manager",
        },
        "owned_matters": [],
        "open_tasks": [],
        "open_deadlines": [],
        "active_access_grants": [],
        "warnings": [],
        "counts": {
            "owned_matters": 0,
            "open_tasks": 0,
            "open_deadlines": 0,
            "active_access_grants": 0,
        },
        "fingerprint": "a" * 64,
    },
)

preview_schema = extend_schema(
    operation_id="offboarding_preview",
    summary="Preview offboarding effects",
    request=OffboardingPreviewRequestSerializer,
    responses={
        200: OpenApiResponse(OffboardingPreviewSerializer, examples=[PREVIEW_EXAMPLE]),
        403: COMMON_ERROR_RESPONSES[403],
        422: COMMON_ERROR_RESPONSES[422],
    },
)

execute_schema = extend_schema(
    operation_id="offboarding_execute",
    summary="Execute an idempotent offboarding transfer",
    parameters=[IDEMPOTENCY_KEY_HEADER],
    request=OffboardingExecuteRequestSerializer,
    responses={
        200: OpenApiResponse(OffboardingRunSerializer),
        400: COMMON_ERROR_RESPONSES[400],
        403: COMMON_ERROR_RESPONSES[403],
        409: COMMON_ERROR_RESPONSES[409],
        422: COMMON_ERROR_RESPONSES[422],
    },
)

retrieve_schema = extend_schema(
    operation_id="offboarding_retrieve",
    summary="Retrieve an offboarding run",
    responses={
        200: OpenApiResponse(OffboardingRunSerializer),
        403: COMMON_ERROR_RESPONSES[403],
        404: COMMON_ERROR_RESPONSES[404],
    },
)
