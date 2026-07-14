from __future__ import annotations

from drf_spectacular.utils import OpenApiParameter, OpenApiResponse

from common.api.openapi import (
    COMMON_ERROR_RESPONSES,
    IDEMPOTENCY_KEY_HEADER,
    RETRY_AFTER_HEADER,
    ErrorEnvelopeSerializer,
)


def test_common_error_responses_are_reusable_openapi_components() -> None:
    expected_statuses = {400, 401, 403, 404, 409, 413, 422, 429, 503}

    assert set(COMMON_ERROR_RESPONSES) == expected_statuses
    assert all(
        isinstance(response, OpenApiResponse) for response in COMMON_ERROR_RESPONSES.values()
    )
    assert COMMON_ERROR_RESPONSES[400].response is ErrorEnvelopeSerializer


def test_common_headers_are_documented_for_reuse() -> None:
    assert isinstance(IDEMPOTENCY_KEY_HEADER, OpenApiParameter)
    assert IDEMPOTENCY_KEY_HEADER.name == "Idempotency-Key"
    assert isinstance(RETRY_AFTER_HEADER, OpenApiParameter)
    assert RETRY_AFTER_HEADER.name == "Retry-After"
