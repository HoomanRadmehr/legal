"""Service tests for upload initiation."""

from __future__ import annotations

import pytest
from django.test import override_settings
from rest_framework.exceptions import NotFound, PermissionDenied

from apps.activity.models import ActivityLog, OutboxEvent
from apps.documents.models import UploadSession
from apps.documents.services import (
    MAX_ACTIVE_UPLOAD_SESSIONS,
    initiate_upload,
)
from apps.documents.tests.factories import UploadSessionFactory
from apps.matters.models import ACCESS_LEVEL_VIEW
from apps.matters.tests.factories import MatterAccessFactory, MatterFactory
from apps.organizations.models import ROLE_LEGAL_ADMIN, ROLE_VIEWER
from apps.organizations.tests.factories import MembershipFactory, OrganizationFactory

pytestmark = pytest.mark.django_db


def test_initiate_upload_creates_session_without_storing_presigned_url(monkeypatch) -> None:
    presign_calls = stub_presign(monkeypatch)
    admin = MembershipFactory(role=ROLE_LEGAL_ADMIN)
    matter = MatterFactory(organization=admin.organization, owner=admin)

    result = initiate_upload(actor=admin.user, data=upload_payload(matter_id=matter.id))
    session = result["upload"]

    assert session.status == "initiated"
    assert result["instructions"]["url"] == "http://localhost:9000/presigned-upload"
    assert presign_calls == [
        {
            "object_key": session.object_key,
            "expires_in_seconds": 900,
        }
    ]
    assert "notice" not in session.object_key
    assert str(session.id) in session.object_key
    assert not any("url" in field.name for field in UploadSession._meta.fields)
    assert ActivityLog.objects.filter(target_id=session.id).exists()
    assert OutboxEvent.objects.filter(aggregate_id=session.id).exists()


@override_settings(MAX_UPLOAD_SIZE_BYTES=5)
def test_initiate_upload_rejects_oversize_file_with_stable_error(monkeypatch) -> None:
    stub_presign(monkeypatch)
    admin = MembershipFactory(role=ROLE_LEGAL_ADMIN)
    matter = MatterFactory(organization=admin.organization, owner=admin)

    with pytest.raises(Exception) as exc_info:
        initiate_upload(actor=admin.user, data=upload_payload(matter_id=matter.id, size=10))

    assert exc_info.value.status_code == 413
    assert exc_info.value.default_code == "upload_size_exceeded"


def test_initiate_upload_rejects_disallowed_content_type(monkeypatch) -> None:
    stub_presign(monkeypatch)
    admin = MembershipFactory(role=ROLE_LEGAL_ADMIN)
    matter = MatterFactory(organization=admin.organization, owner=admin)

    with pytest.raises(Exception) as exc_info:
        initiate_upload(
            actor=admin.user,
            data=upload_payload(
                matter_id=matter.id,
                filename="notice.exe",
                content_type="application/octet-stream",
            ),
        )

    assert exc_info.value.status_code == 422
    assert exc_info.value.get_codes() == "upload_policy_violation"


def test_viewer_and_cross_org_actor_cannot_initiate_upload(monkeypatch) -> None:
    stub_presign(monkeypatch)
    organization = OrganizationFactory()
    owner = MembershipFactory(organization=organization)
    viewer = MembershipFactory(organization=organization, role=ROLE_VIEWER)
    other_admin = MembershipFactory(role=ROLE_LEGAL_ADMIN)
    matter = MatterFactory(organization=organization, owner=owner)
    MatterAccessFactory(matter=matter, membership=viewer, level=ACCESS_LEVEL_VIEW)

    with pytest.raises(PermissionDenied):
        initiate_upload(actor=viewer.user, data=upload_payload(matter_id=matter.id))
    with pytest.raises(NotFound):
        initiate_upload(actor=other_admin.user, data=upload_payload(matter_id=matter.id))


def test_initiate_upload_rejects_active_session_limit(monkeypatch) -> None:
    stub_presign(monkeypatch)
    admin = MembershipFactory(role=ROLE_LEGAL_ADMIN)
    matter = MatterFactory(organization=admin.organization, owner=admin)
    for _ in range(MAX_ACTIVE_UPLOAD_SESSIONS):
        UploadSessionFactory(matter=matter, requested_by=admin)

    with pytest.raises(Exception) as exc_info:
        initiate_upload(actor=admin.user, data=upload_payload(matter_id=matter.id))

    assert exc_info.value.status_code == 429
    assert exc_info.value.default_code == "upload_active_session_limit_exceeded"


def upload_payload(
    *,
    matter_id,
    filename: str = "notice.pdf",
    content_type: str = "application/pdf",
    size: int = 1024,
) -> dict:
    return {
        "matter_id": matter_id,
        "filename": filename,
        "content_type": content_type,
        "size": size,
        "checksum": "sha256:abc123",
        "description": "Initial upload",
    }


def stub_presign(monkeypatch) -> list[dict]:
    calls = []

    def fake_presign_upload_object(*, object_key: str, expires_in_seconds: int) -> str:
        calls.append(
            {
                "object_key": object_key,
                "expires_in_seconds": expires_in_seconds,
            }
        )
        return "http://localhost:9000/presigned-upload"

    monkeypatch.setattr("apps.documents.services.presign_upload_object", fake_presign_upload_object)
    return calls
