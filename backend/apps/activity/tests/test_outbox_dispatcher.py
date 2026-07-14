"""Tests for transactional outbox services."""

from __future__ import annotations

import uuid

import pytest
from django.db import transaction

from apps.activity.models import OutboxEvent
from apps.activity.tasks import dispatch_outbox_event_task
from apps.activity.tests.factories import OutboxEventFactory
from apps.organizations.tests.factories import OrganizationFactory
from common.services import outbox
from common.services.outbox import (
    DISPATCHED,
    ERROR_DISPATCH_FAILED,
    ERROR_MAX_ATTEMPTS,
    MAX_ATTEMPTS_REACHED,
    MAX_OUTBOX_ATTEMPTS,
    RETRY_RECORDED,
    OutboxDispatchError,
    create_outbox_event,
    dispatch_outbox_event,
)

pytestmark = pytest.mark.django_db


def test_create_outbox_event_keeps_safe_payload_only() -> None:
    organization = OrganizationFactory()
    aggregate_id = uuid.uuid4()

    event = create_outbox_event(
        organization=organization,
        event_type="case.created",
        aggregate_type="matter",
        aggregate_id=aggregate_id,
        payload={"matter_id": str(aggregate_id), "document_body": "secret"},
    )

    assert event.payload == {"matter_id": str(aggregate_id)}
    assert event.organization == organization
    assert event.published_at is None


def test_outbox_event_rolls_back_with_business_transaction() -> None:
    organization = OrganizationFactory()

    with pytest.raises(RuntimeError), transaction.atomic():
        create_outbox_event(
            organization=organization,
            event_type="case.created",
            aggregate_type="matter",
            aggregate_id=uuid.uuid4(),
            payload={"matter_id": "safe"},
        )
        raise RuntimeError("rollback")

    assert OutboxEvent.objects.count() == 0


def test_dispatch_outbox_event_is_idempotent(monkeypatch: pytest.MonkeyPatch) -> None:
    event = OutboxEventFactory()
    calls = []

    def fake_publish(*, event):
        calls.append(event.id)

    monkeypatch.setattr(outbox, "publish_outbox_event", fake_publish)

    first_result = dispatch_outbox_event(event_id=event.id)
    second_result = dispatch_outbox_event(event_id=event.id)
    event.refresh_from_db()

    assert first_result == DISPATCHED
    assert second_result == outbox.ALREADY_PUBLISHED
    assert calls == [event.id]
    assert event.published_at is not None
    assert event.attempt_count == 1


def test_dispatch_records_bounded_retry_failure(monkeypatch: pytest.MonkeyPatch) -> None:
    event = OutboxEventFactory()

    def fail_publish(*, event):
        raise OutboxDispatchError("temporary")

    monkeypatch.setattr(outbox, "publish_outbox_event", fail_publish)

    for _ in range(MAX_OUTBOX_ATTEMPTS):
        assert dispatch_outbox_event(event_id=event.id) == RETRY_RECORDED
    final_result = dispatch_outbox_event(event_id=event.id)
    event.refresh_from_db()

    assert final_result == MAX_ATTEMPTS_REACHED
    assert event.attempt_count == MAX_OUTBOX_ATTEMPTS
    assert event.last_error_code == ERROR_MAX_ATTEMPTS
    assert event.published_at is None


def test_dispatch_records_safe_error_code(monkeypatch: pytest.MonkeyPatch) -> None:
    event = OutboxEventFactory()

    def fail_publish(*, event):
        raise OutboxDispatchError("provider secret leaked here")

    monkeypatch.setattr(outbox, "publish_outbox_event", fail_publish)

    result = dispatch_outbox_event(event_id=event.id)
    event.refresh_from_db()

    assert result == RETRY_RECORDED
    assert event.last_error_code == ERROR_DISPATCH_FAILED


def test_celery_task_dispatches_by_id(monkeypatch: pytest.MonkeyPatch) -> None:
    event = OutboxEventFactory()
    calls = []

    def fake_publish(*, event):
        calls.append(event.id)

    monkeypatch.setattr(outbox, "publish_outbox_event", fake_publish)

    assert dispatch_outbox_event_task(str(event.id)) == DISPATCHED
    assert calls == [event.id]
