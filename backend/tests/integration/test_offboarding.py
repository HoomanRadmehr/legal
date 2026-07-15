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


@dataclass(frozen=True)
class AuthenticatedSession:
    access: str
    session: HttpSession


@pytest.fixture(scope="module")
def seeded_offboarding(django_db_blocker):
    run_id = os.environ.get("INT006_RUN_ID", "int006")
    with django_db_blocker.unblock():
        call_command("migrate", interactive=False, verbosity=0)
        workspace = create_workspace(run_id=run_id)

    yield workspace

    with django_db_blocker.unblock():
        cleanup_workspace(run_id=run_id)


def test_admin_preview_is_read_only(seeded_offboarding) -> None:
    context = seeded_offboarding["preview"]
    admin = authenticated_session(username=context["users"]["admin"])

    preview = preview_offboarding(session=admin, context=context)

    assert preview.status == 200
    assert preview.data["counts"] == expected_counts()
    assert preview.data["fingerprint"]
    assert_offboarding_state(context=context, replacement_applied=False)


def test_execute_is_atomic_and_idempotent(seeded_offboarding) -> None:
    context = seeded_offboarding["execute"]
    admin = authenticated_session(username=context["users"]["admin"])
    preview = preview_offboarding(session=admin, context=context).data
    payload = execute_payload(context=context, preview=preview)
    key = "11111111-1111-1111-1111-111111111111"

    first = execute_offboarding(session=admin, payload=payload, idempotency_key=key)
    second = execute_offboarding(session=admin, payload=payload, idempotency_key=key)
    retrieved = request_json(
        session=admin.session,
        path=f"/api/v1/offboarding/{first.data['id']}/",
        headers=auth_headers(access=admin.access),
    )

    assert first.status == 200
    assert second.status == 200
    assert second.data == first.data
    assert retrieved.status == 200
    assert retrieved.data["id"] == first.data["id"]
    assert_offboarding_state(context=context, replacement_applied=True)
    assert_offboarding_run_count(departing_id=context["departing_id"], expected=1)


def test_stale_preview_rolls_back_and_returns_conflict(seeded_offboarding) -> None:
    context = seeded_offboarding["stale"]
    admin = authenticated_session(username=context["users"]["admin"])
    preview = preview_offboarding(session=admin, context=context).data

    add_departing_task(context=context)
    response = execute_offboarding(
        session=admin,
        payload=execute_payload(context=context, preview=preview),
        idempotency_key="22222222-2222-2222-2222-222222222222",
    )

    assert response.status == 409
    assert response.data["code"] == "offboarding_preview_stale"
    assert_offboarding_state(context=context, replacement_applied=False)
    assert_offboarding_run_count(departing_id=context["departing_id"], expected=0)


def test_non_admin_denied_and_cross_org_run_hidden(seeded_offboarding) -> None:
    context = seeded_offboarding["denial"]
    admin = authenticated_session(username=context["users"]["admin"])
    manager = authenticated_session(username=context["users"]["manager"])
    preview = preview_offboarding(session=admin, context=context).data

    denied_preview = preview_offboarding(session=manager, context=context)
    denied_execute = execute_offboarding(
        session=manager,
        payload=execute_payload(context=context, preview=preview),
        idempotency_key="33333333-3333-3333-3333-333333333333",
    )
    hidden_run = request_json(
        session=manager.session,
        path=f"/api/v1/offboarding/{seeded_offboarding['other_run_id']}/",
        headers=auth_headers(access=manager.access),
    )

    assert denied_preview.status == 403
    assert "code" in denied_preview.data
    assert denied_execute.status == 403
    assert hidden_run.status == 404
    assert_offboarding_state(context=context, replacement_applied=False)


def test_auth_websocket_and_minio_contracts(seeded_offboarding) -> None:
    admin = authenticated_session(username=seeded_offboarding["preview"]["users"]["admin"])
    ticket = request_json(
        session=admin.session,
        path="/api/v1/auth/ws-ticket/",
        method="POST",
        headers=auth_headers(access=admin.access),
    )

    assert ticket.status == 200
    assert admin.access not in ticket.data["ticket"]
    assert admin.access not in ticket.data["websocket_url"]
    assert websocket_handshake_status(path=ticket.data["websocket_url"]) == 101
    assert minio_bucket_status() in {403, 404}


def create_workspace(*, run_id: str) -> dict:
    deps = workspace_dependencies()
    organization = deps["OrganizationFactory"](name=f"INT-006 Organization {run_id}")
    contexts = {
        name: create_context(deps=deps, organization=organization, run_id=run_id, name=name)
        for name in ("preview", "execute", "stale", "denial")
    }
    other_run = create_other_org_run(deps=deps, run_id=run_id)
    return {**contexts, "other_run_id": str(other_run.id)}


def create_context(*, deps: dict, organization, run_id: str, name: str) -> dict:
    members = create_members(
        deps=deps,
        organization=organization,
        prefix=f"{name}.{run_id}",
    )
    work = create_work(deps=deps, members=members, organization=organization)
    return context_payload(members=members, work=work)


def create_members(*, deps: dict, organization, prefix: str) -> dict:
    return {
        "admin": create_member(deps, organization, deps["ROLE_LEGAL_ADMIN"], f"admin.{prefix}"),
        "manager": create_member(
            deps,
            organization,
            deps["ROLE_LEGAL_MANAGER"],
            f"manager.{prefix}",
        ),
        "departing": create_member(
            deps,
            organization,
            deps["ROLE_LEGAL_COUNSEL"],
            f"departing.{prefix}",
        ),
        "replacement": create_member(
            deps,
            organization,
            deps["ROLE_LEGAL_MANAGER"],
            f"replacement.{prefix}",
        ),
    }


def create_member(deps: dict, organization, role: str, username: str):
    email = f"{username}@example.test"
    user = deps["UserFactory"](username=email, email=email)
    return deps["MembershipFactory"](organization=organization, role=role, user=user)


def create_work(*, deps: dict, members: dict, organization) -> dict:
    matter = deps["MatterFactory"](
        organization=organization,
        owner=members["departing"],
        created_by=members["admin"],
    )
    task = deps["TaskFactory"](
        organization=organization,
        matter=matter,
        assignee=members["departing"],
    )
    deadline = deps["DeadlineFactory"](
        organization=organization,
        matter=matter,
        assignee=members["departing"],
    )
    grant = deps["MatterAccessFactory"](
        organization=organization,
        matter=matter,
        membership=members["departing"],
        granted_by=members["admin"],
    )
    return {"deadline": deadline, "grant": grant, "matter": matter, "task": task}


def create_other_org_run(*, deps: dict, run_id: str):
    organization = deps["OrganizationFactory"](name=f"INT-006 Other Organization {run_id}")
    context = create_context(deps=deps, organization=organization, run_id=run_id, name="other")
    preview = deps["preview_offboarding"](
        actor=membership_by_id(context["admin_id"]).user,
        data=preview_payload(context=context),
    )
    status_code, body = deps["execute_offboarding"](
        actor=membership_by_id(context["admin_id"]).user,
        data=execute_payload(context=context, preview=preview),
        idempotency_key="44444444-4444-4444-4444-444444444444",
    )
    assert status_code == 200
    return deps["OffboardingRun"].objects.get(id=body["id"])


def context_payload(*, members: dict, work: dict) -> dict:
    return {
        "admin_id": str(members["admin"].id),
        "departing_id": str(members["departing"].id),
        "replacement_id": str(members["replacement"].id),
        "matter_id": str(work["matter"].id),
        "task_id": str(work["task"].id),
        "deadline_id": str(work["deadline"].id),
        "grant_id": str(work["grant"].id),
        "users": {name: member.user.username for name, member in members.items()},
    }


def workspace_dependencies() -> dict:
    from apps.accounts.tests.factories import UserFactory
    from apps.deadlines.tests.factories import DeadlineFactory
    from apps.matters.tests.factories import MatterAccessFactory, MatterFactory
    from apps.offboarding.models import OffboardingRun
    from apps.offboarding.services import execute_offboarding, preview_offboarding
    from apps.organizations.models import ROLE_LEGAL_ADMIN, ROLE_LEGAL_COUNSEL, ROLE_LEGAL_MANAGER
    from apps.organizations.tests.factories import MembershipFactory, OrganizationFactory
    from apps.tasks.tests.factories import TaskFactory

    return {
        "DeadlineFactory": DeadlineFactory,
        "MatterAccessFactory": MatterAccessFactory,
        "MatterFactory": MatterFactory,
        "MembershipFactory": MembershipFactory,
        "OffboardingRun": OffboardingRun,
        "OrganizationFactory": OrganizationFactory,
        "ROLE_LEGAL_ADMIN": ROLE_LEGAL_ADMIN,
        "ROLE_LEGAL_COUNSEL": ROLE_LEGAL_COUNSEL,
        "ROLE_LEGAL_MANAGER": ROLE_LEGAL_MANAGER,
        "TaskFactory": TaskFactory,
        "UserFactory": UserFactory,
        "execute_offboarding": execute_offboarding,
        "preview_offboarding": preview_offboarding,
    }


def preview_payload(*, context: dict) -> dict:
    return {
        "departing_membership_id": context["departing_id"],
        "replacement_membership_id": context["replacement_id"],
    }


def execute_payload(*, context: dict, preview: dict) -> dict:
    return {
        **preview_payload(context=context),
        "preview_fingerprint": preview["fingerprint"],
        "confirmation": "OFFBOARD",
    }


def preview_offboarding(*, session: AuthenticatedSession, context: dict) -> HttpResult:
    return request_json(
        session=session.session,
        path="/api/v1/offboarding/preview/",
        method="POST",
        payload=preview_payload(context=context),
        headers=auth_headers(access=session.access),
    )


def execute_offboarding(
    *,
    session: AuthenticatedSession,
    payload: dict,
    idempotency_key: str,
) -> HttpResult:
    headers = {"Idempotency-Key": idempotency_key, **auth_headers(access=session.access)}
    return request_json(
        session=session.session,
        path="/api/v1/offboarding/execute/",
        method="POST",
        payload=payload,
        headers=headers,
    )


def add_departing_task(*, context: dict) -> None:
    from apps.tasks.tests.factories import TaskFactory

    matter = matter_by_id(context["matter_id"])
    departing = membership_by_id(context["departing_id"])
    TaskFactory(organization=matter.organization, matter=matter, assignee=departing)


def expected_counts() -> dict[str, int]:
    return {
        "active_access_grants": 1,
        "open_deadlines": 1,
        "open_tasks": 1,
        "owned_matters": 1,
    }


def assert_offboarding_state(*, context: dict, replacement_applied: bool) -> None:
    from apps.organizations.models import STATUS_ACTIVE, STATUS_OFFBOARDED

    departing = membership_by_id(context["departing_id"])
    replacement_id = context["replacement_id"]
    expected_member_status = STATUS_OFFBOARDED if replacement_applied else STATUS_ACTIVE
    expected_owner_id = replacement_id if replacement_applied else context["departing_id"]

    assert str(departing.status) == expected_member_status
    assert str(matter_by_id(context["matter_id"]).owner_id) == expected_owner_id
    assert str(task_by_id(context["task_id"]).assignee_id) == expected_owner_id
    assert str(deadline_by_id(context["deadline_id"]).assignee_id) == expected_owner_id
    assert (grant_by_id(context["grant_id"]).revoked_at is not None) is replacement_applied


def assert_offboarding_run_count(*, departing_id: str, expected: int) -> None:
    from apps.offboarding.models import OffboardingRun

    count = OffboardingRun.objects.filter(departing_membership_id=departing_id).count()
    assert count == expected


def authenticated_session(*, username: str) -> AuthenticatedSession:
    session = new_http_session()
    bootstrap_csrf(session=session)
    login_response = login(session=session, username=username)
    assert login_response.status == 200
    assert cookie_value(session=session, name=settings.JWT_REFRESH_COOKIE_NAME)
    return AuthenticatedSession(access=login_response.data["access"], session=session)


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
        headers=csrf_headers(session=session),
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
    try:
        return json.loads(body)
    except json.JSONDecodeError:
        return {"non_json_body": body[:200]}


def csrf_headers(*, session: HttpSession) -> dict[str, str]:
    token = cookie_value(session=session, name=settings.CSRF_COOKIE_NAME)
    return {"X-CSRFToken": token or ""}


def auth_headers(*, access: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {access}"}


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


def minio_bucket_status() -> int:
    url = f"http://{settings.MINIO_ENDPOINT}/{settings.MINIO_BUCKET_DOCUMENTS}"
    try:
        response = urlopen(url, timeout=5)
        return response.status
    except HTTPError as error:
        return error.code


def membership_by_id(membership_id: str):
    from apps.organizations.models import Membership

    return Membership.objects.get(id=membership_id)


def matter_by_id(matter_id: str):
    from apps.matters.models import Matter

    return Matter.objects.get(id=matter_id)


def task_by_id(task_id: str):
    from apps.tasks.models import Task

    return Task.objects.get(id=task_id)


def deadline_by_id(deadline_id: str):
    from apps.deadlines.models import Deadline

    return Deadline.objects.get(id=deadline_id)


def grant_by_id(grant_id: str):
    from apps.matters.models import MatterAccess

    return MatterAccess.objects.get(id=grant_id)


def cleanup_workspace(*, run_id: str) -> None:
    from apps.accounts.models import User
    from apps.organizations.models import Organization

    Organization.objects.filter(name__contains=f"INT-006 Organization {run_id}").delete()
    Organization.objects.filter(name__contains=f"INT-006 Other Organization {run_id}").delete()
    User.objects.filter(username__contains=f".{run_id}@example.test").delete()
