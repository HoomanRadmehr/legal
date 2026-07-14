"""API tests for document upload endpoints."""

from __future__ import annotations

import pytest
from django.core.cache import cache
from django.urls import reverse
from rest_framework.test import APIClient

from apps.documents.tests.factories import DocumentFactory, UploadSessionFactory
from apps.matters.models import ACCESS_LEVEL_VIEW
from apps.matters.tests.factories import MatterAccessFactory, MatterFactory
from apps.organizations.models import ROLE_LEGAL_ADMIN, ROLE_VIEWER
from apps.organizations.tests.factories import MembershipFactory, OrganizationFactory
from common.api.throttles import UploadInitiateThrottle

pytestmark = pytest.mark.django_db


def test_upload_initiate_api_returns_presigned_instructions(monkeypatch) -> None:
    stub_presign(monkeypatch)
    admin = MembershipFactory(role=ROLE_LEGAL_ADMIN)
    matter = MatterFactory(organization=admin.organization, owner=admin)

    response = authenticated_client(member=admin).post(
        reverse("documents-uploads-list"),
        upload_payload(matter_id=matter.id),
        format="json",
    )
    data = response.json()

    assert response.status_code == 201
    assert data["id"]
    assert data["status"] == "initiated"
    assert data["method"] == "PUT"
    assert data["url"] == "http://localhost:9000/presigned-upload"
    assert data["headers"] == {"Content-Type": "application/pdf"}
    assert "object_key" not in data


def test_upload_poll_api_is_permission_scoped(monkeypatch) -> None:
    stub_presign(monkeypatch)
    organization = OrganizationFactory()
    owner = MembershipFactory(organization=organization)
    viewer = MembershipFactory(organization=organization, role=ROLE_VIEWER)
    other_admin = MembershipFactory(role=ROLE_LEGAL_ADMIN)
    matter = MatterFactory(organization=organization, owner=owner)
    session = UploadSessionFactory(matter=matter, requested_by=owner)
    MatterAccessFactory(matter=matter, membership=viewer, level=ACCESS_LEVEL_VIEW)

    owner_response = authenticated_client(member=owner).get(upload_detail_url(session=session))
    viewer_response = authenticated_client(member=viewer).get(upload_detail_url(session=session))
    hidden_response = authenticated_client(member=other_admin).get(
        upload_detail_url(session=session)
    )

    assert owner_response.status_code == 200
    assert owner_response.json()["status"] == "initiated"
    assert viewer_response.status_code == 200
    assert hidden_response.status_code == 404


def test_upload_initiate_api_denies_viewer_and_hidden_matter(monkeypatch) -> None:
    stub_presign(monkeypatch)
    organization = OrganizationFactory()
    owner = MembershipFactory(organization=organization)
    viewer = MembershipFactory(organization=organization, role=ROLE_VIEWER)
    other_admin = MembershipFactory(role=ROLE_LEGAL_ADMIN)
    matter = MatterFactory(organization=organization, owner=owner)
    MatterAccessFactory(matter=matter, membership=viewer, level=ACCESS_LEVEL_VIEW)

    viewer_response = authenticated_client(member=viewer).post(
        reverse("documents-uploads-list"),
        upload_payload(matter_id=matter.id),
        format="json",
    )
    hidden_response = authenticated_client(member=other_admin).post(
        reverse("documents-uploads-list"),
        upload_payload(matter_id=matter.id),
        format="json",
    )

    assert viewer_response.status_code == 403
    assert hidden_response.status_code == 404


def test_upload_initiate_api_returns_stable_policy_errors(monkeypatch) -> None:
    stub_presign(monkeypatch)
    admin = MembershipFactory(role=ROLE_LEGAL_ADMIN)
    matter = MatterFactory(organization=admin.organization, owner=admin)

    response = authenticated_client(member=admin).post(
        reverse("documents-uploads-list"),
        upload_payload(
            matter_id=matter.id,
            filename="notice.exe",
            content_type="application/octet-stream",
        ),
        format="json",
    )

    assert response.status_code == 422
    assert response.json()["code"] == "upload_policy_violation"


def test_upload_initiate_api_rate_limit_returns_retry_after(monkeypatch) -> None:
    cache.clear()
    monkeypatch.setattr(UploadInitiateThrottle, "rate", "1/hour")
    stub_presign(monkeypatch)
    admin = MembershipFactory(role=ROLE_LEGAL_ADMIN)
    matter = MatterFactory(organization=admin.organization, owner=admin)
    client = authenticated_client(member=admin)

    first_response = client.post(
        reverse("documents-uploads-list"),
        upload_payload(matter_id=matter.id),
        format="json",
    )
    second_response = client.post(
        reverse("documents-uploads-list"),
        upload_payload(matter_id=matter.id),
        format="json",
    )

    assert first_response.status_code == 201
    assert second_response.status_code == 429
    assert second_response.json()["code"] == "rate_limit_exceeded"
    assert int(second_response["Retry-After"]) > 0


def test_upload_complete_api_requires_idempotency_and_returns_processing(monkeypatch) -> None:
    stub_stat(monkeypatch)
    stub_schedule(monkeypatch)
    admin = MembershipFactory(role=ROLE_LEGAL_ADMIN)
    session = UploadSessionFactory(matter__organization=admin.organization, requested_by=admin)
    client = authenticated_client(member=admin)

    missing_header = client.post(upload_complete_url(session=session), {}, format="json")
    completed = client.post(
        upload_complete_url(session=session),
        {},
        format="json",
        HTTP_IDEMPOTENCY_KEY="11111111-1111-1111-1111-111111111111",
    )

    assert missing_header.status_code == 400
    assert completed.status_code == 202
    assert completed.json()["status"] == "processing"


def test_document_list_detail_download_and_revoke_api_are_permission_scoped(monkeypatch) -> None:
    stub_download(monkeypatch)
    organization = OrganizationFactory()
    owner = MembershipFactory(organization=organization)
    viewer = MembershipFactory(organization=organization, role=ROLE_VIEWER)
    other_admin = MembershipFactory(role=ROLE_LEGAL_ADMIN)
    matter = MatterFactory(organization=organization, owner=owner)
    document = DocumentFactory(upload_session__matter=matter, upload_session__requested_by=owner)
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


def upload_detail_url(*, session) -> str:
    return reverse("documents-uploads-detail", args=[session.id])


def upload_complete_url(*, session) -> str:
    return reverse("documents-uploads-complete", args=[session.id])


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
        "checksum": "sha256:abc123",
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

    monkeypatch.setattr(
        "apps.documents.services.upload_object_stat",
        lambda *, object_key: Stat(),
    )


def stub_download(monkeypatch) -> None:
    monkeypatch.setattr(
        "apps.documents.services.presign_download_object",
        lambda *, object_key, expires_in_seconds: "http://localhost:9000/presigned-download",
    )


def stub_schedule(monkeypatch) -> None:
    monkeypatch.setattr(
        "apps.documents.services.schedule_upload_processing",
        lambda *, upload_id: None,
    )
