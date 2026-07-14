"""Selector tests for deadline views."""

from __future__ import annotations

import datetime as dt

import pytest

from apps.deadlines.models import STATUS_CANCELLED, STATUS_COMPLETED
from apps.deadlines.selectors import (
    deadline_list_assigned_to_me,
    deadline_list_overdue,
    deadline_list_today,
    deadline_list_upcoming,
)
from apps.deadlines.tests.factories import DeadlineFactory
from apps.matters.models import ACCESS_LEVEL_VIEW
from apps.matters.tests.factories import MatterAccessFactory
from apps.organizations.models import ROLE_LEGAL_ADMIN, ROLE_LEGAL_COUNSEL, ROLE_VIEWER
from apps.organizations.tests.factories import MembershipFactory, OrganizationFactory

pytestmark = pytest.mark.django_db


def test_deadline_today_uses_organization_timezone_boundaries() -> None:
    organization = OrganizationFactory(timezone="America/New_York")
    admin = MembershipFactory(organization=organization, role=ROLE_LEGAL_ADMIN)
    now = utc_datetime(2026, 7, 14, 3, 30)
    previous_local_day = DeadlineFactory(
        matter__organization=organization,
        matter__owner=admin,
        assignee=admin,
        due_at=utc_datetime(2026, 7, 14, 3, 59),
    )
    next_local_day = DeadlineFactory(
        matter__organization=organization,
        matter__owner=admin,
        assignee=admin,
        due_at=utc_datetime(2026, 7, 14, 4, 0),
    )

    queryset = deadline_list_today(actor=admin.user, organization=organization, now=now)

    assert ids(queryset) == {previous_local_day.id}
    assert next_local_day.id not in ids(queryset)


def test_deadline_open_views_exclude_completed_and_cancelled() -> None:
    organization = OrganizationFactory(timezone="UTC")
    admin = MembershipFactory(organization=organization, role=ROLE_LEGAL_ADMIN)
    now = utc_datetime(2026, 7, 14, 12, 0)
    open_deadline = DeadlineFactory(
        matter__organization=organization,
        matter__owner=admin,
        assignee=admin,
        due_at=utc_datetime(2026, 7, 14, 13, 0),
    )
    DeadlineFactory(
        matter__organization=organization,
        matter__owner=admin,
        assignee=admin,
        due_at=utc_datetime(2026, 7, 14, 14, 0),
        status=STATUS_COMPLETED,
    )
    DeadlineFactory(
        matter__organization=organization,
        matter__owner=admin,
        assignee=admin,
        due_at=utc_datetime(2026, 7, 14, 15, 0),
        status=STATUS_CANCELLED,
    )

    today = deadline_list_today(actor=admin.user, organization=organization, now=now)
    upcoming = deadline_list_upcoming(actor=admin.user, organization=organization, now=now)

    assert ids(today) == {open_deadline.id}
    assert ids(upcoming) == {open_deadline.id}


def test_deadline_overdue_and_assigned_to_me_are_permission_scoped() -> None:
    organization = OrganizationFactory()
    other_organization = OrganizationFactory()
    counsel = MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL)
    viewer = MembershipFactory(organization=organization, role=ROLE_VIEWER)
    other_admin = MembershipFactory(organization=other_organization, role=ROLE_LEGAL_ADMIN)
    owned = DeadlineFactory(
        matter__organization=organization,
        matter__owner=counsel,
        assignee=counsel,
        due_at=utc_datetime(2026, 7, 14, 10, 0),
    )
    granted = DeadlineFactory(
        matter__organization=organization,
        assignee=viewer,
        due_at=utc_datetime(2026, 7, 14, 9, 0),
    )
    hidden = DeadlineFactory(
        matter__organization=other_organization,
        matter__owner=other_admin,
        assignee=other_admin,
        due_at=utc_datetime(2026, 7, 14, 8, 0),
    )
    MatterAccessFactory(matter=granted.matter, membership=viewer, level=ACCESS_LEVEL_VIEW)

    overdue = deadline_list_overdue(
        actor=counsel.user,
        organization=organization,
        now=utc_datetime(2026, 7, 14, 12, 0),
    )
    assigned = deadline_list_assigned_to_me(actor=viewer.user, organization=organization)

    assert ids(overdue) == {owned.id}
    assert ids(assigned) == {granted.id}
    assert hidden.id not in ids(overdue)


def ids(queryset) -> set:
    return set(queryset.values_list("id", flat=True))


def utc_datetime(year: int, month: int, day: int, hour: int, minute: int):
    return dt.datetime(year, month, day, hour, minute, tzinfo=dt.UTC)
