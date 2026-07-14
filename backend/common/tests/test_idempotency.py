"""Tests for critical write idempotency primitives."""

from __future__ import annotations

import pytest

from apps.activity.models import (
    IDEMPOTENCY_STATUS_COMPLETED,
    IDEMPOTENCY_STATUS_STARTED,
    IdempotencyRecord,
)
from apps.organizations.tests.factories import MembershipFactory, OrganizationFactory
from common.api.errors import ConflictError
from common.services.idempotency import (
    MAX_IDEMPOTENCY_RESPONSE_BYTES,
    begin_idempotency_record,
    complete_idempotency_record,
    replay_response_for_record,
    request_hash_for_payload,
)

pytestmark = pytest.mark.django_db


def test_begin_idempotency_record_hashes_key_and_stores_request_hash() -> None:
    organization = OrganizationFactory()
    actor = MembershipFactory(organization=organization)
    request_hash = request_hash_for_payload(payload={"title": "Case A"})

    record = begin_idempotency_record(
        organization=organization,
        actor_membership=actor,
        scope="cases.create",
        key="client-key-1",
        request_hash=request_hash,
    )

    assert record.status == IDEMPOTENCY_STATUS_STARTED
    assert record.key_hash != "client-key-1"
    assert len(record.key_hash) == 64
    assert record.request_hash == request_hash


def test_same_key_and_request_returns_completed_response() -> None:
    organization = OrganizationFactory()
    actor = MembershipFactory(organization=organization)
    request_hash = request_hash_for_payload(payload={"title": "Case A"})
    record = begin_idempotency_record(
        organization=organization,
        actor_membership=actor,
        scope="cases.create",
        key="client-key-1",
        request_hash=request_hash,
    )
    complete_idempotency_record(
        record=record,
        response_status=201,
        response_body={"id": "case-1", "status": "created"},
    )

    replay_record = begin_idempotency_record(
        organization=organization,
        actor_membership=actor,
        scope="cases.create",
        key="client-key-1",
        request_hash=request_hash,
    )

    assert replay_record.id == record.id
    assert replay_record.status == IDEMPOTENCY_STATUS_COMPLETED
    assert replay_response_for_record(record=replay_record) == (
        201,
        {"id": "case-1", "status": "created"},
    )
    assert IdempotencyRecord.objects.count() == 1


def test_same_key_and_different_request_returns_409_conflict() -> None:
    organization = OrganizationFactory()
    actor = MembershipFactory(organization=organization)
    first_hash = request_hash_for_payload(payload={"title": "Case A"})
    second_hash = request_hash_for_payload(payload={"title": "Case B"})
    begin_idempotency_record(
        organization=organization,
        actor_membership=actor,
        scope="cases.create",
        key="client-key-1",
        request_hash=first_hash,
    )

    with pytest.raises(ConflictError) as exc_info:
        begin_idempotency_record(
            organization=organization,
            actor_membership=actor,
            scope="cases.create",
            key="client-key-1",
            request_hash=second_hash,
        )

    assert exc_info.value.status_code == 409
    assert exc_info.value.get_codes() == "idempotency_key_conflict"
    assert IdempotencyRecord.objects.count() == 1


def test_same_key_is_separate_per_actor_scope_and_organization() -> None:
    organization = OrganizationFactory()
    other_organization = OrganizationFactory()
    actor = MembershipFactory(organization=organization)
    other_actor = MembershipFactory(organization=organization)
    cross_org_actor = MembershipFactory(organization=other_organization)
    request_hash = request_hash_for_payload(payload={"title": "Case A"})

    begin_idempotency_record(
        organization=organization,
        actor_membership=actor,
        scope="cases.create",
        key="client-key-1",
        request_hash=request_hash,
    )
    begin_idempotency_record(
        organization=organization,
        actor_membership=other_actor,
        scope="cases.create",
        key="client-key-1",
        request_hash=request_hash,
    )
    begin_idempotency_record(
        organization=other_organization,
        actor_membership=cross_org_actor,
        scope="cases.create",
        key="client-key-1",
        request_hash=request_hash,
    )

    assert IdempotencyRecord.objects.count() == 3


def test_replay_response_is_absent_before_completion() -> None:
    organization = OrganizationFactory()
    actor = MembershipFactory(organization=organization)
    request_hash = request_hash_for_payload(payload={"title": "Case A"})
    record = begin_idempotency_record(
        organization=organization,
        actor_membership=actor,
        scope="cases.create",
        key="client-key-1",
        request_hash=request_hash,
    )

    assert replay_response_for_record(record=record) is None


def test_complete_idempotency_record_rejects_unbounded_response_body() -> None:
    organization = OrganizationFactory()
    actor = MembershipFactory(organization=organization)
    request_hash = request_hash_for_payload(payload={"title": "Case A"})
    record = begin_idempotency_record(
        organization=organization,
        actor_membership=actor,
        scope="cases.create",
        key="client-key-1",
        request_hash=request_hash,
    )

    with pytest.raises(ValueError):
        complete_idempotency_record(
            record=record,
            response_status=201,
            response_body={"body": "x" * MAX_IDEMPOTENCY_RESPONSE_BYTES},
        )
