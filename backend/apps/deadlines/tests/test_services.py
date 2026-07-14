"""Tests for deadline services."""

from __future__ import annotations

import datetime as dt

import pytest
from rest_framework.exceptions import PermissionDenied

from apps.activity.models import ActivityLog, OutboxEvent
from apps.deadlines.models import STATUS_CANCELLED, STATUS_COMPLETED, STATUS_OPEN
from apps.deadlines.services import (
    deadline_cancel,
    deadline_complete,
    deadline_create,
    deadline_update,
)
from apps.deadlines.tests.factories import DeadlineFactory
from apps.matters.models import ACCESS_LEVEL_VIEW
from apps.matters.tests.factories import MatterAccessFactory, MatterFactory
from apps.organizations.models import (
    ROLE_LEGAL_ADMIN,
    ROLE_LEGAL_COUNSEL,
    ROLE_VIEWER,
    STATUS_SUSPENDED,
)
from apps.organizations.tests.factories import MembershipFactory, OrganizationFactory
from common.api.errors import ConflictError, DomainRuleError

pytestmark = pytest.mark.django_db


def test_deadline_create_writes_activity_and_outbox() -> None:
    organization = OrganizationFactory()
    admin = MembershipFactory(organization=organization, role=ROLE_LEGAL_ADMIN)
    assignee = MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL)
    matter = MatterFactory(organization=organization, owner=admin)

    deadline = deadline_create(
        actor=admin.user,
        data=deadline_payload(matter_id=matter.id, assignee_id=assignee.id),
    )

    assert deadline.organization == organization
    assert deadline.matter == matter
    assert deadline.assignee == assignee
    assert ActivityLog.objects.filter(target_id=deadline.id, action="deadline.created").exists()
    assert OutboxEvent.objects.filter(
        aggregate_id=deadline.id,
        event_type="deadline.created",
    ).exists()


def test_deadline_create_rejects_invalid_assignee_and_viewer() -> None:
    organization = OrganizationFactory()
    other_organization = OrganizationFactory()
    admin = MembershipFactory(organization=organization, role=ROLE_LEGAL_ADMIN)
    viewer = MembershipFactory(organization=organization, role=ROLE_VIEWER)
    inactive = MembershipFactory(organization=organization, status=STATUS_SUSPENDED)
    other_assignee = MembershipFactory(organization=other_organization)
    matter = MatterFactory(organization=organization, owner=admin)
    MatterAccessFactory(matter=matter, membership=viewer, level=ACCESS_LEVEL_VIEW)

    with pytest.raises(DomainRuleError):
        deadline_create(
            actor=admin.user,
            data=deadline_payload(matter_id=matter.id, assignee_id=inactive.id),
        )
    with pytest.raises(DomainRuleError):
        deadline_create(
            actor=admin.user,
            data=deadline_payload(matter_id=matter.id, assignee_id=other_assignee.id),
        )
    with pytest.raises(PermissionDenied):
        deadline_create(
            actor=viewer.user,
            data=deadline_payload(matter_id=matter.id, assignee_id=viewer.id),
        )


def test_counsel_cannot_assign_another_member() -> None:
    organization = OrganizationFactory()
    counsel = MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL)
    assignee = MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL)
    matter = MatterFactory(organization=organization, owner=counsel)

    with pytest.raises(PermissionDenied):
        deadline_create(
            actor=counsel.user,
            data=deadline_payload(matter_id=matter.id, assignee_id=assignee.id),
        )


def test_deadline_update_rejects_stale_version_and_updates_fields() -> None:
    owner = MembershipFactory(role=ROLE_LEGAL_COUNSEL)
    deadline = DeadlineFactory(matter__organization=owner.organization, matter__owner=owner)

    with pytest.raises(ConflictError) as exc_info:
        deadline_update(
            actor=owner.user,
            deadline=deadline,
            data={"title": "Stale"},
            expected_version=99,
        )

    updated = deadline_update(
        actor=owner.user,
        deadline=deadline,
        data={"title": "Updated", "reminder_enabled": False},
        expected_version=1,
    )

    assert exc_info.value.get_codes() == "deadline_version_conflict"
    assert updated.title == "Updated"
    assert updated.reminder_enabled is False
    assert updated.version == 2


def test_deadline_complete_and_cancel_are_idempotent() -> None:
    owner = MembershipFactory(role=ROLE_LEGAL_COUNSEL)
    complete_target = DeadlineFactory(
        matter__organization=owner.organization,
        matter__owner=owner,
    )
    cancel_target = DeadlineFactory(
        matter__organization=owner.organization,
        matter__owner=owner,
    )

    completed = deadline_complete(actor=owner.user, deadline=complete_target, expected_version=1)
    completed_again = deadline_complete(actor=owner.user, deadline=completed, expected_version=1)
    cancelled = deadline_cancel(actor=owner.user, deadline=cancel_target, expected_version=1)
    cancelled_again = deadline_cancel(actor=owner.user, deadline=cancelled, expected_version=1)

    assert completed_again.status == STATUS_COMPLETED
    assert cancelled_again.status == STATUS_CANCELLED
    assert (
        ActivityLog.objects.filter(
            target_id=complete_target.id, action="deadline.completed"
        ).count()
        == 1
    )
    assert (
        ActivityLog.objects.filter(target_id=cancel_target.id, action="deadline.cancelled").count()
        == 1
    )


def test_deadline_final_state_conflicts() -> None:
    owner = MembershipFactory(role=ROLE_LEGAL_COUNSEL)
    deadline = DeadlineFactory(matter__organization=owner.organization, matter__owner=owner)
    completed = deadline_complete(actor=owner.user, deadline=deadline, expected_version=1)

    with pytest.raises(ConflictError) as exc_info:
        deadline_cancel(actor=owner.user, deadline=completed, expected_version=2)

    assert exc_info.value.get_codes() == "deadline_state_conflict"


def deadline_payload(*, matter_id, assignee_id) -> dict:
    return {
        "matter_id": matter_id,
        "title": "File response",
        "description": "Prepare and file response",
        "due_at": dt.datetime(2026, 7, 15, 12, 0, tzinfo=dt.UTC),
        "assignee_id": assignee_id,
        "priority": "normal",
        "reminder_enabled": True,
        "status": STATUS_OPEN,
    }
