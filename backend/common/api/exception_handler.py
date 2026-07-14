"""DRF exception handler that returns the project error envelope."""

from __future__ import annotations

import math
from collections.abc import Mapping, Sequence

from django.utils.translation import gettext_lazy as _
from rest_framework.exceptions import (
    APIException,
    AuthenticationFailed,
    ErrorDetail,
    NotAuthenticated,
    NotFound,
    PermissionDenied,
    Throttled,
    ValidationError,
)
from rest_framework.views import exception_handler as drf_exception_handler


def exception_handler(exc, context):
    response = drf_exception_handler(exc, context)
    if response is None:
        return None

    response.data = {
        "code": error_code(exc),
        "message": error_message(exc, response.data),
        "details": error_details(exc, response.data),
        "request_id": request_id_from_context(context),
    }
    add_retry_after_header(exc, response)
    return response


def error_code(exc) -> str:
    if isinstance(exc, ValidationError):
        return "validation_error"
    if isinstance(exc, Throttled):
        return "rate_limit_exceeded"
    if isinstance(exc, NotAuthenticated):
        return "authentication_required"
    if isinstance(exc, AuthenticationFailed):
        code = exc.get_codes()
        if isinstance(code, str):
            return code
        return "authentication_failed"
    if isinstance(exc, NotFound):
        return "not_found"
    if isinstance(exc, PermissionDenied):
        code = exc.get_codes()
        if isinstance(code, str):
            return code
        return "permission_denied"
    if isinstance(exc, APIException):
        code = exc.get_codes()
        if isinstance(code, str):
            return code
    return "api_error"


def error_message(exc, response_data) -> str:
    if isinstance(exc, ValidationError):
        return str(_("Invalid request."))
    if isinstance(exc, Throttled):
        return str(_("Too many requests. Try again later."))
    if isinstance(response_data, Mapping) and "detail" in response_data:
        return str(response_data["detail"])
    return str(_("Request failed."))


def error_details(exc, response_data):
    if isinstance(exc, ValidationError):
        return normalize_detail(response_data)
    if isinstance(exc, Throttled) and exc.wait is not None:
        return {"retry_after": math.ceil(exc.wait)}
    return {}


def normalize_detail(value):
    if isinstance(value, Mapping):
        return {key: normalize_detail(detail) for key, detail in value.items()}
    if isinstance(value, Sequence) and not isinstance(value, (str, bytes)):
        return [normalize_detail(detail) for detail in value]
    if isinstance(value, ErrorDetail):
        return str(value)
    return value


def request_id_from_context(context) -> str:
    request = context.get("request") if context else None
    return getattr(request, "request_id", "")


def add_retry_after_header(exc, response) -> None:
    if isinstance(exc, Throttled) and exc.wait is not None:
        response["Retry-After"] = str(math.ceil(exc.wait))
