"""Explicit idempotency helpers for critical writes."""

from __future__ import annotations

import hashlib
import hmac
import json
from datetime import timedelta
from typing import Any

from django.conf import settings
from django.db import transaction
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from apps.activity.models import (
    IDEMPOTENCY_STATUS_COMPLETED,
    IDEMPOTENCY_STATUS_STARTED,
    IdempotencyRecord,
)
from common.api.errors import ConflictError

MAX_IDEMPOTENCY_RESPONSE_BYTES = 16_384
DEFAULT_IDEMPOTENCY_TTL = timedelta(hours=24)


def hash_idempotency_key(*, key: str) -> str:
    return hmac.new(
        settings.SECRET_KEY.encode("utf-8"),
        key.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


def request_hash_for_payload(*, payload: Any) -> str:
    if isinstance(payload, bytes):
        payload_bytes = payload
    elif isinstance(payload, str):
        payload_bytes = payload.encode("utf-8")
    else:
        payload_bytes = canonical_json_bytes(payload=payload)
    return hashlib.sha256(payload_bytes).hexdigest()


def begin_idempotency_record(
    *,
    organization,
    actor_membership,
    scope: str,
    key: str,
    request_hash: str,
    expires_at=None,
) -> IdempotencyRecord:
    key_hash = hash_idempotency_key(key=key)
    expiration = expires_at or timezone.now() + DEFAULT_IDEMPOTENCY_TTL
    with transaction.atomic():
        record, created = IdempotencyRecord.objects.select_for_update().get_or_create(
            organization=organization,
            actor_membership=actor_membership,
            scope=scope,
            key_hash=key_hash,
            defaults={
                "request_hash": request_hash,
                "expires_at": expiration,
                "status": IDEMPOTENCY_STATUS_STARTED,
            },
        )
        if not created:
            require_same_request_hash(record=record, request_hash=request_hash)
        return record


def complete_idempotency_record(
    *,
    record: IdempotencyRecord,
    response_status: int,
    response_body: dict,
) -> IdempotencyRecord:
    record.status = IDEMPOTENCY_STATUS_COMPLETED
    record.response_status = response_status
    record.response_body = bounded_response_body(response_body=response_body)
    record.completed_at = timezone.now()
    record.save(
        update_fields=[
            "status",
            "response_status",
            "response_body",
            "completed_at",
            "updated_at",
        ]
    )
    return record


def replay_response_for_record(*, record: IdempotencyRecord) -> tuple[int, dict] | None:
    if record.status != IDEMPOTENCY_STATUS_COMPLETED or record.response_status is None:
        return None
    return record.response_status, record.response_body


def require_same_request_hash(*, record: IdempotencyRecord, request_hash: str) -> None:
    if record.request_hash != request_hash:
        raise ConflictError(
            detail=_("The idempotency key was already used with different request data."),
            code="idempotency_key_conflict",
        )


def bounded_response_body(*, response_body: dict) -> dict:
    encoded = canonical_json_bytes(payload=response_body)
    if len(encoded) > MAX_IDEMPOTENCY_RESPONSE_BYTES:
        raise ValueError("Idempotency response body exceeds the safe storage limit.")
    return json.loads(encoded.decode("utf-8"))


def canonical_json_bytes(*, payload: Any) -> bytes:
    return json.dumps(
        payload,
        sort_keys=True,
        separators=(",", ":"),
        default=str,
    ).encode("utf-8")
