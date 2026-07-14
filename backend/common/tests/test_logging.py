from __future__ import annotations

import logging

from common.logging import REDACTED, SensitiveDataRedactionFilter, redact_sensitive_text


def test_redacts_tokens_cookies_presigned_values_and_credentials() -> None:
    message = (
        "Authorization: Bearer access-token Cookie: legal_refresh=refresh-token "
        "https://minio.local/object?X-Amz-Credential=abc&X-Amz-Signature=def "
        "/ws/v1/events/?ticket=secret-ticket password=secret"
    )

    redacted = redact_sensitive_text(message)

    assert "access-token" not in redacted
    assert "refresh-token" not in redacted
    assert "secret-ticket" not in redacted
    assert "password=secret" not in redacted
    assert redacted.count(REDACTED) >= 5


def test_redaction_filter_updates_log_message_and_uri_fields() -> None:
    record = logging.LogRecord(
        name="legal.test",
        level=logging.INFO,
        pathname=__file__,
        lineno=1,
        msg="Authorization: Bearer %s",
        args=("token-value",),
        exc_info=None,
    )
    record.url = "/documents/download?X-Amz-Signature=signature-value"

    SensitiveDataRedactionFilter().filter(record)

    assert "token-value" not in record.getMessage()
    assert "signature-value" not in record.url
    assert REDACTED in record.getMessage()
    assert REDACTED in record.url
