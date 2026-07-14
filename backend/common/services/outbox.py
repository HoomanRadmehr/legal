"""Transactional outbox creation and bounded dispatch helpers."""

from __future__ import annotations

from django.db import transaction
from django.utils import timezone

from apps.activity.models import OutboxEvent

MAX_OUTBOX_ATTEMPTS = 3
ERROR_DISPATCH_FAILED = "dispatch_failed"
ERROR_MAX_ATTEMPTS = "max_attempts_exceeded"
DISPATCHED = "dispatched"
ALREADY_PUBLISHED = "already_published"
NO_EVENT = "no_event"
RETRY_RECORDED = "retry_recorded"
MAX_ATTEMPTS_REACHED = "max_attempts_reached"

SAFE_OUTBOX_FIELDS = {
    "action",
    "actor_id",
    "aggregate_id",
    "aggregate_type",
    "event_version",
    "id",
    "matter_id",
    "organization_id",
    "reference_code",
    "target_id",
    "target_type",
}


class OutboxDispatchError(Exception):
    """Expected dispatch failure with a safe retry path."""


def create_outbox_event(
    *,
    event_type: str,
    aggregate_type: str,
    aggregate_id,
    payload: dict,
    organization=None,
    event_version: int = 1,
    available_at=None,
) -> OutboxEvent:
    return OutboxEvent.objects.create(
        organization=organization,
        event_type=event_type,
        event_version=event_version,
        aggregate_type=aggregate_type,
        aggregate_id=aggregate_id,
        payload=safe_outbox_payload(payload=payload),
        available_at=available_at or timezone.now(),
    )


def dispatch_next_outbox_event() -> str:
    event = next_dispatchable_event()
    if event is None:
        return NO_EVENT
    return dispatch_outbox_event(event_id=event.id)


def dispatch_outbox_event(*, event_id) -> str:
    event = reserve_outbox_event(event_id=event_id)
    if event is None:
        return ALREADY_PUBLISHED
    if event.last_error_code == ERROR_MAX_ATTEMPTS:
        return MAX_ATTEMPTS_REACHED

    try:
        publish_outbox_event(event=event)
    except OutboxDispatchError:
        record_outbox_failure(event_id=event.id, error_code=ERROR_DISPATCH_FAILED)
        return RETRY_RECORDED
    mark_outbox_published(event_id=event.id)
    return DISPATCHED


def next_dispatchable_event() -> OutboxEvent | None:
    return (
        OutboxEvent.objects.filter(
            published_at__isnull=True,
            available_at__lte=timezone.now(),
            attempt_count__lt=MAX_OUTBOX_ATTEMPTS,
        )
        .order_by("available_at", "created_at")
        .first()
    )


def reserve_outbox_event(*, event_id) -> OutboxEvent | None:
    with transaction.atomic():
        event = OutboxEvent.objects.select_for_update().filter(id=event_id).first()
        if event is None or event.published_at is not None:
            return None
        if event.attempt_count >= MAX_OUTBOX_ATTEMPTS:
            event.last_error_code = ERROR_MAX_ATTEMPTS
            event.save(update_fields=["last_error_code", "updated_at"])
            return event
        event.attempt_count += 1
        event.save(update_fields=["attempt_count", "updated_at"])
        return event


def mark_outbox_published(*, event_id) -> None:
    OutboxEvent.objects.filter(id=event_id, published_at__isnull=True).update(
        published_at=timezone.now(),
        last_error_code="",
    )


def record_outbox_failure(*, event_id, error_code: str) -> None:
    OutboxEvent.objects.filter(id=event_id, published_at__isnull=True).update(
        last_error_code=error_code,
    )


def publish_outbox_event(*, event: OutboxEvent) -> None:
    return None


def safe_outbox_payload(*, payload: dict) -> dict:
    return {key: payload[key] for key in payload if key in SAFE_OUTBOX_FIELDS}
