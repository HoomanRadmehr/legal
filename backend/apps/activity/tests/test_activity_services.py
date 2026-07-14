"""Tests for activity recording services."""

from __future__ import annotations

import pytest
from django.core.exceptions import ValidationError
from django.db import transaction

from apps.activity.models import ACTION_CASE_CREATED, ActivityLog
from apps.activity.tests.factories import ActivityLogFactory
from apps.matters.tests.factories import MatterFactory
from apps.organizations.tests.factories import MembershipFactory, OrganizationFactory
from common.services.activity import record_activity

pytestmark = pytest.mark.django_db


def test_record_activity_redacts_non_allowlisted_values() -> None:
    organization = OrganizationFactory()
    actor = MembershipFactory(organization=organization)
    matter = MatterFactory(organization=organization, owner=actor, created_by=actor)

    activity = record_activity(
        organization=organization,
        matter=matter,
        actor_membership=actor,
        actor_user=actor.user,
        action=ACTION_CASE_CREATED,
        target_type="matter",
        target_id=matter.id,
        before_values={"password": "secret", "status": "draft"},
        after_values={"status": "open", "document_body": "private"},
        metadata={"request_id": "req-1", "cookie": "secret"},
        request_id="req-1",
    )

    assert activity.before_values == {"status": "draft"}
    assert activity.after_values == {"status": "open"}
    assert activity.metadata == {"request_id": "req-1"}
    assert activity.request_id == "req-1"


def test_activity_rolls_back_with_business_transaction() -> None:
    organization = OrganizationFactory()

    with pytest.raises(RuntimeError), transaction.atomic():
        record_activity(
            organization=organization,
            action=ACTION_CASE_CREATED,
            target_type="matter",
            metadata={"request_id": "req-rollback"},
        )
        raise RuntimeError("rollback")

    assert ActivityLog.objects.count() == 0


def test_activity_log_is_append_only() -> None:
    activity = ActivityLogFactory()
    activity.after_values = {"status": "closed"}

    with pytest.raises(ValidationError):
        activity.save()

    activity.refresh_from_db()
    assert activity.after_values == {"status": "open"}
