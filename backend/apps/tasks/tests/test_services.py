"""Tests for task services."""

from __future__ import annotations

import datetime as dt

import pytest
from rest_framework.exceptions import PermissionDenied

from apps.activity.models import ActivityLog, OutboxEvent
from apps.matters.models import ACCESS_LEVEL_VIEW
from apps.matters.tests.factories import MatterAccessFactory, MatterFactory
from apps.organizations.models import (
    ROLE_LEGAL_ADMIN,
    ROLE_LEGAL_COUNSEL,
    ROLE_VIEWER,
    STATUS_SUSPENDED,
)
from apps.organizations.tests.factories import MembershipFactory, OrganizationFactory
from apps.tasks.models import STATUS_CANCELLED, STATUS_DONE, STATUS_IN_PROGRESS, STATUS_TODO
from apps.tasks.services import task_cancel, task_complete, task_create, task_update
from apps.tasks.tests.factories import TaskFactory
from common.api.errors import ConflictError, DomainRuleError

pytestmark = pytest.mark.django_db


def test_task_create_writes_activity_and_outbox() -> None:
    organization = OrganizationFactory()
    admin = MembershipFactory(organization=organization, role=ROLE_LEGAL_ADMIN)
    assignee = MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL)
    matter = MatterFactory(organization=organization, owner=admin)

    task = task_create(
        actor=admin.user,
        data=task_payload(matter_id=matter.id, assignee_id=assignee.id),
    )

    assert task.organization == organization
    assert task.matter == matter
    assert task.assignee == assignee
    assert ActivityLog.objects.filter(target_id=task.id, action="task.created").exists()
    assert OutboxEvent.objects.filter(aggregate_id=task.id, event_type="task.created").exists()


def test_task_create_rejects_invalid_assignee_and_viewer() -> None:
    organization = OrganizationFactory()
    other_organization = OrganizationFactory()
    admin = MembershipFactory(organization=organization, role=ROLE_LEGAL_ADMIN)
    viewer = MembershipFactory(organization=organization, role=ROLE_VIEWER)
    inactive = MembershipFactory(organization=organization, status=STATUS_SUSPENDED)
    other_assignee = MembershipFactory(organization=other_organization)
    matter = MatterFactory(organization=organization, owner=admin)
    MatterAccessFactory(matter=matter, membership=viewer, level=ACCESS_LEVEL_VIEW)

    with pytest.raises(DomainRuleError):
        task_create(
            actor=admin.user, data=task_payload(matter_id=matter.id, assignee_id=inactive.id)
        )
    with pytest.raises(DomainRuleError):
        task_create(
            actor=admin.user,
            data=task_payload(matter_id=matter.id, assignee_id=other_assignee.id),
        )
    with pytest.raises(PermissionDenied):
        task_create(
            actor=viewer.user, data=task_payload(matter_id=matter.id, assignee_id=viewer.id)
        )


def test_counsel_cannot_assign_or_reassign_another_member() -> None:
    organization = OrganizationFactory()
    counsel = MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL)
    assignee = MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL)
    matter = MatterFactory(organization=organization, owner=counsel)
    task = TaskFactory(matter=matter, organization=organization, assignee=counsel)

    with pytest.raises(PermissionDenied):
        task_create(
            actor=counsel.user, data=task_payload(matter_id=matter.id, assignee_id=assignee.id)
        )
    with pytest.raises(PermissionDenied):
        task_update(
            actor=counsel.user,
            task=task,
            data={"assignee_id": assignee.id},
            expected_version=1,
        )


def test_admin_can_assign_another_member() -> None:
    organization = OrganizationFactory()
    admin = MembershipFactory(organization=organization, role=ROLE_LEGAL_ADMIN)
    assignee = MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL)
    matter = MatterFactory(organization=organization, owner=admin)

    task = task_create(
        actor=admin.user,
        data=task_payload(matter_id=matter.id, assignee_id=assignee.id),
    )

    assert task.assignee == assignee


def test_task_update_rejects_stale_version_and_updates_fields() -> None:
    owner = MembershipFactory(role=ROLE_LEGAL_COUNSEL)
    task = TaskFactory(matter__organization=owner.organization, matter__owner=owner, assignee=owner)

    with pytest.raises(ConflictError) as exc_info:
        task_update(actor=owner.user, task=task, data={"title": "Stale"}, expected_version=99)

    updated = task_update(
        actor=owner.user,
        task=task,
        data={"title": "Updated", "status": STATUS_IN_PROGRESS},
        expected_version=1,
    )

    assert exc_info.value.get_codes() == "task_version_conflict"
    assert updated.title == "Updated"
    assert updated.status == STATUS_IN_PROGRESS
    assert updated.version == 2


def test_task_complete_and_cancel_are_idempotent() -> None:
    owner = MembershipFactory(role=ROLE_LEGAL_COUNSEL)
    complete_target = TaskFactory(
        matter__organization=owner.organization,
        matter__owner=owner,
        assignee=owner,
    )
    cancel_target = TaskFactory(
        matter__organization=owner.organization,
        matter__owner=owner,
        assignee=owner,
    )

    completed = task_complete(actor=owner.user, task=complete_target, expected_version=1)
    completed_again = task_complete(actor=owner.user, task=completed, expected_version=1)
    cancelled = task_cancel(actor=owner.user, task=cancel_target, expected_version=1)
    cancelled_again = task_cancel(actor=owner.user, task=cancelled, expected_version=1)

    assert completed_again.status == STATUS_DONE
    assert cancelled_again.status == STATUS_CANCELLED
    assert (
        ActivityLog.objects.filter(target_id=complete_target.id, action="task.completed").count()
        == 1
    )
    assert (
        ActivityLog.objects.filter(target_id=cancel_target.id, action="task.cancelled").count() == 1
    )


def test_task_final_state_conflicts() -> None:
    owner = MembershipFactory(role=ROLE_LEGAL_COUNSEL)
    task = TaskFactory(matter__organization=owner.organization, matter__owner=owner, assignee=owner)
    completed = task_complete(actor=owner.user, task=task, expected_version=1)

    with pytest.raises(ConflictError) as exc_info:
        task_cancel(actor=owner.user, task=completed, expected_version=2)

    assert exc_info.value.get_codes() == "task_state_conflict"


def task_payload(*, matter_id, assignee_id) -> dict:
    return {
        "matter_id": matter_id,
        "title": "Review draft response",
        "description": "Check facts and proposed response.",
        "due_at": dt.datetime(2027, 7, 15, 12, 0, tzinfo=dt.UTC),
        "assignee_id": assignee_id,
        "status": STATUS_TODO,
    }
