"""Safe structured logging helpers."""

from __future__ import annotations

import logging
import re

REDACTED = "[REDACTED]"
SAFE_LOG_FIELDS = (
    "request_id",
    "actor_id",
    "organization_id",
    "route",
    "method",
    "status_code",
    "duration_ms",
    "event_code",
)

SENSITIVE_PATTERNS = (
    (re.compile(r"(Authorization:\s*Bearer\s+)[^\s,;]+", re.IGNORECASE), rf"\1{REDACTED}"),
    (re.compile(r"(Cookie:\s*)[^\s]+", re.IGNORECASE), rf"\1{REDACTED}"),
    (re.compile(r"(Set-Cookie:\s*)[^\s]+", re.IGNORECASE), rf"\1{REDACTED}"),
    (re.compile(r"((?:access|refresh|id)_?token=)[^&\s]+", re.IGNORECASE), rf"\1{REDACTED}"),
    (re.compile(r"(ticket=)[^&\s]+", re.IGNORECASE), rf"\1{REDACTED}"),
    (re.compile(r"(X-Amz-(?:Credential|Security-Token|Signature)=)[^&\s]+"), rf"\1{REDACTED}"),
    (re.compile(r"((?:AWSAccessKeyId|Signature)=)[^&\s]+"), rf"\1{REDACTED}"),
    (
        re.compile(r"((?:password|secret|api[_-]?key|credential)=)[^&\s]+", re.IGNORECASE),
        rf"\1{REDACTED}",
    ),
)


class SensitiveDataRedactionFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        record.msg = redact_sensitive_text(record.getMessage())
        record.args = ()
        for field_name in ("path", "route", "url", "request_uri"):
            redact_record_field(record, field_name)
        return True


def redact_sensitive_text(value: str) -> str:
    redacted = value
    for pattern, replacement in SENSITIVE_PATTERNS:
        redacted = pattern.sub(replacement, redacted)
    return redacted


def redact_record_field(record: logging.LogRecord, field_name: str) -> None:
    if not hasattr(record, field_name):
        return
    field_value = getattr(record, field_name)
    if isinstance(field_value, str):
        setattr(record, field_name, redact_sensitive_text(field_value))
