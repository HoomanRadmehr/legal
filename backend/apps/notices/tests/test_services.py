"""Tests for legal notice services."""

from __future__ import annotations

import datetime as dt

import pytest
from django.db import IntegrityError
from rest_framework.exceptions import NotFound, PermissionDenied

from apps.activity.models import ActivityLog, OutboxEvent
from apps.deadlines.models import STATUS_CANCELLED, Deadline
from apps.deadlines.selectors import deadline_list_upcoming
from apps.matters.models import ACCESS_LEVEL_VIEW, KIND_NOTICE, Matter, MatterRelation
from apps.matters.tests.factories import MatterAccessFactory, MatterFactory
from apps.notices.models import LegalNotice
from apps.notices.services import (
    NoticeResponseDateError,
    notice_archive,
    notice_create,
    notice_update,
)
from apps.notices.tests.factories import LegalNoticeFactory
from apps.organizations.models import ROLE_LEGAL_ADMIN, ROLE_LEGAL_COUNSEL, ROLE_VIEWER
from apps.organizations.tests.factories import MembershipFactory, OrganizationFactory
from common.api.errors import ConflictError

pytestmark = pytest.mark.django_db


def test_notice_create_writes_matter_notice_deadline_relations_activity_and_outbox() -> None:
    organization = OrganizationFactory()
    admin = MembershipFactory(organization=organization, role=ROLE_LEGAL_ADMIN)
    related = MatterFactory(organization=organization, owner=admin)

    notice = notice_create(
        actor=admin.user,
        data=notice_payload(related_matter_ids=[related.id]),
    )

    assert notice.matter.kind == KIND_NOTICE
    assert notice.linked_deadline.matter == notice.matter
    assert notice.linked_deadline.due_at == notice.response_deadline
    assert MatterRelation.objects.filter(source=notice.matter, target=related).exists()
    assert ActivityLog.objects.filter(matter=notice.matter, action="notice.created").exists()
    assert OutboxEvent.objects.filter(
        aggregate_id=notice.matter_id, event_type="notice.created"
    ).exists()


def test_notice_create_rejects_invalid_response_date_and_rolls_back_duplicate_relation() -> None:
    admin = MembershipFactory(role=ROLE_LEGAL_ADMIN)
    related = MatterFactory(organization=admin.organization, owner=admin)

    with pytest.raises(NoticeResponseDateError) as exc_info:
        notice_create(
            actor=admin.user, data=notice_payload(response_deadline=utc_datetime(2026, 7, 13))
        )
    with pytest.raises(IntegrityError):
        notice_create(
            actor=admin.user,
            data=notice_payload(related_matter_ids=[related.id, related.id]),
        )

    assert exc_info.value.status_code == 422
    assert exc_info.value.get_codes() == "notice_response_date_invalid"
    assert Matter.objects.filter(kind=KIND_NOTICE).count() == 0
    assert LegalNotice.objects.count() == 0
    assert Deadline.objects.count() == 0


def test_notice_create_rejects_invisible_related_matter_safely() -> None:
    organization = OrganizationFactory()
    other_organization = OrganizationFactory()
    admin = MembershipFactory(organization=organization, role=ROLE_LEGAL_ADMIN)
    other_admin = MembershipFactory(organization=other_organization, role=ROLE_LEGAL_ADMIN)
    hidden = MatterFactory(organization=other_organization, owner=other_admin)

    with pytest.raises(NotFound):
        notice_create(actor=admin.user, data=notice_payload(related_matter_ids=[hidden.id]))


def test_notice_update_synchronizes_linked_deadline_and_relations() -> None:
    owner = MembershipFactory(role=ROLE_LEGAL_COUNSEL)
    first = MatterFactory(organization=owner.organization, owner=owner)
    second = MatterFactory(organization=owner.organization, owner=owner)
    notice = LegalNoticeFactory(matter__organization=owner.organization, matter__owner=owner)
    MatterRelation.objects.create(
        organization=owner.organization,
        source=notice.matter,
        target=first,
        relation_type="related",
    )

    updated = notice_update(
        actor=owner.user,
        notice=notice,
        data={
            "response_deadline": utc_datetime(2026, 7, 22),
            "related_matter_ids": [second.id],
        },
        expected_version=1,
    )

    updated.linked_deadline.refresh_from_db()
    assert updated.response_deadline == utc_datetime(2026, 7, 22)
    assert updated.linked_deadline.due_at == utc_datetime(2026, 7, 22)
    assert updated.matter.version == 2
    assert list(updated.matter.outgoing_relations.values_list("target_id", flat=True)) == [
        second.id
    ]


def test_notice_update_stale_version_and_viewer_permission() -> None:
    owner = MembershipFactory(role=ROLE_LEGAL_COUNSEL)
    viewer = MembershipFactory(organization=owner.organization, role=ROLE_VIEWER)
    notice = LegalNoticeFactory(matter__organization=owner.organization, matter__owner=owner)
    MatterAccessFactory(matter=notice.matter, membership=viewer, level=ACCESS_LEVEL_VIEW)

    with pytest.raises(ConflictError):
        notice_update(actor=owner.user, notice=notice, data={"sender": "Late"}, expected_version=99)
    with pytest.raises(PermissionDenied):
        notice_update(actor=viewer.user, notice=notice, data={"sender": "Nope"}, expected_version=1)


def test_notice_archive_cancels_linked_deadline_and_notice_appears_in_deadline_views() -> None:
    owner = MembershipFactory(role=ROLE_LEGAL_COUNSEL)
    notice = notice_create(actor=owner.user, data=notice_payload())

    upcoming_ids = set(
        deadline_list_upcoming(
            actor=owner.user,
            organization=owner.organization,
            now=utc_datetime(2026, 7, 14),
        ).values_list("id", flat=True)
    )
    archived = notice_archive(actor=owner.user, notice=notice, expected_version=1)

    archived.linked_deadline.refresh_from_db()
    assert notice.linked_deadline_id in upcoming_ids
    assert archived.linked_deadline.status == STATUS_CANCELLED
    assert archived.matter.archived_at is not None
    assert archived.response_status == "cancelled"


def notice_payload(*, response_deadline=None, related_matter_ids=None) -> dict:
    return {
        "title": "Regulatory demand letter",
        "reference_code": "NOT-001",
        "priority": "normal",
        "description": "Initial notice",
        "sender": "City Authority",
        "received_date": dt.date(2026, 7, 14),
        "response_deadline": response_deadline or utc_datetime(2027, 7, 21),
        "related_matter_ids": related_matter_ids or [],
    }


def utc_datetime(year: int, month: int, day: int):
    return dt.datetime(year, month, day, 12, 0, tzinfo=dt.UTC)
