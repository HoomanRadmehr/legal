from __future__ import annotations

import base64
import json
import os
import socket
import uuid
from dataclasses import dataclass
from http.cookiejar import CookieJar
from urllib.error import HTTPError
from urllib.parse import urlparse
from urllib.request import HTTPCookieProcessor, Request, build_opener, urlopen

import pytest
from django.conf import settings
from django.core.management import call_command

API_BASE_URL = os.environ.get("INTEGRATION_API_BASE_URL", "http://api:8000")
PERSIAN_ACCEPT = "fa-IR, fa;q=0.9, en;q=0.8"
TEST_PASSWORD = "test-password"


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
def localization_seed(django_db_blocker):
    run_id = os.environ.get("INT007_RUN_ID", uuid.uuid4().hex[:8])
    with django_db_blocker.unblock():
        call_command("migrate", interactive=False, verbosity=0)
        seed = create_seed_data(run_id=run_id)

    yield seed


def test_persian_locale_auth_and_legal_dates_round_trip(localization_seed) -> None:
    session = new_http_session()
    bootstrap_csrf(session=session)
    csrf_failure = login_without_csrf(session=session, username=localization_seed["username"])
    login_response = login(session=session, username=localization_seed["username"])

    assert login_response.status == 200, login_response.body

    auth_headers = localized_auth_headers(access=login_response.data["access"])
    records = create_legal_records(
        session=session,
        auth_headers=auth_headers,
        assignee_id=localization_seed["membership_id"],
    )

    assert csrf_failure.status == 403
    assert csrf_failure.data["code"] == "csrf_failed"
    assert "refresh" not in login_response.data
    assert cookie_value(session=session, name=settings.JWT_REFRESH_COOKIE_NAME)
    assert login_response.data["user"]["preferred_language"] == "fa"
    assert_legal_date_responses(records=records)


def create_legal_records(
    *, session: HttpSession, auth_headers: dict[str, str], assignee_id: str
) -> dict[str, HttpResult]:
    contract = request_json(
        session=session,
        path="/api/v1/contracts/",
        method="POST",
        payload=contract_payload(),
        headers=auth_headers,
    )
    deadline = request_json(
        session=session,
        path="/api/v1/deadlines/",
        method="POST",
        payload=deadline_payload(
            matter_id=contract.data["id"],
            assignee_id=assignee_id,
        ),
        headers=auth_headers,
    )
    notice = request_json(
        session=session,
        path="/api/v1/notices/",
        method="POST",
        payload=notice_payload(),
        headers=auth_headers,
    )
    contract_reload = request_json(
        session=session,
        path=f"/api/v1/contracts/{contract.data['id']}/",
        headers=auth_headers,
    )
    return {
        "contract": contract,
        "deadline": deadline,
        "notice": notice,
        "contract_reload": contract_reload,
    }


def assert_legal_date_responses(*, records: dict[str, HttpResult]) -> None:
    contract = records["contract"]
    deadline = records["deadline"]
    notice = records["notice"]
    contract_reload = records["contract_reload"]

    assert contract.status == 201
    assert contract.data["status"] == "active"
    assert contract.data["effective_date"] == "2027-03-21"
    assert contract.data["expiration_date"] == "2027-07-14"
    assert contract_reload.data["effective_date"] == contract.data["effective_date"]
    assert deadline.status == 201
    assert deadline.data["status"] == "open"
    assert deadline.data["due_at"].startswith("2027-07-15T12:00:00")
    assert notice.status == 201
    assert notice.data["status"] == "active"
    assert notice.data["response_status"] == "pending"
    assert notice.data["received_date"] == "2027-03-21"
    assert notice.data["response_deadline"].startswith("2027-07-21T12:00:00")


def test_persian_error_websocket_and_minio_contracts(localization_seed) -> None:
    session = new_http_session()
    localized_missing = request_json(
        session=session,
        path="/api/v1/auth/me/",
        headers={"Accept-Language": PERSIAN_ACCEPT},
    )
    bootstrap_csrf(session=session)
    access = login(session=session, username=localization_seed["username"]).data["access"]
    ticket_response = request_json(
        session=session,
        path="/api/v1/auth/ws-ticket/",
        method="POST",
        headers=localized_auth_headers(access=access),
    )
    websocket_status = websocket_handshake_status(path=ticket_response.data["websocket_url"])
    minio_status = anonymous_minio_bucket_status()

    assert localized_missing.status == 401
    assert localized_missing.data["code"] == "authentication_required"
    assert localized_missing.data["message"] == "اعتبارنامه احراز هویت ارائه نشده است."
    assert ticket_response.status == 200
    assert access not in ticket_response.data["ticket"]
    assert access not in ticket_response.data["websocket_url"]
    assert websocket_status == 101
    assert minio_status in {403, 404}


def create_seed_data(*, run_id: str) -> dict[str, str]:
    from apps.accounts.models import LANGUAGE_PERSIAN
    from apps.accounts.tests.factories import UserFactory
    from apps.organizations.models import ROLE_LEGAL_ADMIN
    from apps.organizations.tests.factories import MembershipFactory, OrganizationFactory

    seed_id = f"{run_id}-{uuid.uuid4().hex[:8]}"
    organization = OrganizationFactory(name=f"INT-007 Organization {seed_id}")
    username = f"localized.{seed_id}@example.test"
    user = UserFactory(username=username, email=username, preferred_language=LANGUAGE_PERSIAN)
    membership = MembershipFactory(
        user=user,
        organization=organization,
        role=ROLE_LEGAL_ADMIN,
    )
    return {"membership_id": str(membership.id), "username": username}


def contract_payload() -> dict:
    return {
        "title": "قرارداد خدمات",
        "reference_code": "INT-007-CON",
        "status": "active",
        "priority": "normal",
        "description": "Jalali 1406-01-01 to 1406-04-23.",
        "contract_type": "vendor",
        "counterparty": "Localized Counterparty",
        "effective_date": "2027-03-21",
        "expiration_date": "2027-07-14",
        "renewal_date": "2027-06-14",
        "key_terms": {"calendar": "jalali"},
    }


def deadline_payload(*, matter_id: str, assignee_id: str) -> dict:
    return {
        "matter_id": matter_id,
        "title": "مهلت پاسخ",
        "description": "Jalali 1406-04-24 at 12:00.",
        "due_at": "2027-07-15T12:00:00Z",
        "assignee_id": assignee_id,
        "priority": "normal",
        "reminder_enabled": True,
    }


def notice_payload() -> dict:
    return {
        "title": "ابلاغیه فارسی",
        "reference_code": "INT-007-NOT",
        "status": "active",
        "priority": "normal",
        "description": "Jalali 1406-01-01 with 1406-04-30 response deadline.",
        "sender": "مرجع رسیدگی",
        "received_date": "2027-03-21",
        "response_deadline": "2027-07-21T12:00:00Z",
        "response_status": "pending",
        "related_matter_ids": [],
    }


def new_http_session() -> HttpSession:
    cookies = CookieJar()
    return HttpSession(cookies=cookies, opener=build_opener(HTTPCookieProcessor(cookies)))


def bootstrap_csrf(*, session: HttpSession) -> None:
    request_json(session=session, path="/api/v1/auth/csrf/")


def login(*, session: HttpSession, username: str) -> HttpResult:
    return request_json(
        session=session,
        path="/api/v1/auth/login/",
        method="POST",
        payload={"username": username, "password": TEST_PASSWORD},
        headers={**csrf_headers(session=session), "Accept-Language": PERSIAN_ACCEPT},
    )


def login_without_csrf(*, session: HttpSession, username: str) -> HttpResult:
    return request_json(
        session=session,
        path="/api/v1/auth/login/",
        method="POST",
        payload={"username": username, "password": TEST_PASSWORD},
        headers={"Accept-Language": PERSIAN_ACCEPT},
    )


def localized_auth_headers(*, access: str) -> dict[str, str]:
    return {"Accept-Language": PERSIAN_ACCEPT, "Authorization": f"Bearer {access}"}


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
        response = session.opener.open(request, timeout=8)
    except HTTPError as error:
        response = error
    body = response.read().decode()
    status = getattr(response, "status", response.code)
    return HttpResult(
        body=body,
        data=parse_json_body(body=body),
        headers=response.headers,
        status=status,
    )


def build_request(
    *,
    path: str,
    method: str,
    payload: dict | None,
    headers: dict[str, str] | None,
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
    return json.loads(body)


def csrf_headers(*, session: HttpSession) -> dict[str, str]:
    token = cookie_value(session=session, name=settings.CSRF_COOKIE_NAME)
    return {"X-CSRFToken": token or ""}


def cookie_value(*, session: HttpSession, name: str) -> str | None:
    for cookie in session.cookies:
        if cookie.name == name:
            return cookie.value
    return None


def websocket_handshake_status(*, path: str) -> int:
    parsed = urlparse(API_BASE_URL)
    host = parsed.hostname or "api"
    port = parsed.port or 80
    key = base64.b64encode(os.urandom(16)).decode()
    request = websocket_handshake_request(host=host, path=path, key=key)
    with socket.create_connection((host, port), timeout=8) as sock:
        sock.sendall(request.encode())
        response = sock.recv(4096).decode(errors="replace")
    return int(response.split()[1])


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


def anonymous_minio_bucket_status() -> int:
    url = f"http://{settings.MINIO_ENDPOINT}/{settings.MINIO_BUCKET_DOCUMENTS}"
    try:
        response = urlopen(url, timeout=5)
        return response.status
    except HTTPError as error:
        return error.code
