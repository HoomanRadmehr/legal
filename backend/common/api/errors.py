"""Common API exceptions and error envelope helpers."""

from __future__ import annotations

from django.utils.translation import gettext_lazy as _
from rest_framework.exceptions import APIException


class ConflictError(APIException):
    status_code = 409
    default_detail = _("The request conflicts with the current resource state.")
    default_code = "conflict"


class DomainRuleError(APIException):
    status_code = 422
    default_detail = _("The request violates a domain rule.")
    default_code = "domain_rule_violation"
