"""Focused security tests for highest-risk backend boundaries."""

from __future__ import annotations

from datetime import timedelta
from types import SimpleNamespace

import pytest
from asgiref.sync import async_to_sync
from asgiref.testing import ApplicationCommunicator
from channels.layers import get_channel_layer
from django.conf import settings
from django.core.cache import cache
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from apps.activity.models import ActivityLog, OutboxEvent
from apps.cases.tests.factories import LegalCaseFactory
from apps.deadlines.models import STATUS_CANCELLED as DEADLINE_STATUS_CANCELLED
from apps.deadlines.tests.factories import DeadlineFactory
from apps.documents.tests.factories import DocumentFactory, UploadSessionFactory
from apps.matters.models import ACCESS_LEVEL_VIEW
from apps.matters.tests.factories import MatterAccessFactory, MatterFactory
from apps.offboarding.models import OffboardingRun
from apps.organizations.models import (
    ROLE_LEGAL_ADMIN,
    ROLE_LEGAL_COUNSEL,
    ROLE_LEGAL_MANAGER,
    ROLE_VIEWER,
    STATUS_ACTIVE,
)
from apps.organizations.tests.factories import MembershipFactory, OrganizationFactory
from apps.tasks.models import STATUS_DONE
from apps.tasks.tests.factories import TaskFactory
from common.api.errors import ConflictError
from common.api.throttles import LoginThrottle, UploadInitiateThrottle
from common.auth.tickets import create_websocket_ticket
from common.logging import redact_sensitive_text
from common.realtime.publisher import (
    EVENT_DOCUMENT_UPLOAD_STATUS_CHANGED,
    build_user_event,
    user_group_name,
)
from config.asgi import application

pytestmark = pytest.mark.django_db

TEST_PASSWORD = "test-password"


@pytest.fixture(autouse=True)
def clear_security_cache() -> None:
    cache.clear()


def test_cross_org_records_are_hidden_from_list_retrieve_update_and_download(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    stub_download(monkeypatch)
    organization = OrganizationFactory()
    admin = MembershipFactory(organization=organization, role=ROLE_LEGAL_ADMIN)
    own_case = LegalCaseFactory(matter__organization=organization, matter__owner=admin)
    other_admin = MembershipFactory(role=ROLE_LEGAL_ADMIN)
    other_case = LegalCaseFactory(
        matter__organization=other_admin.organization,
        matter__owner=other_admin,
    )
    other_document = DocumentFactory(
        upload_session__matter=other_case.matter,
        upload_session__requested_by=other_admin,
    )
    client = authenticated_client(member=admin)

    list_response = client.get(reverse("cases-list"))
    retrieve_response = client.get(reverse("cases-detail", args=[other_case.matter_id]))
    update_response = client.patch(
        reverse("cases-detail", args=[other_case.matter_id]),
        {"version": 1, "title": "Hidden edit"},
        format="json",
    )
    download_response = client.post(reverse("documents-download-url", args=[other_document.id]))

    assert case_ids(list_response) == {str(own_case.matter_id)}
    assert retrieve_response.status_code == 404
    assert update_response.status_code == 404
    assert download_response.status_code == 404


def test_viewer_mutation_is_forbidden_and_stale_write_returns_conflict() -> None:
    organization = OrganizationFactory()
    owner = MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL)
    viewer = MembershipFactory(organization=organization, role=ROLE_VIEWER)
    legal_case = LegalCaseFactory(matter__organization=organization, matter__owner=owner)
    MatterAccessFactory(matter=legal_case.matter, membership=viewer, level=ACCESS_LEVEL_VIEW)

    viewer_response = authenticated_client(member=viewer).patch(
        reverse("cases-detail", args=[legal_case.matter_id]),
        {"version": 1, "title": "Viewer edit"},
        format="json",
    )
    stale_response = authenticated_client(member=owner).patch(
        reverse("cases-detail", args=[legal_case.matter_id]),
        {"version": 99, "title": "Stale edit"},
        format="json",
    )

    assert viewer_response.status_code == 403
    assert stale_response.status_code == 409
    assert stale_response.json()["code"] == "case_version_conflict"


def test_role_mutation_matrix_blocks_non_admin_cross_org_and_last_admin() -> None:
    organization = OrganizationFactory()
    admin = MembershipFactory(organization=organization, role=ROLE_LEGAL_ADMIN)
    manager = MembershipFactory(organization=organization, role=ROLE_LEGAL_MANAGER)
    counsel = MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL)
    other_member = MembershipFactory(role=ROLE_LEGAL_COUNSEL)

    non_admin_response = authenticated_client(member=manager).post(
        reverse("memberships-change-role", args=[counsel.id]),
        {"role": ROLE_VIEWER},
        format="json",
    )
    cross_org_response = authenticated_client(member=admin).post(
        reverse("memberships-change-role", args=[other_member.id]),
        {"role": ROLE_VIEWER},
        format="json",
    )
    last_admin_response = authenticated_client(member=admin).post(
        reverse("memberships-change-role", args=[admin.id]),
        {"role": ROLE_VIEWER},
        format="json",
    )

    assert non_admin_response.status_code == 403
    assert cross_org_response.status_code == 404
    assert last_admin_response.status_code == 409
    assert membership_refresh(counsel).role == ROLE_LEGAL_COUNSEL
    assert membership_refresh(other_member).role == ROLE_LEGAL_COUNSEL
    assert membership_refresh(admin).role == ROLE_LEGAL_ADMIN


def test_jwt_rotation_replay_logout_and_csrf_contracts() -> None:
    member = MembershipFactory()
    no_csrf_client = APIClient(enforce_csrf_checks=True)
    csrf_checked_client = csrf_client()

    no_csrf = no_csrf_client.post(
        reverse("auth-login"),
        {"username": member.user.username, "password": TEST_PASSWORD},
        format="json",
    )
    login_response = login(client=csrf_checked_client, username=member.user.username)
    old_refresh_cookie = csrf_checked_client.cookies[settings.JWT_REFRESH_COOKIE_NAME].value
    refresh_response = csrf_checked_client.post(
        reverse("auth-refresh"),
        {},
        format="json",
        HTTP_X_CSRFTOKEN=csrf_token(csrf_checked_client),
    )
    replay_client = csrf_client()
    replay_client.cookies[settings.JWT_REFRESH_COOKIE_NAME] = old_refresh_cookie
    replay_response = replay_client.post(
        reverse("auth-refresh"),
        {},
        format="json",
        HTTP_X_CSRFTOKEN=csrf_token(replay_client),
    )
    logout_response = csrf_checked_client.post(
        reverse("auth-logout"),
        {},
        format="json",
        HTTP_X_CSRFTOKEN=csrf_token(csrf_checked_client),
    )

    assert no_csrf.status_code == 403
    assert login_response.status_code == 200
    assert refresh_response.status_code == 200
    assert replay_response.status_code == 401
    assert replay_response.json()["code"] == "refresh_invalid"
    assert logout_response.status_code == 204
    assert csrf_checked_client.cookies[settings.JWT_REFRESH_COOKIE_NAME].value == ""


def test_login_and_upload_rate_limits_return_429_with_retry_after(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(LoginThrottle, "rate", "2/min")
    monkeypatch.setattr(UploadInitiateThrottle, "rate", "1/hour")
    stub_upload_presign(monkeypatch)
    member = MembershipFactory(role=ROLE_LEGAL_ADMIN)
    matter = MatterFactory(organization=member.organization, owner=member)
    login_client = csrf_client()
    upload_client = authenticated_client(member=member)

    for _ in range(2):
        login_client.post(
            reverse("auth-login"),
            {"username": member.user.username, "password": "wrong"},
            format="json",
            HTTP_X_CSRFTOKEN=csrf_token(login_client),
        )
    login_limit = login_client.post(
        reverse("auth-login"),
        {"username": member.user.username, "password": "wrong"},
        format="json",
        HTTP_X_CSRFTOKEN=csrf_token(login_client),
    )
    first_upload = upload_client.post(
        reverse("documents-uploads-list"),
        upload_payload(matter_id=matter.id),
        format="json",
    )
    upload_limit = upload_client.post(
        reverse("documents-uploads-list"),
        upload_payload(matter_id=matter.id),
        format="json",
    )

    assert login_limit.status_code == 429
    assert int(login_limit["Retry-After"]) > 0
    assert first_upload.status_code == 201
    assert upload_limit.status_code == 429
    assert upload_limit.json()["code"] == "rate_limit_exceeded"


def test_upload_completion_rejects_mismatch_expiry_missing_and_duplicate_misuse(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    stub_schedule(monkeypatch)
    member = MembershipFactory(role=ROLE_LEGAL_ADMIN)
    expired = UploadSessionFactory(
        matter__organization=member.organization,
        requested_by=member,
        expires_at=timezone.now() - timedelta(minutes=1),
    )
    missing = UploadSessionFactory(matter__organization=member.organization, requested_by=member)
    mismatch = UploadSessionFactory(matter__organization=member.organization, requested_by=member)
    replay = UploadSessionFactory(matter__organization=member.organization, requested_by=member)
    client = authenticated_client(member=member)

    expired_response = complete_upload_response(client=client, session=expired, key="expired")
    monkeypatch.setattr("apps.documents.services.upload_object_stat", raise_missing_object)
    missing_response = complete_upload_response(client=client, session=missing, key="missing")
    monkeypatch.setattr(
        "apps.documents.services.upload_object_stat",
        lambda *, object_key: fake_stat(size=999),
    )
    mismatch_response = complete_upload_response(client=client, session=mismatch, key="mismatch")
    monkeypatch.setattr(
        "apps.documents.services.upload_object_stat",
        lambda *, object_key: fake_stat(),
    )
    first_response = complete_upload_response(client=client, session=replay, key="same")
    replay_response = complete_upload_response(client=client, session=replay, key="same")
    conflicting_response = complete_upload_response(client=client, session=replay, key="different")

    assert expired_response.json()["code"] == "upload_expired"
    assert missing_response.json()["code"] == "upload_object_missing"
    assert mismatch_response.json()["code"] == "upload_object_mismatch"
    assert first_response.status_code == 202
    assert replay_response.json() == first_response.json()
    assert conflicting_response.status_code == 409
    assert no_activity_or_outbox_contains("presigned")


def test_sensitive_logging_redacts_tokens_tickets_passwords_and_presigned_urls() -> None:
    text = (
        "Authorization: Bearer jwt-secret Cookie: refresh=secret "
        "/ws/v1/events/?ticket=ws-secret password=hunter2 "
        "https://minio.local/doc.pdf?X-Amz-Signature=minio-secret"
    )

    redacted = redact_sensitive_text(text)

    assert "jwt-secret" not in redacted
    assert "refresh=secret" not in redacted
    assert "ws-secret" not in redacted
    assert "hunter2" not in redacted
    assert "minio-secret" not in redacted


@pytest.mark.django_db(transaction=True)
def test_websocket_ticket_reuse_cross_user_and_origin_boundaries() -> None:
    first_member = MembershipFactory()
    second_member = MembershipFactory()
    reusable_ticket = create_websocket_ticket(membership=first_member).ticket
    bad_origin_ticket = create_websocket_ticket(membership=first_member).ticket

    async_to_sync(run_websocket_security_checks)(
        reusable_ticket,
        bad_origin_ticket,
        second_member.user_id,
    )


def test_counsel_cannot_offboard_and_matching_execute_is_idempotent() -> None:
    context = offboarding_context()
    preview = preview_for_context(context=context)
    counsel = MembershipFactory(
        organization=context["organization"],
        role=ROLE_LEGAL_COUNSEL,
    )
    payload = execute_payload(context=context, preview=preview)
    client = authenticated_client(member=context["admin"])

    denied = authenticated_client(member=counsel).post(
        reverse("offboarding-execute"),
        payload,
        format="json",
        HTTP_IDEMPOTENCY_KEY="offboarding-denied",
    )
    first = client.post(
        reverse("offboarding-execute"),
        payload,
        format="json",
        HTTP_IDEMPOTENCY_KEY="offboarding-replay",
    )
    replay = client.post(
        reverse("offboarding-execute"),
        payload,
        format="json",
        HTTP_IDEMPOTENCY_KEY="offboarding-replay",
    )

    assert denied.status_code == 403
    assert first.status_code == 200
    assert replay.status_code == 200
    assert replay.json() == first.json()
    assert OffboardingRun.objects.count() == 1


def test_offboarding_rolls_back_when_late_stage_fails(monkeypatch: pytest.MonkeyPatch) -> None:
    context = offboarding_context()
    preview = preview_for_context(context=context)

    def fail_outbox(*, run, actor_membership):
        raise RuntimeError("forced security rollback")

    monkeypatch.setattr("apps.offboarding.services.create_offboarding_outbox", fail_outbox)
    with pytest.raises(RuntimeError):
        authenticated_client(member=context["admin"]).post(
            reverse("offboarding-execute"),
            execute_payload(context=context, preview=preview),
            format="json",
            HTTP_IDEMPOTENCY_KEY="offboarding-rollback",
        )

    assert OffboardingRun.objects.count() == 0
    assert ActivityLog.objects.count() == 0
    assert OutboxEvent.objects.count() == 0
    assert_departing_state_unchanged(context=context)


def authenticated_client(*, member) -> APIClient:
    client = APIClient()
    client.force_authenticate(user=member.user)
    return client


def csrf_client() -> APIClient:
    client = APIClient(enforce_csrf_checks=True)
    client.get(reverse("auth-csrf"))
    return client


def csrf_token(client: APIClient) -> str:
    return client.cookies[settings.CSRF_COOKIE_NAME].value


def login(*, client: APIClient, username: str):
    return client.post(
        reverse("auth-login"),
        {"username": username, "password": TEST_PASSWORD},
        format="json",
        HTTP_X_CSRFTOKEN=csrf_token(client),
    )


def case_ids(response) -> set[str]:
    assert response.status_code == 200
    return {item["id"] for item in response.json()["results"]}


def membership_refresh(membership):
    membership.refresh_from_db()
    return membership


def upload_payload(*, matter_id) -> dict:
    return {
        "matter_id": str(matter_id),
        "filename": "notice.pdf",
        "content_type": "application/pdf",
        "size": 1024,
        "checksum": "sha256:abc123",
    }


def complete_upload_response(*, client: APIClient, session, key: str):
    return client.post(
        reverse("documents-uploads-complete", args=[session.id]),
        {},
        format="json",
        HTTP_IDEMPOTENCY_KEY=key,
    )


def fake_stat(*, size: int = 1024):
    return SimpleNamespace(size=size, content_type="application/pdf", metadata={})


def raise_missing_object(*, object_key: str):
    raise ConflictError("Missing.", code="upload_object_missing")


def stub_upload_presign(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        "apps.documents.services.presign_upload_object",
        lambda *, object_key, expires_in_seconds: "http://localhost:9000/presigned-upload",
    )


def stub_download(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        "apps.documents.services.presign_download_object",
        lambda *, object_key, expires_in_seconds: "http://localhost:9000/presigned-download",
    )


def stub_schedule(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        "apps.documents.services.schedule_upload_processing",
        lambda *, upload_id: None,
    )


def no_activity_or_outbox_contains(value: str) -> bool:
    activities = list(ActivityLog.objects.values("before_values", "after_values", "metadata"))
    outbox_events = list(OutboxEvent.objects.values("payload"))
    return value not in f"{activities}{outbox_events}"


async def run_websocket_security_checks(
    ticket: str,
    bad_origin_ticket: str,
    second_user_id,
) -> None:
    first_connected, first = await connect_websocket(ticket=ticket)
    reused_connected, _ = await connect_websocket(ticket=ticket)
    bad_origin_connected, _ = await connect_websocket(
        ticket=bad_origin_ticket,
        origin=b"http://evil.test",
    )
    await send_cross_user_event(second_user_id=second_user_id)

    assert first_connected is True
    assert reused_connected is False
    assert bad_origin_connected is False
    assert await first.receive_nothing(timeout=0.05, interval=0.01) is True
    await close_websocket(communicator=first)


async def connect_websocket(*, ticket: str, origin: bytes = b"http://localhost"):
    communicator = ApplicationCommunicator(
        application,
        websocket_scope(path=f"/ws/v1/events/?ticket={ticket}", origin=origin),
    )
    await communicator.send_input({"type": "websocket.connect"})
    output = await communicator.receive_output(timeout=1)
    return output["type"] == "websocket.accept", communicator


async def send_cross_user_event(*, second_user_id) -> None:
    event = build_user_event(
        event_type=EVENT_DOCUMENT_UPLOAD_STATUS_CHANGED,
        data={
            "upload_id": "11111111-1111-1111-1111-111111111111",
            "status": "available",
        },
    )
    await get_channel_layer().group_send(
        user_group_name(user_id=second_user_id),
        {"type": "user.event", "event": event},
    )


async def close_websocket(*, communicator) -> None:
    await communicator.send_input({"type": "websocket.disconnect", "code": 1000})
    await communicator.wait(timeout=1)


def websocket_scope(*, path: str, origin: bytes) -> dict:
    return {
        "type": "websocket",
        "path": path.split("?", 1)[0],
        "query_string": path.split("?", 1)[1].encode(),
        "headers": [(b"origin", origin), (b"host", b"localhost")],
        "client": ("127.0.0.1", 50000),
        "server": ("localhost", 80),
        "subprotocols": [],
    }


def offboarding_context() -> dict:
    organization = OrganizationFactory()
    admin = MembershipFactory(organization=organization, role=ROLE_LEGAL_ADMIN)
    departing = MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL)
    replacement = MembershipFactory(organization=organization, role=ROLE_LEGAL_MANAGER)
    matter = MatterFactory(organization=organization, owner=departing, created_by=admin)
    task = TaskFactory(organization=organization, matter=matter, assignee=departing)
    closed_task = TaskFactory(
        organization=organization,
        matter=matter,
        assignee=departing,
        status=STATUS_DONE,
    )
    deadline = DeadlineFactory(organization=organization, matter=matter, assignee=departing)
    closed_deadline = DeadlineFactory(
        organization=organization,
        matter=matter,
        assignee=departing,
        status=DEADLINE_STATUS_CANCELLED,
    )
    grant = MatterAccessFactory(matter=matter, membership=departing, granted_by=admin)
    return {
        "organization": organization,
        "admin": admin,
        "departing": departing,
        "replacement": replacement,
        "matter": matter,
        "task": task,
        "closed_task": closed_task,
        "deadline": deadline,
        "closed_deadline": closed_deadline,
        "grant": grant,
    }


def preview_for_context(*, context: dict) -> dict:
    response = authenticated_client(member=context["admin"]).post(
        reverse("offboarding-preview"),
        preview_payload(context=context),
        format="json",
    )
    assert response.status_code == 200
    return response.json()


def preview_payload(*, context: dict) -> dict:
    return {
        "departing_membership_id": str(context["departing"].id),
        "replacement_membership_id": str(context["replacement"].id),
    }


def execute_payload(*, context: dict, preview: dict) -> dict:
    return {
        **preview_payload(context=context),
        "preview_fingerprint": preview["fingerprint"],
        "confirmation": "OFFBOARD",
    }


def assert_departing_state_unchanged(*, context: dict) -> None:
    assert membership_refresh(context["departing"]).status == STATUS_ACTIVE
    assert matter_refresh(context["matter"]).owner == context["departing"]
    assert task_refresh(context["task"]).assignee == context["departing"]
    assert deadline_refresh(context["deadline"]).assignee == context["departing"]
    assert grant_refresh(context["grant"]).revoked_at is None


def matter_refresh(matter):
    matter.refresh_from_db()
    return matter


def task_refresh(task):
    task.refresh_from_db()
    return task


def deadline_refresh(deadline):
    deadline.refresh_from_db()
    return deadline


def grant_refresh(grant):
    grant.refresh_from_db()
    return grant
