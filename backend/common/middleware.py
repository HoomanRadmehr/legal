"""Request correlation middleware."""

from __future__ import annotations

import logging
import uuid

REQUEST_ID_HEADER = "HTTP_X_REQUEST_ID"
RESPONSE_HEADER = "X-Request-ID"

logger = logging.getLogger("legal.request")


class RequestIdMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request_id = normalize_request_id(request.META.get(REQUEST_ID_HEADER))
        request.request_id = request_id
        response = self.get_response(request)
        response[RESPONSE_HEADER] = request_id
        logger.info(
            "request_finished",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.path,
                "status_code": response.status_code,
            },
        )
        return response


def normalize_request_id(raw_request_id: str | None) -> str:
    if not raw_request_id:
        return str(uuid.uuid4())
    try:
        return str(uuid.UUID(raw_request_id.strip()))
    except (AttributeError, ValueError):
        return str(uuid.uuid4())
