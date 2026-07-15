"""Service tests for document completion, downloads, and cleanup."""

from __future__ import annotations

from datetime import timedelta
from types import SimpleNamespace

import pytest
from django.utils import timezone
from rest_framework.exceptions import NotFound, PermissionDenied

from apps.activity.models import ActivityLog, OutboxEvent
from apps.documents.models import (
    DOCUMENT_STATUS_AVAILABLE,
    DOCUMENT_STATUS_EXPIRED,
    DOCUMENT_STATUS_FAILED,
    DOCUMENT_STATUS_PENDING_UPLOAD,
)
from apps.documents.services import (
    complete_document_upload,
    expire_pending_document_uploads,
    issue_download_url,
    revoke_document,
)
from apps.documents.tests.factories import DocumentFactory
from apps.matters.models import ACCESS_LEVEL_VIEW
from apps.matters.tests.factories import MatterAccessFactory, MatterFactory
from apps.organizations.models import ROLE_LEGAL_ADMIN, ROLE_LEGAL_COUNSEL, ROLE_VIEWER
from apps.organizations.tests.factories import MembershipFactory, OrganizationFactory

pytestmark = pytest.mark.django_db


def test_complete_document_upload_verifies_object_and_marks_available(monkeypatch) -> None:
    stub_stat(monkeypatch)
    admin = MembershipFactory(role=ROLE_LEGAL_ADMIN)
    document = DocumentFactory(
        matter__organization=admin.organization,
        uploaded_by=admin,
        status=DOCUMENT_STATUS_PENDING_UPLOAD,
        actual_size=None,
        uploaded_at=None,
    )

    completed = complete_document_upload(actor=admin.user, document_id=document.id)

    completed.refresh_from_db()
    assert completed.status == DOCUMENT_STATUS_AVAILABLE
    assert completed.actual_size == completed.expected_size
    assert completed.uploaded_at is not None
    assert ActivityLog.objects.filter(action="document.upload_completed").exists()
    assert ActivityLog.objects.filter(action="document.available").exists()
    assert OutboxEvent.objects.filter(aggregate_id=document.id, payload__status="verifying")
    assert OutboxEvent.objects.filter(aggregate_id=document.id, payload__status="available")
    assert not activity_or_outbox_contains("presigned")


def test_complete_document_upload_replay_creates_no_duplicate_activity_or_outbox(
    monkeypatch,
) -> None:
    stub_stat(monkeypatch)
    admin = MembershipFactory(role=ROLE_LEGAL_ADMIN)
    document = DocumentFactory(
        matter__organization=admin.organization,
        uploaded_by=admin,
        status=DOCUMENT_STATUS_PENDING_UPLOAD,
        actual_size=None,
        uploaded_at=None,
    )

    complete_document_upload(actor=admin.user, document_id=document.id)
    activity_count = ActivityLog.objects.count()
    outbox_count = OutboxEvent.objects.count()
    replay = complete_document_upload(actor=admin.user, document_id=document.id)

    assert replay.status == DOCUMENT_STATUS_AVAILABLE
    assert ActivityLog.objects.count() == activity_count
    assert OutboxEvent.objects.count() == outbox_count


@pytest.mark.parametrize(
    ("stat_kwargs", "code"),
    [
        ({"size": 999}, "upload_size_mismatch"),
        ({"content_type": "text/plain"}, "upload_content_type_mismatch"),
        ({"checksum": "bad"}, "upload_checksum_mismatch"),
    ],
)
def test_complete_document_upload_marks_failed_for_mismatched_object(
    monkeypatch,
    stat_kwargs: dict,
    code: str,
) -> None:
    deleted = stub_delete(monkeypatch)
    monkeypatch.setattr(
        "apps.documents.services.upload_object_stat",
        lambda *, object_key: fake_stat(**stat_kwargs),
    )
    admin = MembershipFactory(role=ROLE_LEGAL_ADMIN)
    document = DocumentFactory(
        matter__organization=admin.organization,
        uploaded_by=admin,
        status=DOCUMENT_STATUS_PENDING_UPLOAD,
        expected_checksum="a" * 64,
        actual_size=None,
        uploaded_at=None,
    )

    with pytest.raises(Exception) as exc_info:
        complete_document_upload(actor=admin.user, document_id=document.id)

    document.refresh_from_db()
    assert exc_info.value.get_codes() == code
    assert document.status == DOCUMENT_STATUS_FAILED
    assert document.failure_code == code
    assert deleted == [document.object_key]


def test_complete_document_upload_rejects_expired_failed_and_lost_permission(monkeypatch) -> None:
    stub_stat(monkeypatch)
    counsel = MembershipFactory(role=ROLE_LEGAL_COUNSEL)
    expired = pending_document(
        member=counsel,
        upload_expires_at=timezone.now() - timedelta(minutes=1),
    )
    failed = pending_document(member=counsel, status=DOCUMENT_STATUS_FAILED)
    lost_permission = pending_document(member=counsel)
    lost_permission.matter.owner = MembershipFactory(
        organization=counsel.organization,
        role=ROLE_LEGAL_COUNSEL,
    )
    lost_permission.matter.save(update_fields=["owner"])

    with pytest.raises(Exception) as expired_error:
        complete_document_upload(actor=counsel.user, document_id=expired.id)
    with pytest.raises(Exception) as failed_error:
        complete_document_upload(actor=counsel.user, document_id=failed.id)
    with pytest.raises(NotFound):
        complete_document_upload(actor=counsel.user, document_id=lost_permission.id)

    expired.refresh_from_db()
    assert expired_error.value.get_codes() == "upload_expired"
    assert failed_error.value.get_codes() == "upload_already_failed"
    assert expired.status == DOCUMENT_STATUS_EXPIRED


def test_download_requires_available_document_and_never_stores_url(monkeypatch) -> None:
    stub_download(monkeypatch)
    organization = OrganizationFactory()
    owner = MembershipFactory(organization=organization)
    viewer = MembershipFactory(organization=organization, role=ROLE_VIEWER)
    matter = MatterFactory(organization=organization, owner=owner)
    available = DocumentFactory(matter=matter, uploaded_by=owner)
    pending = DocumentFactory(
        matter=matter,
        uploaded_by=owner,
        status=DOCUMENT_STATUS_PENDING_UPLOAD,
        actual_size=None,
        uploaded_at=None,
    )
    MatterAccessFactory(matter=matter, membership=viewer, level=ACCESS_LEVEL_VIEW)

    result = issue_download_url(actor=viewer.user, document=available)
    with pytest.raises(Exception) as unavailable_error:
        issue_download_url(actor=viewer.user, document=pending)

    assert result["url"] == "http://localhost:9000/presigned-download"
    assert unavailable_error.value.get_codes() == "document_not_available"
    assert not activity_or_outbox_contains("presigned-download")


def test_revoke_document_requires_edit_permission_and_blocks_download(monkeypatch) -> None:
    stub_download(monkeypatch)
    organization = OrganizationFactory()
    owner = MembershipFactory(organization=organization)
    viewer = MembershipFactory(organization=organization, role=ROLE_VIEWER)
    matter = MatterFactory(organization=organization, owner=owner)
    document = DocumentFactory(matter=matter, uploaded_by=owner)
    MatterAccessFactory(matter=matter, membership=viewer, level=ACCESS_LEVEL_VIEW)

    with pytest.raises(PermissionDenied):
        revoke_document(actor=viewer.user, document=document)
    revoked = revoke_document(actor=owner.user, document=document)
    with pytest.raises(Exception) as download_error:
        issue_download_url(actor=owner.user, document=revoked)

    assert revoked.status == "cancelled"
    assert download_error.value.get_codes() == "document_not_available"


def test_cleanup_expires_pending_documents_without_touching_available(monkeypatch) -> None:
    deleted = stub_delete(monkeypatch)
    old_time = timezone.now() - timedelta(minutes=1)
    abandoned = DocumentFactory(
        status=DOCUMENT_STATUS_PENDING_UPLOAD,
        upload_expires_at=old_time,
        actual_size=None,
        uploaded_at=None,
    )
    available = DocumentFactory(upload_expires_at=old_time)

    count = expire_pending_document_uploads()

    abandoned.refresh_from_db()
    available.refresh_from_db()
    assert count == 1
    assert abandoned.status == DOCUMENT_STATUS_EXPIRED
    assert available.status == DOCUMENT_STATUS_AVAILABLE
    assert deleted == [abandoned.object_key]


def pending_document(*, member, status=DOCUMENT_STATUS_PENDING_UPLOAD, upload_expires_at=None):
    matter = MatterFactory(organization=member.organization, owner=member)
    return DocumentFactory(
        matter=matter,
        uploaded_by=member,
        status=status,
        actual_size=None,
        uploaded_at=None,
        upload_expires_at=upload_expires_at or timezone.now() + timedelta(minutes=15),
    )


def fake_stat(*, size: int = 1024, content_type: str = "application/pdf", checksum: str = ""):
    metadata = {"x-amz-meta-checksum-sha256": checksum} if checksum else {}
    return SimpleNamespace(size=size, content_type=content_type, metadata=metadata, etag="etag")


def stub_stat(monkeypatch) -> None:
    monkeypatch.setattr(
        "apps.documents.services.upload_object_stat", lambda *, object_key: fake_stat()
    )


def stub_download(monkeypatch) -> None:
    monkeypatch.setattr(
        "apps.documents.services.presign_download_object",
        lambda *, object_key, expires_in_seconds: "http://localhost:9000/presigned-download",
    )


def stub_delete(monkeypatch) -> list[str]:
    deleted = []
    monkeypatch.setattr(
        "apps.documents.services.delete_abandoned_object",
        lambda *, object_key: deleted.append(object_key),
    )
    return deleted


def activity_or_outbox_contains(value: str) -> bool:
    activities = list(ActivityLog.objects.values("before_values", "after_values", "metadata"))
    outbox_events = list(OutboxEvent.objects.values("payload"))
    return value in f"{activities}{outbox_events}"
