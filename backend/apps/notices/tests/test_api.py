"""API tests for legal notice endpoints."""

from __future__ import annotations

from datetime import timedelta

import pytest
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from apps.activity.models import ActivityLog
from apps.deadlines.models import STATUS_CANCELLED
from apps.deadlines.selectors import deadline_list_upcoming
from apps.matters.models import ACCESS_LEVEL_VIEW
from apps.matters.tests.factories import MatterAccessFactory, MatterFactory
from apps.notices.tests.factories import LegalNoticeFactory
from apps.organizations.models import ROLE_LEGAL_ADMIN, ROLE_LEGAL_COUNSEL, ROLE_VIEWER
from apps.organizations.tests.factories import MembershipFactory, OrganizationFactory

pytestmark = pytest.mark.django_db


def test_notice_api_create_returns_notice_and_linked_deadline() -> None:
    admin = MembershipFactory(role=ROLE_LEGAL_ADMIN)
    related = MatterFactory(organization=admin.organization, owner=admin)

    response = authenticated_client(member=admin).post(
        reverse("notices-list"),
        notice_payload(related_matter_ids=[str(related.id)]),
        format="json",
    )
    data = response.json()

    assert response.status_code == 201
    assert data["id"]
    assert data["linked_deadline_id"]
    assert data["related_matter_ids"] == [str(related.id)]
    assert ActivityLog.objects.filter(target_id=data["id"], action="notice.created").exists()


def test_notice_api_invalid_response_date_returns_422_stable_code() -> None:
    admin = MembershipFactory(role=ROLE_LEGAL_ADMIN)

    response = authenticated_client(member=admin).post(
        reverse("notices-list"),
        notice_payload(response_deadline="2026-07-13T12:00:00Z"),
        format="json",
    )

    assert response.status_code == 422
    assert response.json()["code"] == "notice_response_date_invalid"


def test_notice_api_invisible_related_matter_is_rejected_safely() -> None:
    organization = OrganizationFactory()
    other_organization = OrganizationFactory()
    admin = MembershipFactory(organization=organization, role=ROLE_LEGAL_ADMIN)
    other_admin = MembershipFactory(organization=other_organization, role=ROLE_LEGAL_ADMIN)
    hidden = MatterFactory(organization=other_organization, owner=other_admin)

    response = authenticated_client(member=admin).post(
        reverse("notices-list"),
        notice_payload(related_matter_ids=[str(hidden.id)]),
        format="json",
    )

    assert response.status_code == 404


def test_notice_api_patch_syncs_deadline_and_returns_409_for_stale_version() -> None:
    owner = MembershipFactory(role=ROLE_LEGAL_COUNSEL)
    notice = LegalNoticeFactory(matter__organization=owner.organization, matter__owner=owner)
    client = authenticated_client(member=owner)

    stale = client.patch(
        reverse("notices-detail", args=[notice.matter_id]),
        {"version": 99, "sender": "Late"},
        format="json",
    )
    updated = client.patch(
        reverse("notices-detail", args=[notice.matter_id]),
        {"version": 1, "response_deadline": "2026-07-22T12:00:00Z"},
        format="json",
    )

    notice.refresh_from_db()
    notice.linked_deadline.refresh_from_db()
    assert stale.status_code == 409
    assert stale.json()["code"] == "notice_version_conflict"
    assert updated.status_code == 200
    assert notice.linked_deadline.due_at.isoformat().startswith("2026-07-22T12:00:00")


def test_notice_api_archive_cancels_deadline_and_timeline() -> None:
    owner = MembershipFactory(role=ROLE_LEGAL_COUNSEL)
    notice = LegalNoticeFactory(matter__organization=owner.organization, matter__owner=owner)
    client = authenticated_client(member=owner)

    archive_response = client.post(
        reverse("notices-archive", args=[notice.matter_id]),
        {"version": 1},
        format="json",
    )
    timeline_response = client.get(reverse("notices-timeline", args=[notice.matter_id]))

    notice.refresh_from_db()
    notice.linked_deadline.refresh_from_db()
    assert archive_response.status_code == 200
    assert notice.linked_deadline.status == STATUS_CANCELLED
    assert timeline_response.status_code == 200
    assert timeline_response.json()[0]["action"] == "matter.archived"


def test_notice_api_permission_scoping_and_deadline_view_inclusion() -> None:
    organization = OrganizationFactory()
    owner = MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL)
    viewer = MembershipFactory(organization=organization, role=ROLE_VIEWER)
    other_admin = MembershipFactory(role=ROLE_LEGAL_ADMIN)
    notice = LegalNoticeFactory(matter__organization=organization, matter__owner=owner)
    notice.linked_deadline.due_at = timezone.now() + timedelta(days=1)
    notice.linked_deadline.save(update_fields=["due_at", "updated_at"])
    MatterAccessFactory(matter=notice.matter, membership=viewer, level=ACCESS_LEVEL_VIEW)

    viewer_patch = authenticated_client(member=viewer).patch(
        reverse("notices-detail", args=[notice.matter_id]),
        {"version": 1, "sender": "Nope"},
        format="json",
    )
    hidden = authenticated_client(member=other_admin).get(
        reverse("notices-detail", args=[notice.matter_id]),
    )
    upcoming = deadline_list_upcoming(actor=viewer.user, organization=organization)

    assert viewer_patch.status_code == 403
    assert hidden.status_code == 404
    assert notice.linked_deadline_id in set(upcoming.values_list("id", flat=True))


def authenticated_client(*, member) -> APIClient:
    client = APIClient()
    client.force_authenticate(user=member.user)
    return client


def notice_payload(*, response_deadline: str = "2027-07-21T12:00:00Z", related_matter_ids=None):
    return {
        "title": "Regulatory demand letter",
        "reference_code": "NOT-API-001",
        "priority": "normal",
        "description": "Initial notice",
        "sender": "City Authority",
        "received_date": "2026-07-14",
        "response_deadline": response_deadline,
        "related_matter_ids": related_matter_ids or [],
    }
