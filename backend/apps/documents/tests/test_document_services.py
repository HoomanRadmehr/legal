"""Service tests for upload completion, processing, documents, and cleanup."""

from __future__ import annotations

from datetime import timedelta
from types import SimpleNamespace

import pytest
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied

from apps.activity.models import ActivityLog, OutboxEvent
from apps.documents.models import (
    DOCUMENT_STATUS_AVAILABLE,
    DOCUMENT_STATUS_PROCESSING,
    DOCUMENT_STATUS_REVOKED,
    UPLOAD_STATUS_AVAILABLE,
    UPLOAD_STATUS_EXPIRED,
    Document,
)
from apps.documents.services import (
    complete_upload,
    expire_abandoned_upload_sessions,
    issue_download_url,
    process_upload_session,
    revoke_document,
)
from apps.documents.tests.factories import DocumentFactory, UploadSessionFactory
from apps.matters.models import ACCESS_LEVEL_VIEW
from apps.matters.tests.factories import MatterAccessFactory, MatterFactory
from apps.organizations.models import ROLE_LEGAL_ADMIN, ROLE_VIEWER
from apps.organizations.tests.factories import MembershipFactory, OrganizationFactory

pytestmark = pytest.mark.django_db


def test_complete_upload_is_idempotent_and_processing_creates_available_document(
    monkeypatch,
    django_capture_on_commit_callbacks,
) -> None:
    schedule_calls = stub_schedule(monkeypatch)
    stub_stat(monkeypatch)
    admin = MembershipFactory(role=ROLE_LEGAL_ADMIN)
    session = UploadSessionFactory(matter__organization=admin.organization, requested_by=admin)

    with django_capture_on_commit_callbacks(execute=True):
        status_code, body = complete_upload(
            actor=admin.user,
            upload_id=session.id,
            idempotency_key="11111111-1111-1111-1111-111111111111",
        )
    replay_status, replay_body = complete_upload(
        actor=admin.user,
        upload_id=session.id,
        idempotency_key="11111111-1111-1111-1111-111111111111",
    )
    process_result = process_upload_session(upload_id=session.id)

    session.refresh_from_db()
    document = Document.objects.get(upload_session=session)
    assert status_code == 202
    assert replay_status == 202
    assert replay_body == body
    assert schedule_calls == [str(session.id)]
    assert process_result == "available"
    assert session.status == UPLOAD_STATUS_AVAILABLE
    assert document.status == DOCUMENT_STATUS_AVAILABLE
    assert ActivityLog.objects.filter(action="document.upload_completed").exists()
    assert ActivityLog.objects.filter(action="document.available").exists()
    assert not activity_or_outbox_contains("presigned")


def test_complete_upload_conflicting_replay_after_processing_fails(monkeypatch) -> None:
    stub_schedule(monkeypatch)
    stub_stat(monkeypatch)
    admin = MembershipFactory(role=ROLE_LEGAL_ADMIN)
    session = UploadSessionFactory(matter__organization=admin.organization, requested_by=admin)

    complete_upload(
        actor=admin.user,
        upload_id=session.id,
        idempotency_key="11111111-1111-1111-1111-111111111111",
    )
    with pytest.raises(Exception) as exc_info:
        complete_upload(
            actor=admin.user,
            upload_id=session.id,
            idempotency_key="22222222-2222-2222-2222-222222222222",
        )

    assert exc_info.value.status_code == 409
    assert exc_info.value.get_codes() == "upload_state_conflict"


def test_processing_worker_marks_failed_when_object_mismatch(monkeypatch) -> None:
    admin = MembershipFactory(role=ROLE_LEGAL_ADMIN)
    session = UploadSessionFactory(
        matter__organization=admin.organization,
        requested_by=admin,
        status="processing",
    )
    monkeypatch.setattr(
        "apps.documents.services.upload_object_stat",
        lambda *, object_key: fake_stat(size=999),
    )

    result = process_upload_session(upload_id=session.id)

    session.refresh_from_db()
    assert result == "failed"
    assert session.status == "failed"
    assert session.failure_code == "upload_object_mismatch"


def test_complete_upload_rejects_expired_missing_and_mismatched_objects(monkeypatch) -> None:
    stub_schedule(monkeypatch)
    admin = MembershipFactory(role=ROLE_LEGAL_ADMIN)
    expired = UploadSessionFactory(
        matter__organization=admin.organization,
        requested_by=admin,
        expires_at=timezone.now() - timedelta(minutes=1),
    )
    missing = UploadSessionFactory(matter__organization=admin.organization, requested_by=admin)
    mismatch = UploadSessionFactory(matter__organization=admin.organization, requested_by=admin)

    with pytest.raises(Exception) as expired_error:
        complete_upload(actor=admin.user, upload_id=expired.id, idempotency_key="expired")
    monkeypatch.setattr(
        "apps.documents.services.upload_object_stat",
        lambda *, object_key: raise_conflict("upload_object_missing"),
    )
    with pytest.raises(Exception) as missing_error:
        complete_upload(actor=admin.user, upload_id=missing.id, idempotency_key="missing")
    monkeypatch.setattr(
        "apps.documents.services.upload_object_stat",
        lambda *, object_key: fake_stat(size=999),
    )
    with pytest.raises(Exception) as mismatch_error:
        complete_upload(actor=admin.user, upload_id=mismatch.id, idempotency_key="mismatch")

    assert expired_error.value.get_codes() == "upload_expired"
    assert missing_error.value.get_codes() == "upload_object_missing"
    assert mismatch_error.value.get_codes() == "upload_object_mismatch"


def test_download_requires_available_document_and_never_stores_url(monkeypatch) -> None:
    stub_download(monkeypatch)
    organization = OrganizationFactory()
    owner = MembershipFactory(organization=organization)
    viewer = MembershipFactory(organization=organization, role=ROLE_VIEWER)
    matter = MatterFactory(organization=organization, owner=owner)
    available = DocumentFactory(upload_session__matter=matter, upload_session__requested_by=owner)
    processing = DocumentFactory(
        upload_session__matter=matter,
        upload_session__requested_by=owner,
        status=DOCUMENT_STATUS_PROCESSING,
    )
    MatterAccessFactory(matter=matter, membership=viewer, level=ACCESS_LEVEL_VIEW)

    result = issue_download_url(actor=viewer.user, document=available)
    with pytest.raises(Exception) as unavailable_error:
        issue_download_url(actor=viewer.user, document=processing)

    assert result["url"] == "http://localhost:9000/presigned-download"
    assert unavailable_error.value.get_codes() == "document_not_available"
    assert not activity_or_outbox_contains("presigned-download")


def test_revoke_document_requires_edit_permission_and_blocks_download(monkeypatch) -> None:
    stub_download(monkeypatch)
    organization = OrganizationFactory()
    owner = MembershipFactory(organization=organization)
    viewer = MembershipFactory(organization=organization, role=ROLE_VIEWER)
    matter = MatterFactory(organization=organization, owner=owner)
    document = DocumentFactory(upload_session__matter=matter, upload_session__requested_by=owner)
    MatterAccessFactory(matter=matter, membership=viewer, level=ACCESS_LEVEL_VIEW)

    with pytest.raises(PermissionDenied):
        revoke_document(actor=viewer.user, document=document)
    revoked = revoke_document(actor=owner.user, document=document)
    with pytest.raises(Exception) as download_error:
        issue_download_url(actor=owner.user, document=revoked)

    assert revoked.status == DOCUMENT_STATUS_REVOKED
    assert download_error.value.get_codes() == "document_not_available"


def test_cleanup_expires_abandoned_sessions_without_removing_available_documents(
    monkeypatch,
) -> None:
    deleted = []
    monkeypatch.setattr(
        "apps.documents.services.delete_abandoned_object",
        lambda *, object_key: deleted.append(object_key),
    )
    old_time = timezone.now() - timedelta(minutes=1)
    abandoned = UploadSessionFactory(expires_at=old_time)
    available_upload = UploadSessionFactory(expires_at=old_time, status=UPLOAD_STATUS_AVAILABLE)
    DocumentFactory(upload_session=available_upload)

    count = expire_abandoned_upload_sessions()

    abandoned.refresh_from_db()
    available_upload.refresh_from_db()
    assert count == 1
    assert abandoned.status == UPLOAD_STATUS_EXPIRED
    assert available_upload.status == UPLOAD_STATUS_AVAILABLE
    assert deleted == [abandoned.object_key]


def fake_stat(*, size: int = 1024, content_type: str = "application/pdf"):
    return SimpleNamespace(size=size, content_type=content_type, metadata={})


def stub_stat(monkeypatch) -> None:
    monkeypatch.setattr(
        "apps.documents.services.upload_object_stat",
        lambda *, object_key: fake_stat(),
    )


def stub_download(monkeypatch) -> None:
    monkeypatch.setattr(
        "apps.documents.services.presign_download_object",
        lambda *, object_key, expires_in_seconds: "http://localhost:9000/presigned-download",
    )


def stub_schedule(monkeypatch) -> list[str]:
    calls = []
    monkeypatch.setattr(
        "apps.documents.services.schedule_upload_processing",
        lambda *, upload_id: calls.append(str(upload_id)),
    )
    return calls


def raise_conflict(code: str):
    from common.api.errors import ConflictError

    raise ConflictError("Conflict.", code=code)


def activity_or_outbox_contains(value: str) -> bool:
    activities = list(ActivityLog.objects.values("before_values", "after_values", "metadata"))
    outbox_events = list(OutboxEvent.objects.values("payload"))
    return value in f"{activities}{outbox_events}"
