from __future__ import annotations

import logging
import uuid

from django.http import HttpResponse
from django.test import RequestFactory

from common.middleware import RESPONSE_HEADER, RequestIdMiddleware


def ok_response(request):
    return HttpResponse("ok")


def test_request_id_middleware_accepts_valid_uuid_header() -> None:
    request_id = str(uuid.uuid4())
    request = RequestFactory().get("/", HTTP_X_REQUEST_ID=request_id)

    response = RequestIdMiddleware(ok_response)(request)

    assert request.request_id == request_id
    assert response[RESPONSE_HEADER] == request_id


def test_request_id_middleware_replaces_invalid_header() -> None:
    request = RequestFactory().get("/", HTTP_X_REQUEST_ID="not-a-safe-request-id")

    response = RequestIdMiddleware(ok_response)(request)

    assert response[RESPONSE_HEADER] != "not-a-safe-request-id"
    assert str(uuid.UUID(response[RESPONSE_HEADER])) == response[RESPONSE_HEADER]


def test_request_id_middleware_logs_safe_request_fields(caplog) -> None:
    request = RequestFactory().get("/api/v1/example/?ticket=hidden")

    with caplog.at_level(logging.INFO, logger="legal.request"):
        response = RequestIdMiddleware(ok_response)(request)

    record = caplog.records[0]
    assert record.request_id == response[RESPONSE_HEADER]
    assert record.method == "GET"
    assert record.path == "/api/v1/example/"
    assert record.status_code == 200
