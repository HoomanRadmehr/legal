"""Common OpenAPI serializers and reusable response components."""

from __future__ import annotations

from drf_spectacular.utils import OpenApiExample, OpenApiParameter, OpenApiResponse
from rest_framework import serializers


class ErrorEnvelopeSerializer(serializers.Serializer):
    code = serializers.CharField()
    message = serializers.CharField()
    details = serializers.DictField()
    request_id = serializers.CharField()


ERROR_EXAMPLE = OpenApiExample(
    "Standard error",
    value={
        "code": "validation_error",
        "message": "Invalid request.",
        "details": {"field": ["This field is required."]},
        "request_id": "11111111-1111-1111-1111-111111111111",
    },
)

COMMON_ERROR_RESPONSES = {
    400: OpenApiResponse(ErrorEnvelopeSerializer, "Malformed or validation error", [ERROR_EXAMPLE]),
    401: OpenApiResponse(ErrorEnvelopeSerializer, "Authentication required or failed"),
    403: OpenApiResponse(ErrorEnvelopeSerializer, "Permission denied"),
    404: OpenApiResponse(ErrorEnvelopeSerializer, "Not found or not visible"),
    409: OpenApiResponse(ErrorEnvelopeSerializer, "Version, state, or idempotency conflict"),
    413: OpenApiResponse(ErrorEnvelopeSerializer, "Upload policy size exceeded"),
    422: OpenApiResponse(ErrorEnvelopeSerializer, "Domain rule violation"),
    429: OpenApiResponse(ErrorEnvelopeSerializer, "Rate limit exceeded"),
    503: OpenApiResponse(ErrorEnvelopeSerializer, "Temporary dependency unavailable"),
}

IDEMPOTENCY_KEY_HEADER = OpenApiParameter(
    name="Idempotency-Key",
    type=str,
    location=OpenApiParameter.HEADER,
    description="Stable UUID used by idempotent mutation endpoints.",
)

RETRY_AFTER_HEADER = OpenApiParameter(
    name="Retry-After",
    type=int,
    location=OpenApiParameter.HEADER,
    description="Seconds to wait before retrying a rate-limited request.",
    response=[429],
)
