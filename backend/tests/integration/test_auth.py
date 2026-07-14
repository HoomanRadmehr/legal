from __future__ import annotations

import base64
import json
import os
import socket
from dataclasses import dataclass
from http.cookiejar import CookieJar
from urllib.error import HTTPError
from urllib.parse import urlparse
from urllib.request import HTTPCookieProcessor, Request, build_opener, urlopen

import pytest
from django.conf import settings
from django.core.management import call_command

API_BASE_URL = os.environ.get("INTEGRATION_API_BASE_URL", "http://api:8000")
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
def seeded_roles(django_db_blocker):
    run_id = os.environ.get("INT001_RUN_ID", "int001")
    with django_db_blocker.unblock():
        call_command("migrate", interactive=False, verbosity=0)
        roles = create_seed_roles(run_id=run_id)
        other_matter = create_cross_org_matter(run_id=run_id)

    yield {"roles": roles, "other_matter_id": str(other_matter.id)}

    with django_db_blocker.unblock():
        cleanup_seed_data(run_id=run_id)


def test_all_roles_authenticate_and_return_current_membership(seeded_roles) -> None:
    for role_name, credentials in seeded_roles["roles"].items():
        session = new_http_session()
        bootstrap_csrf(session=session)
        login_response = login(session=session, username=credentials["username"])
        access = login_response.data["access"]
        refresh_cookie = cookie_value(session=session, name=settings.JWT_REFRESH_COOKIE_NAME)
        me_response = request_json(
            session=session,
            path="/api/v1/auth/me/",
            headers={"Authorization": f"Bearer {access}"},
        )

        assert login_response.status == 200
        assert refresh_cookie
        assert "refresh" not in login_response.data
        assert set_cookie_contains(login_response.headers, "HttpOnly")
        assert me_response.status == 200
        assert me_response.data["membership"]["role"] == role_name


def test_csrf_refresh_cookie_rotation_and_logout(seeded_roles) -> None:
    username = seeded_roles["roles"]["legal_admin"]["username"]
    session = new_http_session()
    bootstrap_csrf(session=session)
    login(session=session, username=username)
    old_refresh = cookie_value(session=session, name=settings.JWT_REFRESH_COOKIE_NAME)

    missing_csrf = request_json(session=session, path="/api/v1/auth/refresh/", method="POST")
    refresh_response = request_json(
        session=session,
        path="/api/v1/auth/refresh/",
        method="POST",
        headers=csrf_headers(session=session),
    )
    new_refresh = cookie_value(session=session, name=settings.JWT_REFRESH_COOKIE_NAME)
    replay_response = replay_refresh_with_cookie(refresh_cookie=old_refresh)
    first_logout = request_json(
        session=session,
        path="/api/v1/auth/logout/",
        method="POST",
        headers=csrf_headers(session=session),
    )
    second_logout = request_json(
        session=session,
        path="/api/v1/auth/logout/",
        method="POST",
        headers=csrf_headers(session=session),
    )

    assert missing_csrf.status == 403
    assert missing_csrf.data["code"] == "csrf_failed"
    assert refresh_response.status == 200
    assert new_refresh and new_refresh != old_refresh
    assert replay_response.status == 401
    assert replay_response.data["code"] == "refresh_invalid"
    assert first_logout.status == 204
    assert second_logout.status == 204


def test_invalid_login_uses_stable_non_enumerating_error(seeded_roles) -> None:
    username = seeded_roles["roles"]["legal_counsel"]["username"]
    session = new_http_session()
    bootstrap_csrf(session=session)

    missing_response = login(session=session, username="missing-int001@example.test")
    wrong_password_response = login(
        session=session,
        username=username,
        password="wrong-password",
    )

    assert missing_response.status == 401
    assert wrong_password_response.status == 401
    assert missing_response.data["code"] == "invalid_credentials"
    assert wrong_password_response.data == missing_response.data


def test_websocket_ticket_connects_to_published_one_time_endpoint(seeded_roles) -> None:
    username = seeded_roles["roles"]["legal_admin"]["username"]
    session = new_http_session()
    bootstrap_csrf(session=session)
    login_response = login(session=session, username=username)
    access = login_response.data["access"]
    ticket_response = request_json(
        session=session,
        path="/api/v1/auth/ws-ticket/",
        method="POST",
        headers={"Authorization": f"Bearer {access}"},
    )
    websocket_url = ticket_response.data["websocket_url"]
    handshake_status = websocket_handshake_status(path=websocket_url)

    assert ticket_response.status == 200
    assert len(ticket_response.data["ticket"]) >= 32
    assert access not in ticket_response.data["ticket"]
    assert access not in websocket_url
    assert handshake_status == 101


def test_cross_org_direct_matter_url_uses_safe_not_found(seeded_roles) -> None:
    username = seeded_roles["roles"]["legal_admin"]["username"]
    session = new_http_session()
    bootstrap_csrf(session=session)
    login_response = login(session=session, username=username)
    access = login_response.data["access"]
    response = request_json(
        session=session,
        path=f"/api/v1/matters/{seeded_roles['other_matter_id']}/",
        headers={"Authorization": f"Bearer {access}", "Accept": "application/json"},
    )

    assert response.status == 404
    assert response.data["code"] == "not_found"
    assert "Other organization" not in response.body


def test_minio_document_bucket_is_not_public() -> None:
    url = f"http://{settings.MINIO_ENDPOINT}/{settings.MINIO_BUCKET_DOCUMENTS}"

    try:
        response = urlopen(url, timeout=5)
        status = response.status
    except HTTPError as error:
        status = error.code

    assert status in {403, 404}


def create_seed_roles(*, run_id: str) -> dict[str, dict[str, str]]:
    from apps.accounts.tests.factories import UserFactory
    from apps.organizations.models import (
        ROLE_LEGAL_ADMIN,
        ROLE_LEGAL_COUNSEL,
        ROLE_LEGAL_MANAGER,
        ROLE_VIEWER,
    )
    from apps.organizations.tests.factories import MembershipFactory, OrganizationFactory

    organization = OrganizationFactory(name=f"INT-001 Organization {run_id}")
    roles = {}
    for role in (ROLE_LEGAL_ADMIN, ROLE_LEGAL_MANAGER, ROLE_LEGAL_COUNSEL, ROLE_VIEWER):
        username = f"{role}.{run_id}@example.test"
        user = UserFactory(username=username, email=username)
        MembershipFactory(user=user, organization=organization, role=role)
        roles[role] = {"username": username}
    return roles


def create_cross_org_matter(*, run_id: str):
    from apps.matters.tests.factories import MatterFactory
    from apps.organizations.tests.factories import MembershipFactory, OrganizationFactory

    organization = OrganizationFactory(name=f"INT-001 Other organization {run_id}")
    owner = MembershipFactory(organization=organization)
    return MatterFactory(
        organization=organization,
        owner=owner,
        created_by=owner,
        title=f"Other organization hidden matter {run_id}",
    )


def cleanup_seed_data(*, run_id: str) -> None:
    from apps.accounts.models import User
    from apps.organizations.models import Organization

    Organization.objects.filter(name__contains="INT-001").delete()
    User.objects.filter(username__contains=f".{run_id}@example.test").delete()


def new_http_session() -> HttpSession:
    cookies = CookieJar()
    return HttpSession(cookies=cookies, opener=build_opener(HTTPCookieProcessor(cookies)))


def bootstrap_csrf(*, session: HttpSession) -> None:
    request_json(session=session, path="/api/v1/auth/csrf/")


def login(
    *,
    session: HttpSession,
    username: str,
    password: str = TEST_PASSWORD,
) -> HttpResult:
    return request_json(
        session=session,
        path="/api/v1/auth/login/",
        method="POST",
        payload={"username": username, "password": password},
        headers=csrf_headers(session=session),
    )


def replay_refresh_with_cookie(*, refresh_cookie: str | None) -> HttpResult:
    session = new_http_session()
    bootstrap_csrf(session=session)
    csrf = cookie_value(session=session, name=settings.CSRF_COOKIE_NAME)
    cookie_header = (
        f"{settings.CSRF_COOKIE_NAME}={csrf}; {settings.JWT_REFRESH_COOKIE_NAME}={refresh_cookie}"
    )
    return request_json(
        session=session,
        path="/api/v1/auth/refresh/",
        method="POST",
        headers={"Cookie": cookie_header, "X-CSRFToken": csrf or ""},
    )


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
    data = parse_json_body(body=body)
    status = getattr(response, "status", response.code)
    return HttpResult(body=body, data=data, headers=response.headers, status=status)


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
    try:
        return json.loads(body)
    except json.JSONDecodeError:
        return {"non_json_body": body[:200]}


def csrf_headers(*, session: HttpSession) -> dict[str, str]:
    token = cookie_value(session=session, name=settings.CSRF_COOKIE_NAME)
    return {"X-CSRFToken": token or ""}


def cookie_value(*, session: HttpSession, name: str) -> str | None:
    for cookie in session.cookies:
        if cookie.name == name:
            return cookie.value
    return None


def set_cookie_contains(headers, expected: str) -> bool:
    for header in headers.get_all("Set-Cookie", []):
        if expected.lower() in header.lower():
            return True
    return False


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
