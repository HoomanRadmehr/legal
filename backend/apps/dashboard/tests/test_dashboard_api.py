"""Tests for permission-aware dashboard summaries."""

from __future__ import annotations

import datetime as dt

import pytest
from django.db import connection
from django.test.utils import CaptureQueriesContext
from django.utils import timezone
from rest_framework.test import APIClient

from apps.activity.tests.factories import ActivityLogFactory
from apps.cases.tests.factories import LegalCaseFactory
from apps.contracts.tests.factories import ContractFactory
from apps.deadlines.tests.factories import DeadlineFactory
from apps.matters.models import (
    ACCESS_LEVEL_VIEW,
    PRIORITY_HIGH,
    STATUS_OPEN,
    STATUS_RESPONSE_DUE,
)
from apps.matters.tests.factories import MatterAccessFactory
from apps.notices.models import RESPONSE_STATUS_PENDING
from apps.notices.tests.factories import LegalNoticeFactory
from apps.organizations.models import ROLE_LEGAL_COUNSEL, ROLE_VIEWER
from apps.organizations.tests.factories import MembershipFactory, OrganizationFactory
from apps.tasks.tests.factories import TaskFactory

pytestmark = pytest.mark.django_db


def test_dashboard_counts_match_visible_domain_lists() -> None:
    admin = MembershipFactory()
    organization = admin.organization
    visible_case = LegalCaseFactory(
        matter__organization=organization,
        matter__owner=admin,
        matter__status=STATUS_OPEN,
        matter__priority=PRIORITY_HIGH,
    )
    ContractFactory(
        matter__organization=organization,
        matter__owner=admin,
        expiration_date=timezone.now().date() + dt.timedelta(days=10),
    )
    LegalNoticeFactory(
        matter__organization=organization,
        matter__owner=admin,
        matter__status=STATUS_RESPONSE_DUE,
        response_deadline=past_time(),
        response_status=RESPONSE_STATUS_PENDING,
    )
    DeadlineFactory(organization=organization, matter=visible_case.matter, assignee=admin)
    TaskFactory(organization=organization, matter=visible_case.matter, assignee=admin)
    ActivityLogFactory(organization=organization, matter=visible_case.matter)

    data = authenticated_client(member=admin).get("/api/v1/dashboard/").data

    assert data["cases"] == {"total": 1, "open": 1, "high_priority": 1}
    assert data["contracts"] == {"total": 1, "expiring_soon": 1}
    assert data["notices"] == {"open": 1, "response_overdue": 1}
    assert data["tasks"] == {"assigned_to_me": 1, "overdue": 0}
    assert data["recent_activity"][0]["matter_id"] == str(visible_case.matter_id)


def test_dashboard_does_not_leak_hidden_matter_counts_to_counsel_or_viewer() -> None:
    organization = OrganizationFactory()
    counsel = MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL)
    viewer = MembershipFactory(organization=organization, role=ROLE_VIEWER)
    hidden_owner = MembershipFactory(organization=organization)
    owned_case = LegalCaseFactory(matter__organization=organization, matter__owner=counsel)
    hidden_case = LegalCaseFactory(matter__organization=organization, matter__owner=hidden_owner)
    granted_case = LegalCaseFactory(matter__organization=organization, matter__owner=hidden_owner)
    MatterAccessFactory(
        matter=granted_case.matter,
        membership=viewer,
        level=ACCESS_LEVEL_VIEW,
    )

    counsel_data = authenticated_client(member=counsel).get("/api/v1/dashboard/").data
    viewer_data = authenticated_client(member=viewer).get("/api/v1/dashboard/").data

    assert counsel_data["cases"]["total"] == 1
    assert viewer_data["cases"]["total"] == 1
    assert str(hidden_case.matter_id) not in str(counsel_data)
    assert str(owned_case.matter_id) not in str(viewer_data)


def test_dashboard_isolates_other_organization_counts() -> None:
    admin = MembershipFactory()
    other_admin = MembershipFactory()
    LegalCaseFactory(matter__organization=admin.organization, matter__owner=admin)
    LegalCaseFactory(matter__organization=other_admin.organization, matter__owner=other_admin)

    data = authenticated_client(member=admin).get("/api/v1/dashboard/").data

    assert data["cases"]["total"] == 1


def test_dashboard_uses_organization_timezone_for_deadline_today(monkeypatch) -> None:
    organization = OrganizationFactory(timezone="Asia/Tehran")
    admin = MembershipFactory(organization=organization)
    matter = LegalCaseFactory(matter__organization=organization, matter__owner=admin).matter
    now = dt.datetime(2026, 7, 14, 21, 0, tzinfo=dt.UTC)
    local_today = dt.datetime(2026, 7, 15, 8, 0, tzinfo=dt.UTC)
    DeadlineFactory(organization=organization, matter=matter, assignee=admin, due_at=local_today)
    monkeypatch.setattr(timezone, "now", lambda: now)

    data = authenticated_client(member=admin).get("/api/v1/dashboard/").data

    assert data["deadlines"]["today"] == 1


def test_dashboard_query_count_is_bounded_for_seed_data() -> None:
    admin = MembershipFactory()
    organization = admin.organization
    for _ in range(3):
        case = LegalCaseFactory(matter__organization=organization, matter__owner=admin)
        DeadlineFactory(organization=organization, matter=case.matter, assignee=admin)
        TaskFactory(organization=organization, matter=case.matter, assignee=admin)

    client = authenticated_client(member=admin)
    with CaptureQueriesContext(connection) as queries:
        response = client.get("/api/v1/dashboard/")

    assert response.status_code == 200
    assert len(queries) <= 34


def authenticated_client(*, member) -> APIClient:
    client = APIClient()
    client.force_authenticate(user=member.user)
    return client


def past_time():
    return timezone.now() - dt.timedelta(days=1)
