"""Service tests for direct document presign creation."""

from __future__ import annotations

import pytest
from django.test import override_settings
from rest_framework.exceptions import NotFound, PermissionDenied

from apps.activity.models import ActivityLog, OutboxEvent
from apps.documents.models import DOCUMENT_STATUS_PENDING_UPLOAD, Document
from apps.documents.services import MAX_ACTIVE_DOCUMENT_UPLOADS, create_document_presign
from apps.documents.tests.factories import DocumentFactory
from apps.matters.models import ACCESS_LEVEL_VIEW
from apps.matters.tests.factories import MatterAccessFactory, MatterFactory
from apps.organizations.models import ROLE_LEGAL_ADMIN, ROLE_VIEWER
from apps.organizations.tests.factories import MembershipFactory, OrganizationFactory

pytestmark = pytest.mark.django_db


def test_presign_creates_pending_document_without_storing_presigned_url(monkeypatch) -> None:
    presign_calls = stub_presign(monkeypatch)
    admin = MembershipFactory(role=ROLE_LEGAL_ADMIN)
    matter = MatterFactory(organization=admin.organization, owner=admin)

    result = create_document_presign(
        actor=admin.user,
        idempotency_key="11111111-1111-1111-1111-111111111111",
        **upload_payload(matter_id=matter.id),
    )
    document = Document.objects.get(id=result["document"]["id"])

    assert document.status == DOCUMENT_STATUS_PENDING_UPLOAD
    assert result["upload"]["url"] == "http://localhost:9000/presigned-upload"
    assert presign_calls[0]["object_key"] == document.object_key
    assert 1 <= presign_calls[0]["expires_in_seconds"] <= 900
    assert document.object_key.endswith(str(document.id))
    assert "notice" not in document.object_key
    assert not any("url" in field.name for field in Document._meta.fields)
    assert ActivityLog.objects.filter(target_id=document.id).exists()
    assert OutboxEvent.objects.filter(aggregate_id=document.id, payload__status="pending_upload")


def test_presign_idempotent_replay_returns_same_document_with_fresh_url(monkeypatch) -> None:
    presign_calls = stub_presign(monkeypatch)
    admin = MembershipFactory(role=ROLE_LEGAL_ADMIN)
    matter = MatterFactory(organization=admin.organization, owner=admin)
    payload = upload_payload(matter_id=matter.id)

    first = create_document_presign(
        actor=admin.user,
        idempotency_key="11111111-1111-1111-1111-111111111111",
        **payload,
    )
    replay = create_document_presign(
        actor=admin.user,
        idempotency_key="11111111-1111-1111-1111-111111111111",
        **payload,
    )

    assert replay["document"]["id"] == first["document"]["id"]
    assert Document.objects.count() == 1
    assert len(presign_calls) == 2


def test_presign_idempotency_conflict_rejects_different_request(monkeypatch) -> None:
    stub_presign(monkeypatch)
    admin = MembershipFactory(role=ROLE_LEGAL_ADMIN)
    matter = MatterFactory(organization=admin.organization, owner=admin)

    create_document_presign(
        actor=admin.user,
        idempotency_key="11111111-1111-1111-1111-111111111111",
        **upload_payload(matter_id=matter.id),
    )
    with pytest.raises(Exception) as exc_info:
        create_document_presign(
            actor=admin.user,
            idempotency_key="11111111-1111-1111-1111-111111111111",
            **upload_payload(matter_id=matter.id, size=2048),
        )

    assert exc_info.value.status_code == 409


@override_settings(MAX_UPLOAD_SIZE_BYTES=5)
def test_presign_rejects_oversize_file_with_stable_error(monkeypatch) -> None:
    stub_presign(monkeypatch)
    admin = MembershipFactory(role=ROLE_LEGAL_ADMIN)
    matter = MatterFactory(organization=admin.organization, owner=admin)

    with pytest.raises(Exception) as exc_info:
        create_document_presign(
            actor=admin.user,
            idempotency_key="oversize",
            **upload_payload(matter_id=matter.id, size=10),
        )

    assert exc_info.value.status_code == 413
    assert exc_info.value.default_code == "upload_size_exceeded"


@pytest.mark.parametrize(
    ("filename", "content_type", "checksum"),
    [
        ("notice.exe", "application/octet-stream", ""),
        ("notice.pdf", "text/plain", ""),
        ("notice.pdf", "application/pdf", "not-lowercase-hex"),
    ],
)
def test_presign_rejects_invalid_policy_inputs(
    monkeypatch,
    filename: str,
    content_type: str,
    checksum: str,
) -> None:
    stub_presign(monkeypatch)
    admin = MembershipFactory(role=ROLE_LEGAL_ADMIN)
    matter = MatterFactory(organization=admin.organization, owner=admin)

    with pytest.raises(Exception) as exc_info:
        create_document_presign(
            actor=admin.user,
            idempotency_key=f"{filename}:{content_type}:{checksum}",
            **upload_payload(
                matter_id=matter.id,
                filename=filename,
                content_type=content_type,
                checksum_sha256=checksum,
            ),
        )

    assert exc_info.value.status_code == 422
    assert exc_info.value.get_codes() == "invalid_input"


def test_viewer_and_cross_org_actor_cannot_presign(monkeypatch) -> None:
    stub_presign(monkeypatch)
    organization = OrganizationFactory()
    owner = MembershipFactory(organization=organization)
    viewer = MembershipFactory(organization=organization, role=ROLE_VIEWER)
    other_admin = MembershipFactory(role=ROLE_LEGAL_ADMIN)
    matter = MatterFactory(organization=organization, owner=owner)
    MatterAccessFactory(matter=matter, membership=viewer, level=ACCESS_LEVEL_VIEW)

    with pytest.raises(PermissionDenied):
        create_document_presign(
            actor=viewer.user,
            idempotency_key="viewer",
            **upload_payload(matter_id=matter.id),
        )
    with pytest.raises(NotFound):
        create_document_presign(
            actor=other_admin.user,
            idempotency_key="other",
            **upload_payload(matter_id=matter.id),
        )


def test_presign_rejects_active_pending_document_limit(monkeypatch) -> None:
    stub_presign(monkeypatch)
    admin = MembershipFactory(role=ROLE_LEGAL_ADMIN)
    matter = MatterFactory(organization=admin.organization, owner=admin)
    for _ in range(MAX_ACTIVE_DOCUMENT_UPLOADS):
        DocumentFactory(matter=matter, uploaded_by=admin, status=DOCUMENT_STATUS_PENDING_UPLOAD)

    with pytest.raises(Exception) as exc_info:
        create_document_presign(
            actor=admin.user,
            idempotency_key="capacity",
            **upload_payload(matter_id=matter.id),
        )

    assert exc_info.value.status_code == 429
    assert exc_info.value.default_code == "upload_active_document_limit_exceeded"


def upload_payload(
    *,
    matter_id,
    filename: str = "notice.pdf",
    content_type: str = "application/pdf",
    size: int = 1024,
    checksum_sha256: str = "",
) -> dict:
    return {
        "matter_id": matter_id,
        "filename": filename,
        "content_type": content_type,
        "size": size,
        "checksum_sha256": checksum_sha256,
        "description": "Initial upload",
    }


def stub_presign(monkeypatch) -> list[dict]:
    calls = []

    def fake_presign_upload_object(*, object_key: str, expires_in_seconds: int) -> str:
        calls.append({"object_key": object_key, "expires_in_seconds": expires_in_seconds})
        return "http://localhost:9000/presigned-upload"

    monkeypatch.setattr("apps.documents.services.presign_upload_object", fake_presign_upload_object)
    return calls
