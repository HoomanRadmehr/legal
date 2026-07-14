from __future__ import annotations

from rest_framework.exceptions import NotFound, PermissionDenied, Throttled, ValidationError
from rest_framework.test import APIRequestFactory

from common.api.errors import ConflictError
from common.api.exception_handler import exception_handler


def handled_response(exc):
    request = APIRequestFactory().get("/api/v1/example/")
    request.request_id = "11111111-1111-1111-1111-111111111111"
    return exception_handler(exc, {"request": request})


def test_validation_error_uses_standard_envelope() -> None:
    response = handled_response(ValidationError({"name": ["This field is required."]}))

    assert response.status_code == 400
    assert response.data["code"] == "validation_error"
    assert response.data["message"] == "Invalid request."
    assert response.data["details"] == {"name": ["This field is required."]}
    assert response.data["request_id"] == "11111111-1111-1111-1111-111111111111"


def test_not_found_error_uses_standard_envelope() -> None:
    response = handled_response(NotFound())

    assert response.status_code == 404
    assert response.data["code"] == "not_found"
    assert response.data["details"] == {}
    assert response.data["request_id"] == "11111111-1111-1111-1111-111111111111"


def test_permission_error_uses_standard_envelope() -> None:
    response = handled_response(PermissionDenied())

    assert response.status_code == 403
    assert response.data["code"] == "permission_denied"
    assert response.data["details"] == {}


def test_conflict_error_uses_standard_envelope() -> None:
    response = handled_response(ConflictError())

    assert response.status_code == 409
    assert response.data["code"] == "conflict"
    assert response.data["details"] == {}


def test_throttle_error_uses_standard_envelope_and_retry_header() -> None:
    response = handled_response(Throttled(wait=42))

    assert response.status_code == 429
    assert response.data["code"] == "rate_limit_exceeded"
    assert response.data["message"] == "Too many requests. Try again later."
    assert response.data["details"] == {"retry_after": 42}
    assert response["Retry-After"] == "42"
