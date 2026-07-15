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
def seeded_workspace(django_db_blocker):
    run_id = os.environ.get("INT005_RUN_ID", "int005")
    with django_db_blocker.unblock():
        call_command("migrate", interactive=False, verbosity=0)
        workspace = create_workspace(run_id=run_id)

    yield workspace

    with django_db_blocker.unblock():
        cleanup_workspace(run_id=run_id)


def test_notifications_preferences_delivery_and_websocket(seeded_workspace) -> None:
    counsel = authenticated_session(username=seeded_workspace["users"]["counsel"])
    admin = authenticated_session(username=seeded_workspace["users"]["admin"])

    assert_notification_rest_contract(counsel=counsel, workspace=seeded_workspace)
    assert_delivery_contract(workspace=seeded_workspace)
    assert_websocket_ticket_contract(admin=admin)


def test_activity_is_read_only_redacted_and_permission_scoped(seeded_workspace) -> None:
    admin = authenticated_session(username=seeded_workspace["users"]["admin"])
    counsel = authenticated_session(username=seeded_workspace["users"]["counsel"])
    viewer = authenticated_session(username=seeded_workspace["users"]["viewer"])

    admin_activity = activity_ids_for(session=admin)
    counsel_activity = request_json(
        session=counsel.session,
        path="/api/v1/activity/",
        headers=auth_headers(access=counsel.access),
    )
    viewer_activity = activity_ids_for(session=viewer)
    mutate_activity = request_json(
        session=admin.session,
        path="/api/v1/activity/",
        method="POST",
        payload={"action": "case.created"},
        headers=auth_headers(access=admin.access),
    )
    hidden_timeline = request_json(
        session=viewer.session,
        path=f"/api/v1/matters/{seeded_workspace['hidden_matter_id']}/timeline/",
        headers=auth_headers(access=viewer.access),
    )

    assert seeded_workspace["hidden_activity_id"] in admin_activity
    assert activity_ids(counsel_activity.data) == [seeded_workspace["counsel_activity_id"]]
    assert viewer_activity == [seeded_workspace["viewer_activity_id"]]
    assert "password" not in counsel_activity.body
    assert "document_body" not in counsel_activity.body
    assert "presigned" not in counsel_activity.body
    assert mutate_activity.status == 405
    assert hidden_timeline.status == 404


def test_dashboard_counts_match_visible_rest_lists(seeded_workspace) -> None:
    for role in ("admin", "counsel", "viewer"):
        session = authenticated_session(username=seeded_workspace["users"][role])
        dashboard = request_json(
            session=session.session,
            path="/api/v1/dashboard/",
            headers=auth_headers(access=session.access),
        )
        case_list = request_json(
            session=session.session,
            path="/api/v1/cases/",
            headers=auth_headers(access=session.access),
        )
        task_list = request_json(
            session=session.session,
            path="/api/v1/tasks/?view=assigned_to_me",
            headers=auth_headers(access=session.access),
        )

        assert dashboard.status == 200
        assert dashboard.data["cases"]["total"] == case_list.data["count"]
        assert dashboard.data["tasks"]["assigned_to_me"] == task_list.data["count"]
        if role in {"counsel", "viewer"}:
            assert seeded_workspace["hidden_matter_id"] not in dashboard.body


def test_minio_document_bucket_remains_private() -> None:
    url = f"http://{settings.MINIO_ENDPOINT}/{settings.MINIO_BUCKET_DOCUMENTS}"

    try:
        response = urlopen(url, timeout=5)
        status = response.status
    except HTTPError as error:
        status = error.code

    assert status in {403, 404}


@dataclass(frozen=True)
class AuthenticatedSession:
    access: str
    session: HttpSession


def authenticated_session(*, username: str) -> AuthenticatedSession:
    session = new_http_session()
    bootstrap_csrf(session=session)
    login_response = login(session=session, username=username)
    assert login_response.status == 200
    assert cookie_value(session=session, name=settings.JWT_REFRESH_COOKIE_NAME)
    return AuthenticatedSession(access=login_response.data["access"], session=session)


def create_workspace(*, run_id: str) -> dict:
    deps = workspace_dependencies()
    organization = deps["OrganizationFactory"](name=f"INT-005 Organization {run_id}")
    members = create_workspace_members(deps=deps, organization=organization, run_id=run_id)
    cases = create_workspace_cases(deps=deps, members=members, organization=organization)
    create_workspace_tasks(deps=deps, cases=cases, members=members, organization=organization)
    logs = create_activity_logs(
        action=deps["ACTION_CASE_CREATED"],
        admin=members["admin"],
        counsel=members["counsel"],
        counsel_case=cases["counsel"],
        hidden_case=cases["hidden"],
        organization=organization,
        viewer_case=cases["viewer"],
        activity_model=deps["ActivityLog"],
    )
    notifications = create_workspace_notifications(
        cases=cases,
        deps=deps,
        members=members,
        run_id=run_id,
    )
    return workspace_payload(
        cases=cases,
        logs=logs,
        members=members,
        notifications=notifications,
    )


def assert_notification_rest_contract(*, counsel: AuthenticatedSession, workspace: dict) -> None:
    preferences = request_json(
        session=counsel.session,
        path="/api/v1/notification-preferences/",
        headers=auth_headers(access=counsel.access),
    )
    notifications = request_json(
        session=counsel.session,
        path="/api/v1/notifications/",
        headers=auth_headers(access=counsel.access),
    )
    mark_other_read = request_json(
        session=counsel.session,
        path=f"/api/v1/notifications/{workspace['admin_notification_id']}/read/",
        method="PATCH",
        headers=auth_headers(access=counsel.access),
    )
    assert preferences.status == 200
    assert preference_enabled(preferences.data, "email") is False
    assert preference_enabled(preferences.data, "sms") is True
    assert notifications.status == 200
    assert notification_ids(notifications.data) == [workspace["counsel_notification_id"]]
    assert "token" not in notifications.body
    assert "presigned" not in notifications.body
    assert mark_other_read.status == 404


def assert_delivery_contract(*, workspace: dict) -> None:
    assert workspace["counsel_deliveries"] == {
        "email": ("skipped", "channel_disabled"),
        "in_app": ("sent", ""),
        "push": ("skipped", "channel_disabled"),
        "sms": ("skipped", "provider_unconfigured"),
    }
    assert workspace["admin_email_delivery"] == ("sent", "")
    assert workspace["duplicate_delivery_count"] == 4


def assert_websocket_ticket_contract(*, admin: AuthenticatedSession) -> None:
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


def workspace_dependencies() -> dict:
    from apps.accounts.tests.factories import UserFactory
    from apps.activity.models import ACTION_CASE_CREATED, ActivityLog
    from apps.cases.tests.factories import LegalCaseFactory
    from apps.matters.tests.factories import MatterAccessFactory
    from apps.notifications.models import CHANNEL_EMAIL, CHANNEL_SMS, EVENT_NOTIFICATION_CREATED
    from apps.notifications.services import create_notification, send_delivery
    from apps.organizations.models import ROLE_LEGAL_ADMIN, ROLE_LEGAL_COUNSEL, ROLE_VIEWER
    from apps.organizations.tests.factories import MembershipFactory, OrganizationFactory
    from apps.tasks.tests.factories import TaskFactory

    return {
        "ACTION_CASE_CREATED": ACTION_CASE_CREATED,
        "ActivityLog": ActivityLog,
        "CHANNEL_EMAIL": CHANNEL_EMAIL,
        "CHANNEL_SMS": CHANNEL_SMS,
        "EVENT_NOTIFICATION_CREATED": EVENT_NOTIFICATION_CREATED,
        "LegalCaseFactory": LegalCaseFactory,
        "MatterAccessFactory": MatterAccessFactory,
        "MembershipFactory": MembershipFactory,
        "OrganizationFactory": OrganizationFactory,
        "ROLE_LEGAL_ADMIN": ROLE_LEGAL_ADMIN,
        "ROLE_LEGAL_COUNSEL": ROLE_LEGAL_COUNSEL,
        "ROLE_VIEWER": ROLE_VIEWER,
        "TaskFactory": TaskFactory,
        "UserFactory": UserFactory,
        "create_notification": create_notification,
        "send_delivery": send_delivery,
    }


def create_workspace_members(*, deps: dict, organization, run_id: str) -> dict:
    return {
        "admin": create_member(
            organization=organization,
            role=deps["ROLE_LEGAL_ADMIN"],
            run_id=run_id,
            slug="admin",
            user_factory=deps["UserFactory"],
            membership_factory=deps["MembershipFactory"],
        ),
        "counsel": create_member(
            organization=organization,
            role=deps["ROLE_LEGAL_COUNSEL"],
            run_id=run_id,
            slug="counsel",
            user_factory=deps["UserFactory"],
            membership_factory=deps["MembershipFactory"],
        ),
        "viewer": create_member(
            organization=organization,
            role=deps["ROLE_VIEWER"],
            run_id=run_id,
            slug="viewer",
            user_factory=deps["UserFactory"],
            membership_factory=deps["MembershipFactory"],
        ),
        "hidden": create_member(
            organization=organization,
            role=deps["ROLE_LEGAL_COUNSEL"],
            run_id=run_id,
            slug="hidden",
            user_factory=deps["UserFactory"],
            membership_factory=deps["MembershipFactory"],
        ),
    }


def create_workspace_cases(*, deps: dict, members: dict, organization) -> dict:
    counsel_case = deps["LegalCaseFactory"](
        matter__organization=organization,
        matter__owner=members["counsel"],
    )
    hidden_case = deps["LegalCaseFactory"](
        matter__organization=organization,
        matter__owner=members["hidden"],
    )
    viewer_case = deps["LegalCaseFactory"](
        matter__organization=organization,
        matter__owner=members["hidden"],
    )
    deps["MatterAccessFactory"](
        matter=viewer_case.matter,
        membership=members["viewer"],
        granted_by=members["admin"],
    )
    return {"counsel": counsel_case, "hidden": hidden_case, "viewer": viewer_case}


def create_workspace_tasks(*, deps: dict, cases: dict, members: dict, organization) -> None:
    deps["TaskFactory"](
        organization=organization,
        matter=cases["counsel"].matter,
        assignee=members["counsel"],
    )
    deps["TaskFactory"](
        organization=organization,
        matter=cases["viewer"].matter,
        assignee=members["viewer"],
    )


def create_workspace_notifications(*, cases: dict, deps: dict, members: dict, run_id: str) -> dict:
    create_disabled_preferences(
        event_type=deps["EVENT_NOTIFICATION_CREATED"],
        member=members["counsel"],
        channel_email=deps["CHANNEL_EMAIL"],
        channel_sms=deps["CHANNEL_SMS"],
    )
    counsel_notification = create_seed_notification(
        create_notification=deps["create_notification"],
        event_type=deps["EVENT_NOTIFICATION_CREATED"],
        matter_id=cases["counsel"].matter_id,
        recipient=members["counsel"],
        run_id=run_id,
        slug="counsel",
    )
    admin_notification = create_seed_notification(
        create_notification=deps["create_notification"],
        event_type=deps["EVENT_NOTIFICATION_CREATED"],
        matter_id=None,
        recipient=members["admin"],
        run_id=run_id,
        slug="admin",
    )
    send_pending_deliveries(notification=counsel_notification, send_delivery=deps["send_delivery"])
    send_pending_deliveries(notification=admin_notification, send_delivery=deps["send_delivery"])
    return {
        "admin": admin_notification,
        "counsel": counsel_notification,
        "duplicate_delivery_count": attempt_duplicate_notification(
            create_notification=deps["create_notification"],
            event_type=deps["EVENT_NOTIFICATION_CREATED"],
            recipient=members["counsel"],
            run_id=run_id,
        ),
    }


def create_seed_notification(
    *,
    create_notification,
    event_type,
    matter_id,
    recipient,
    run_id,
    slug,
):
    data = {"matter_id": matter_id, "token": "secret"} if matter_id else {"token": "secret"}
    return create_notification(
        recipient=recipient,
        event_type=event_type,
        title=f"INT-005 {slug} notification",
        data=data,
        dedupe_key=f"{run_id}:{slug}",
    )


def workspace_payload(*, cases: dict, logs: dict, members: dict, notifications: dict) -> dict:
    return {
        "admin_email_delivery": delivery_state(
            notification=notifications["admin"],
            channel="email",
        ),
        "admin_notification_id": str(notifications["admin"].id),
        "counsel_activity_id": str(logs["counsel"].id),
        "counsel_deliveries": delivery_states(notification=notifications["counsel"]),
        "counsel_notification_id": str(notifications["counsel"].id),
        "duplicate_delivery_count": notifications["duplicate_delivery_count"],
        "hidden_activity_id": str(logs["hidden"].id),
        "hidden_matter_id": str(cases["hidden"].matter_id),
        "users": {
            "admin": members["admin"].user.username,
            "counsel": members["counsel"].user.username,
            "viewer": members["viewer"].user.username,
        },
        "viewer_activity_id": str(logs["viewer"].id),
    }


def create_member(*, organization, role, run_id, slug, user_factory, membership_factory):
    username = f"{slug}.{run_id}@example.test"
    user = user_factory(username=username, email=username)
    return membership_factory(organization=organization, user=user, role=role)


def create_activity_logs(
    *,
    action,
    admin,
    counsel,
    counsel_case,
    hidden_case,
    organization,
    viewer_case,
    activity_model,
) -> dict:
    return {
        "counsel": activity_model.objects.create(
            organization=organization,
            matter=counsel_case.matter,
            actor_membership=counsel,
            action=action,
            target_type="matter",
            target_id=counsel_case.matter_id,
            before_values={"status": "draft", "password": "secret"},
            after_values={"status": "open", "document_body": "private"},
            metadata={"request_id": "int005", "presigned_url": "https://example.test/presigned"},
        ),
        "hidden": activity_model.objects.create(
            organization=organization,
            matter=hidden_case.matter,
            actor_membership=admin,
            action=action,
            target_type="matter",
            target_id=hidden_case.matter_id,
        ),
        "viewer": activity_model.objects.create(
            organization=organization,
            matter=viewer_case.matter,
            actor_membership=admin,
            action=action,
            target_type="matter",
            target_id=viewer_case.matter_id,
        ),
    }


def create_disabled_preferences(*, event_type, member, channel_email, channel_sms) -> None:
    from apps.notifications.models import NotificationPreference

    NotificationPreference.objects.create(
        membership=member,
        event_type=event_type,
        channel=channel_email,
        enabled=False,
    )
    NotificationPreference.objects.create(
        membership=member,
        event_type=event_type,
        channel=channel_sms,
        enabled=True,
    )


def send_pending_deliveries(*, notification, send_delivery) -> None:
    for delivery in notification.deliveries.all():
        send_delivery(delivery=delivery)


def attempt_duplicate_notification(*, create_notification, event_type, recipient, run_id) -> int:
    from apps.notifications.models import NotificationDelivery

    try:
        create_notification(
            recipient=recipient,
            event_type=event_type,
            title="INT-005 duplicate",
            dedupe_key=f"{run_id}:counsel",
        )
    except Exception:
        pass
    return NotificationDelivery.objects.filter(notification__recipient=recipient).count()


def delivery_states(*, notification) -> dict[str, tuple[str, str]]:
    return {
        delivery.channel: (delivery.status, delivery.safe_error_code)
        for delivery in notification.deliveries.order_by("channel")
    }


def delivery_state(*, notification, channel: str) -> tuple[str, str]:
    delivery = notification.deliveries.get(channel=channel)
    return delivery.status, delivery.safe_error_code


def cleanup_workspace(*, run_id: str) -> None:
    from django.contrib.auth import get_user_model

    from apps.activity.models import ActivityLog
    from apps.cases.models import LegalCase
    from apps.deadlines.models import Deadline
    from apps.matters.models import Matter, MatterAccess
    from apps.notifications.models import (
        Notification,
        NotificationDelivery,
        NotificationPreference,
    )
    from apps.organizations.models import Membership, Organization
    from apps.tasks.models import Task

    organizations = Organization.objects.filter(name=f"INT-005 Organization {run_id}")
    NotificationDelivery.objects.filter(organization__in=organizations).delete()
    Notification.objects.filter(organization__in=organizations).delete()
    NotificationPreference.objects.filter(membership__organization__in=organizations).delete()
    ActivityLog.objects.filter(organization__in=organizations).delete()
    Task.objects.filter(organization__in=organizations).delete()
    Deadline.objects.filter(organization__in=organizations).delete()
    LegalCase.objects.filter(matter__organization__in=organizations).delete()
    MatterAccess.objects.filter(organization__in=organizations).delete()
    Matter.objects.filter(organization__in=organizations).delete()
    Membership.objects.filter(organization__in=organizations).delete()
    organizations.delete()
    get_user_model().objects.filter(username__endswith=f".{run_id}@example.test").delete()


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
    return HttpResult(
        body=body,
        data=parse_json_body(body=body),
        headers=response.headers,
        status=getattr(response, "status", response.code),
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


def preference_enabled(data, channel: str) -> bool | None:
    for item in data:
        if item["channel"] == channel:
            return item["enabled"]
    return None


def notification_ids(data) -> list[str]:
    return [item["id"] for item in data["results"]]


def activity_ids_for(*, session: AuthenticatedSession) -> list[str]:
    response = request_json(
        session=session.session,
        path="/api/v1/activity/",
        headers=auth_headers(access=session.access),
    )
    return activity_ids(response.data)


def activity_ids(data) -> list[str]:
    return [item["id"] for item in data["results"]]


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
