"""API tests for direct document upload endpoints."""

from __future__ import annotations

import pytest
from django.core.cache import cache
from django.urls import reverse
from rest_framework.test import APIClient

from apps.documents.models import DOCUMENT_STATUS_PENDING_UPLOAD
from apps.documents.tests.factories import DocumentFactory
from apps.matters.models import ACCESS_LEVEL_VIEW
from apps.matters.tests.factories import MatterAccessFactory, MatterFactory
from apps.organizations.models import ROLE_LEGAL_ADMIN, ROLE_VIEWER
from apps.organizations.tests.factories import MembershipFactory, OrganizationFactory
from common.api.throttles import DocumentPresignThrottle

pytestmark = pytest.mark.django_db


def test_document_presign_api_returns_presigned_instructions(monkeypatch) -> None:
    stub_presign(monkeypatch)
    admin = MembershipFactory(role=ROLE_LEGAL_ADMIN)
    matter = MatterFactory(organization=admin.organization, owner=admin)

    response = authenticated_client(member=admin).post(
        reverse("documents-presign"),
        upload_payload(matter_id=matter.id),
        format="json",
        HTTP_IDEMPOTENCY_KEY="11111111-1111-1111-1111-111111111111",
    )
    data = response.json()

    assert response.status_code == 201
    assert data["document"]["id"]
    assert data["document"]["status"] == "pending_upload"
    assert data["upload"]["method"] == "PUT"
    assert data["upload"]["url"] == "http://localhost:9000/presigned-upload"
    assert data["upload"]["headers"] == {"Content-Type": "application/pdf"}
    assert "object_key" not in data["document"]
    assert "fields" not in data["upload"]


def test_document_presign_api_rejects_forbidden_transport_fields(monkeypatch) -> None:
    stub_presign(monkeypatch)
    admin = MembershipFactory(role=ROLE_LEGAL_ADMIN)
    matter = MatterFactory(organization=admin.organization, owner=admin)
    payload = upload_payload(matter_id=matter.id)
    payload["object_key"] = "client/chosen/key"
    payload["organization_id"] = str(admin.organization_id)

    response = authenticated_client(member=admin).post(
        reverse("documents-presign"),
        payload,
        format="json",
        HTTP_IDEMPOTENCY_KEY="11111111-1111-1111-1111-111111111111",
    )

    assert response.status_code == 400
    assert "object_key" in response.json()["details"]["forbidden_fields"]


def test_document_uploads_session_endpoint_no_longer_exists(monkeypatch) -> None:
    stub_presign(monkeypatch)
    admin = MembershipFactory(role=ROLE_LEGAL_ADMIN)
    matter = MatterFactory(organization=admin.organization, owner=admin)

    response = authenticated_client(member=admin).post(
        "/api/v1/documents/uploads/",
        upload_payload(matter_id=matter.id),
        format="json",
    )

    assert response.status_code == 404


def test_document_presign_api_denies_viewer_and_hidden_matter(monkeypatch) -> None:
    stub_presign(monkeypatch)
    organization = OrganizationFactory()
    owner = MembershipFactory(organization=organization)
    viewer = MembershipFactory(organization=organization, role=ROLE_VIEWER)
    other_admin = MembershipFactory(role=ROLE_LEGAL_ADMIN)
    matter = MatterFactory(organization=organization, owner=owner)
    MatterAccessFactory(matter=matter, membership=viewer, level=ACCESS_LEVEL_VIEW)

    viewer_response = authenticated_client(member=viewer).post(
        reverse("documents-presign"),
        upload_payload(matter_id=matter.id),
        format="json",
        HTTP_IDEMPOTENCY_KEY="viewer",
    )
    hidden_response = authenticated_client(member=other_admin).post(
        reverse("documents-presign"),
        upload_payload(matter_id=matter.id),
        format="json",
        HTTP_IDEMPOTENCY_KEY="hidden",
    )

    assert viewer_response.status_code == 403
    assert hidden_response.status_code == 404


def test_document_presign_api_rate_limit_returns_retry_after(monkeypatch) -> None:
    cache.clear()
    monkeypatch.setattr(DocumentPresignThrottle, "rate", "1/hour")
    stub_presign(monkeypatch)
    admin = MembershipFactory(role=ROLE_LEGAL_ADMIN)
    matter = MatterFactory(organization=admin.organization, owner=admin)
    client = authenticated_client(member=admin)

    first_response = client.post(
        reverse("documents-presign"),
        upload_payload(matter_id=matter.id),
        format="json",
        HTTP_IDEMPOTENCY_KEY="first",
    )
    second_response = client.post(
        reverse("documents-presign"),
        upload_payload(matter_id=matter.id),
        format="json",
        HTTP_IDEMPOTENCY_KEY="second",
    )

    assert first_response.status_code == 201
    assert second_response.status_code == 429
    assert second_response.json()["code"] == "rate_limit_exceeded"
    assert int(second_response["Retry-After"]) > 0


def test_document_complete_api_verifies_and_returns_available(monkeypatch) -> None:
    stub_stat(monkeypatch)
    admin = MembershipFactory(role=ROLE_LEGAL_ADMIN)
    document = DocumentFactory(
        matter__organization=admin.organization,
        uploaded_by=admin,
        status=DOCUMENT_STATUS_PENDING_UPLOAD,
        actual_size=None,
        uploaded_at=None,
    )

    response = authenticated_client(member=admin).post(
        reverse("documents-complete", args=[document.id]),
        {},
        format="json",
    )

    assert response.status_code == 200
    assert response.json()["status"] == "available"
    assert response.json()["size"] == 1024


def test_document_list_detail_download_and_revoke_api_are_permission_scoped(monkeypatch) -> None:
    stub_download(monkeypatch)
    organization = OrganizationFactory()
    owner = MembershipFactory(organization=organization)
    viewer = MembershipFactory(organization=organization, role=ROLE_VIEWER)
    other_admin = MembershipFactory(role=ROLE_LEGAL_ADMIN)
    matter = MatterFactory(organization=organization, owner=owner)
    document = DocumentFactory(matter=matter, uploaded_by=owner)
    MatterAccessFactory(matter=matter, membership=viewer, level=ACCESS_LEVEL_VIEW)

    viewer_list = authenticated_client(member=viewer).get(reverse("documents-list"))
    viewer_download = authenticated_client(member=viewer).post(
        reverse("documents-download-url", args=[document.id]),
    )
    viewer_revoke = authenticated_client(member=viewer).post(
        reverse("documents-revoke", args=[document.id]),
    )
    hidden_detail = authenticated_client(member=other_admin).get(
        reverse("documents-detail", args=[document.id]),
    )

    assert [item["id"] for item in viewer_list.json()["results"]] == [str(document.id)]
    assert viewer_download.status_code == 200
    assert viewer_download.json()["url"] == "http://localhost:9000/presigned-download"
    assert viewer_revoke.status_code == 403
    assert hidden_detail.status_code == 404


def authenticated_client(*, member) -> APIClient:
    client = APIClient()
    client.force_authenticate(user=member.user)
    return client


def upload_payload(
    *,
    matter_id,
    filename: str = "notice.pdf",
    content_type: str = "application/pdf",
    size: int = 1024,
) -> dict:
    return {
        "matter_id": str(matter_id),
        "filename": filename,
        "content_type": content_type,
        "size": size,
        "checksum_sha256": "",
    }


def stub_presign(monkeypatch) -> None:
    monkeypatch.setattr(
        "apps.documents.services.presign_upload_object",
        lambda *, object_key, expires_in_seconds: "http://localhost:9000/presigned-upload",
    )


def stub_stat(monkeypatch) -> None:
    class Stat:
        size = 1024
        content_type = "application/pdf"
        metadata = {}
        etag = "etag"

    monkeypatch.setattr("apps.documents.services.upload_object_stat", lambda *, object_key: Stat())


def stub_download(monkeypatch) -> None:
    monkeypatch.setattr(
        "apps.documents.services.presign_download_object",
        lambda *, object_key, expires_in_seconds: "http://localhost:9000/presigned-download",
    )
