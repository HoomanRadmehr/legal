"""Live document upload, MinIO, permission, and realtime checks for INT-004."""

from __future__ import annotations

import base64
import json
import os
import socket
import struct
import uuid
from dataclasses import dataclass
from http.cookiejar import CookieJar
from urllib.error import HTTPError
from urllib.parse import urlparse, urlunparse
from urllib.request import HTTPCookieProcessor, Request, build_opener, urlopen

import pytest
from django.conf import settings
from django.core.management import call_command

API_BASE_URL = os.environ.get("INTEGRATION_API_BASE_URL", "http://api:8000")
TEST_PASSWORD = "test-password"
UPLOAD_BYTES = b"INT-004 direct MinIO upload bytes\n"

pytestmark = pytest.mark.django_db(transaction=True)


@dataclass(frozen=True)
class HttpSession:
    cookies: CookieJar
    opener: object


@dataclass(frozen=True)
class HttpResult:
    body: str
    data: object
    headers: object
    status: int


@pytest.fixture(scope="module")
def document_seed(django_db_blocker):
    run_id = os.environ.get("INT004_RUN_ID", uuid.uuid4().hex[:8])
    with django_db_blocker.unblock():
        call_command("migrate", interactive=False, verbosity=0)
        seed = create_seed_data(run_id=run_id)

    yield seed

    with django_db_blocker.unblock():
        cleanup_seed_data(seed=seed)


def test_direct_upload_polling_download_and_negative_security_paths(document_seed) -> None:
    sessions = login_document_users(seed=document_seed)
    missing_csrf = login_without_csrf(username=document_seed["counsel_username"])
    flow = run_direct_upload_flow(sessions=sessions, matter_id=document_seed["matter_id"])

    assert missing_csrf.status == 403
    assert missing_csrf.data["code"] == "csrf_failed"
    assert_direct_upload_contract(flow=flow)
    assert_negative_document_paths(flow=flow)
    assert anonymous_minio_bucket_status() in {403, 404}
    assert_no_secret_leak(
        seed=document_seed,
        presigned_urls=[flow["upload"]["url"], flow["download"].data["url"]],
    )


def login_document_users(*, seed: dict[str, str]) -> dict[str, HttpResult]:
    return {
        "counsel": login_with_csrf(username=seed["counsel_username"]),
        "viewer": login_with_csrf(username=seed["viewer_username"]),
        "other_admin": login_with_csrf(username=seed["other_admin_username"]),
    }


def run_direct_upload_flow(*, sessions: dict[str, HttpResult], matter_id: str) -> dict:
    counsel = sessions["counsel"]
    presign = presign_document(session=counsel, matter_id=matter_id)
    assert presign.status == 201, response_summary(response=presign)
    document_id = presign.data["document"]["id"]
    upload = presign.data["upload"]
    upload_to_minio(upload=upload)
    responses = document_followup_requests(document_id=document_id, sessions=sessions)
    responses["presign"] = presign
    responses["upload"] = upload
    responses["viewer_presign"] = presign_document(session=sessions["viewer"], matter_id=matter_id)
    return responses


def document_followup_requests(*, document_id: str, sessions: dict[str, HttpResult]) -> dict:
    counsel = sessions["counsel"]
    viewer = sessions["viewer"]
    other_admin = sessions["other_admin"]
    return {
        "complete": request_json(
            session=counsel.data["session"],
            path=f"/api/v1/documents/{document_id}/complete/",
            method="POST",
            headers=auth_headers(access=counsel.data["access"]),
        ),
        "polled": request_json(
            session=counsel.data["session"],
            path=f"/api/v1/documents/{document_id}/",
            headers=auth_headers(access=counsel.data["access"]),
        ),
        "download": request_json(
            session=viewer.data["session"],
            path=f"/api/v1/documents/{document_id}/download-url/",
            method="POST",
            headers=auth_headers(access=viewer.data["access"]),
        ),
        "cross_org": request_json(
            session=other_admin.data["session"],
            path=f"/api/v1/documents/{document_id}/download-url/",
            method="POST",
            headers=auth_headers(access=other_admin.data["access"]),
        ),
    }


def assert_direct_upload_contract(*, flow: dict) -> None:
    presign = flow["presign"]
    upload = flow["upload"]
    complete = flow["complete"]
    polled = flow["polled"]
    download = flow["download"]
    assert presign.status == 201
    assert upload["method"] == "PUT"
    assert upload["headers"] == {"Content-Type": "application/pdf"}
    assert "object_key" not in presign.data["document"]
    assert complete.status == 200
    assert complete.data["status"] == "available"
    assert polled.status == 200
    assert polled.data["status"] == complete.data["status"]
    assert download.status == 200
    assert download_from_minio(url=download.data["url"]) == UPLOAD_BYTES


def assert_negative_document_paths(*, flow: dict) -> None:
    assert flow["viewer_presign"].status == 403
    assert flow["cross_org"].status == 404
    assert flow["cross_org"].data["code"] == "not_found"


def test_live_websocket_receives_document_upload_status(document_seed) -> None:
    counsel = login_with_csrf(username=document_seed["counsel_username"])
    ticket = request_json(
        session=counsel.data["session"],
        path="/api/v1/auth/ws-ticket/",
        method="POST",
        headers=auth_headers(access=counsel.data["access"]),
    )
    assert ticket.status == 200, response_summary(response=ticket)
    websocket = open_websocket(path=ticket.data["websocket_url"])

    try:
        presign = presign_document(session=counsel, matter_id=document_seed["matter_id"])
        assert presign.status == 201, response_summary(response=presign)
        document_id = presign.data["document"]["id"]
        upload_to_minio(upload=presign.data["upload"])
        request_json(
            session=counsel.data["session"],
            path=f"/api/v1/documents/{document_id}/complete/",
            method="POST",
            headers=auth_headers(access=counsel.data["access"]),
        )
        event = receive_websocket_json(sock=websocket)
    finally:
        websocket.close()

    assert event is not None, "No document upload status event received over WebSocket."
    assert event["event_type"] == "document.upload.status_changed"
    assert event["version"] == 1
    assert event["data"]["document_id"] == document_id
    assert event["data"]["status"] in {"verifying", "available"}
    assert "url" not in json.dumps(event)


def create_seed_data(*, run_id: str) -> dict[str, str]:
    from apps.accounts.tests.factories import UserFactory
    from apps.matters.models import ACCESS_LEVEL_VIEW
    from apps.matters.tests.factories import MatterAccessFactory, MatterFactory
    from apps.organizations.models import ROLE_LEGAL_ADMIN, ROLE_LEGAL_COUNSEL, ROLE_VIEWER
    from apps.organizations.tests.factories import OrganizationFactory

    organization = OrganizationFactory(name=f"INT-004 Organization {run_id}")
    other_organization = OrganizationFactory(name=f"INT-004 Other Organization {run_id}")
    counsel = make_member(
        organization=organization,
        role=ROLE_LEGAL_COUNSEL,
        username=f"int004-counsel-{run_id}@example.test",
    )
    viewer = make_member(
        organization=organization,
        role=ROLE_VIEWER,
        username=f"int004-viewer-{run_id}@example.test",
    )
    other_admin = make_member(
        organization=other_organization,
        role=ROLE_LEGAL_ADMIN,
        username=f"int004-other-{run_id}@example.test",
    )
    matter = MatterFactory(organization=organization, owner=counsel, created_by=counsel)
    MatterAccessFactory(
        matter=matter,
        membership=viewer,
        level=ACCESS_LEVEL_VIEW,
        granted_by=counsel,
    )
    UserFactory.reset_sequence()
    return {
        "organization_id": str(organization.id),
        "other_organization_id": str(other_organization.id),
        "matter_id": str(matter.id),
        "counsel_username": counsel.user.username,
        "viewer_username": viewer.user.username,
        "other_admin_username": other_admin.user.username,
    }


def make_member(*, organization, role: str, username: str):
    from apps.accounts.tests.factories import UserFactory
    from apps.organizations.tests.factories import MembershipFactory

    user = UserFactory(username=username, email=username)
    return MembershipFactory(user=user, organization=organization, role=role)


def cleanup_seed_data(*, seed: dict[str, str]) -> None:
    from apps.accounts.models import User
    from apps.activity.models import ActivityLog, IdempotencyRecord, OutboxEvent
    from apps.documents.models import Document
    from apps.matters.models import Matter, MatterAccess, MatterRelation
    from apps.organizations.models import Membership, Organization

    org_ids = [seed["organization_id"], seed["other_organization_id"]]
    matter_ids = [seed["matter_id"]]
    ActivityLog.objects.filter(organization_id__in=org_ids).delete()
    OutboxEvent.objects.filter(organization_id__in=org_ids).delete()
    IdempotencyRecord.objects.filter(organization_id__in=org_ids).delete()
    Document.objects.filter(organization_id__in=org_ids).delete()
    MatterAccess.objects.filter(organization_id__in=org_ids).delete()
    MatterRelation.objects.filter(organization_id__in=org_ids).delete()
    Matter.objects.filter(id__in=matter_ids).delete()
    Membership.objects.filter(organization_id__in=org_ids).delete()
    Organization.objects.filter(id__in=org_ids).delete()
    User.objects.filter(
        username__in=[
            seed["counsel_username"],
            seed["viewer_username"],
            seed["other_admin_username"],
        ]
    ).delete()


def login_with_csrf(*, username: str) -> HttpResult:
    session = new_http_session()
    bootstrap_csrf(session=session)
    return login(session=session, username=username)


def login_without_csrf(*, username: str) -> HttpResult:
    session = new_http_session()
    return login(session=session, username=username)


def presign_document(*, session: HttpResult, matter_id: str) -> HttpResult:
    return request_json(
        session=session.data["session"],
        path="/api/v1/documents/presign/",
        method="POST",
        payload=upload_payload(matter_id=matter_id),
        headers={
            **auth_headers(access=session.data["access"]),
            "Idempotency-Key": str(uuid.uuid4()),
        },
    )


def upload_payload(*, matter_id: str) -> dict:
    return {
        "matter_id": matter_id,
        "filename": "int-004-evidence.pdf",
        "content_type": "application/pdf",
        "size": len(UPLOAD_BYTES),
        "checksum_sha256": "",
        "description": "INT-004 direct upload evidence.",
    }


def upload_to_minio(*, upload: dict) -> None:
    response = open_presigned_minio_url(
        url=upload["url"],
        method=upload["method"],
        body=UPLOAD_BYTES,
        headers=upload["headers"],
    )
    assert response.status in {200, 204}
    response.read()


def download_from_minio(*, url: str) -> bytes:
    response = open_presigned_minio_url(url=url, method="GET", body=None, headers={})
    assert response.status == 200
    return response.read()


def open_presigned_minio_url(*, url: str, method: str, body: bytes | None, headers: dict):
    parsed = urlparse(url)
    endpoint = settings.MINIO_ENDPOINT
    internal_url = urlunparse(parsed._replace(netloc=endpoint))
    request = Request(internal_url, data=body, headers={**headers, "Host": parsed.netloc})
    request.method = method
    return urlopen(request, timeout=10)


def anonymous_minio_bucket_status() -> int:
    url = f"http://{settings.MINIO_ENDPOINT}/{settings.MINIO_BUCKET_DOCUMENTS}"
    try:
        response = urlopen(url, timeout=5)
        return response.status
    except HTTPError as error:
        return error.code


def assert_no_secret_leak(*, seed: dict[str, str], presigned_urls: list[str]) -> None:
    from apps.activity.models import ActivityLog, OutboxEvent

    activities = list(
        ActivityLog.objects.filter(organization_id=seed["organization_id"]).values(
            "before_values", "after_values", "metadata"
        )
    )
    outbox_events = list(
        OutboxEvent.objects.filter(organization_id=seed["organization_id"]).values("payload")
    )
    serialized = json.dumps([activities, outbox_events], sort_keys=True)
    for url in presigned_urls:
        assert url not in serialized
    assert "X-Amz-Signature" not in serialized


def new_http_session() -> HttpSession:
    cookies = CookieJar()
    return HttpSession(cookies=cookies, opener=build_opener(HTTPCookieProcessor(cookies)))


def bootstrap_csrf(*, session: HttpSession) -> None:
    request_json(session=session, path="/api/v1/auth/csrf/")


def login(*, session: HttpSession, username: str) -> HttpResult:
    result = request_json(
        session=session,
        path="/api/v1/auth/login/",
        method="POST",
        payload={"username": username, "password": TEST_PASSWORD},
        headers=csrf_headers(session=session),
    )
    if isinstance(result.data, dict):
        result.data["session"] = session
    return result


def request_json(
    *,
    session: HttpSession,
    path: str,
    method: str = "GET",
    payload: dict | None = None,
    headers: dict[str, str] | None = None,
) -> HttpResult:
    request = build_request(path=path, method=method, payload=payload, headers=headers)
    try:
        response = session.opener.open(request, timeout=10)
    except HTTPError as error:
        response = error
    body = response.read().decode()
    data = parse_json_body(body=body)
    status = getattr(response, "status", response.code)
    return HttpResult(body=body, data=data, headers=response.headers, status=status)


def build_request(
    *, path: str, method: str, payload: dict | None, headers: dict[str, str] | None
) -> Request:
    body = None
    request_headers = {"Accept": "application/json", **(headers or {})}
    if payload is not None:
        body = json.dumps(payload).encode()
        request_headers["Content-Type"] = "application/json"
    return Request(f"{API_BASE_URL}{path}", data=body, headers=request_headers, method=method)


def parse_json_body(*, body: str):
    if not body:
        return None
    try:
        return json.loads(body)
    except json.JSONDecodeError:
        return {"non_json_body": body[:200]}


def response_summary(*, response: HttpResult) -> str:
    return f"status={response.status} body={response.body[:500]}"


def auth_headers(*, access: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {access}"}


def csrf_headers(*, session: HttpSession) -> dict[str, str]:
    token = cookie_value(session=session, name=settings.CSRF_COOKIE_NAME)
    return {"X-CSRFToken": token or ""}


def cookie_value(*, session: HttpSession, name: str) -> str | None:
    for cookie in session.cookies:
        if cookie.name == name:
            return cookie.value
    return None


def open_websocket(*, path: str) -> socket.socket:
    parsed = urlparse(API_BASE_URL)
    host = parsed.hostname or "api"
    port = parsed.port or 80
    key = base64.b64encode(os.urandom(16)).decode()
    request = websocket_handshake_request(host=host, path=path, key=key)
    sock = socket.create_connection((host, port), timeout=10)
    sock.settimeout(10)
    sock.sendall(request.encode())
    response = sock.recv(4096).decode(errors="replace")
    assert int(response.split()[1]) == 101
    return sock


def websocket_handshake_request(*, host: str, path: str, key: str) -> str:
    return (
        f"GET {path} HTTP/1.1\r\n"
        f"Host: {host}\r\n"
        "Upgrade: websocket\r\n"
        "Connection: Upgrade\r\n"
        f"Sec-WebSocket-Key: {key}\r\n"
        "Sec-WebSocket-Version: 13\r\n"
        "Origin: http://localhost:5173\r\n"
        "\r\n"
    )


def receive_websocket_json(*, sock: socket.socket) -> dict | None:
    try:
        frame = read_websocket_frame(sock=sock)
    except TimeoutError:
        return None
    if frame is None:
        return None
    return json.loads(frame.decode())


def read_websocket_frame(*, sock: socket.socket) -> bytes | None:
    header = recv_exact(sock=sock, size=2)
    opcode = header[0] & 0x0F
    length = header[1] & 0x7F
    if opcode == 8:
        return None
    if length == 126:
        length = struct.unpack("!H", recv_exact(sock=sock, size=2))[0]
    elif length == 127:
        length = struct.unpack("!Q", recv_exact(sock=sock, size=8))[0]
    if header[1] & 0x80:
        mask = recv_exact(sock=sock, size=4)
        return unmask_payload(payload=recv_exact(sock=sock, size=length), mask=mask)
    return recv_exact(sock=sock, size=length)


def recv_exact(*, sock: socket.socket, size: int) -> bytes:
    chunks = []
    remaining = size
    while remaining:
        try:
            chunk = sock.recv(remaining)
        except TimeoutError as error:
            raise TimeoutError from error
        if not chunk:
            raise TimeoutError
        chunks.append(chunk)
        remaining -= len(chunk)
    return b"".join(chunks)


def unmask_payload(*, payload: bytes, mask: bytes) -> bytes:
    return bytes(byte ^ mask[index % 4] for index, byte in enumerate(payload))
