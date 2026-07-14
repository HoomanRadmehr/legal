"""Tests for the user-scoped realtime event stream."""

from __future__ import annotations

import uuid
from json import dumps, loads
from urllib.parse import urlsplit

import pytest
from asgiref.sync import async_to_sync
from asgiref.testing import ApplicationCommunicator
from channels.layers import get_channel_layer
from django.core.cache import cache

from apps.organizations.tests.factories import MembershipFactory
from common.auth.tickets import create_websocket_ticket, websocket_ticket_key
from common.realtime.publisher import (
    EVENT_DOCUMENT_UPLOAD_STATUS_CHANGED,
    build_user_event,
    publish_upload_status_from_payload,
    user_group_name,
)
from config.asgi import application

pytestmark = pytest.mark.django_db(transaction=True)


def test_valid_ticket_connects_once_and_receives_user_event() -> None:
    membership = MembershipFactory()
    ticket = create_websocket_ticket(membership=membership)
    async_to_sync(run_valid_ticket_connects_once_and_receives_user_event)(
        ticket.ticket, membership.user_id
    )


async def run_valid_ticket_connects_once_and_receives_user_event(ticket: str, user_id) -> None:
    communicator = communicator_for_ticket(ticket=ticket)

    connected, _ = await communicator.connect()
    assert connected is True

    event = build_user_event(
        event_type=EVENT_DOCUMENT_UPLOAD_STATUS_CHANGED,
        data={"upload_id": uuid.uuid4(), "status": "processing"},
    )
    await get_channel_layer().group_send(
        user_group_name(user_id=user_id),
        {"type": "user.event", "event": event},
    )

    assert await communicator.receive_json_from() == event
    assert cache.get(websocket_ticket_key(ticket=ticket)) is None
    await communicator.disconnect()


def test_ticket_reuse_is_rejected() -> None:
    membership = MembershipFactory()
    ticket = create_websocket_ticket(membership=membership)
    async_to_sync(run_ticket_reuse_is_rejected)(ticket.ticket)


async def run_ticket_reuse_is_rejected(ticket: str) -> None:
    first = communicator_for_ticket(ticket=ticket)
    second = communicator_for_ticket(ticket=ticket)

    connected, _ = await first.connect()
    assert connected is True
    reused_connected, _ = await second.connect()
    assert reused_connected is False
    await first.disconnect()


def test_expired_ticket_is_rejected() -> None:
    membership = MembershipFactory()
    ticket = create_websocket_ticket(membership=membership)
    cache.delete(websocket_ticket_key(ticket=ticket.ticket))
    async_to_sync(run_expired_ticket_is_rejected)(ticket.ticket)


async def run_expired_ticket_is_rejected(ticket: str) -> None:
    communicator = communicator_for_ticket(ticket=ticket)

    connected, _ = await communicator.connect()

    assert connected is False


def test_cross_user_group_event_is_not_delivered() -> None:
    first_membership = MembershipFactory()
    second_membership = MembershipFactory()
    ticket = create_websocket_ticket(membership=first_membership)
    async_to_sync(run_cross_user_group_event_is_not_delivered)(
        ticket.ticket, second_membership.user_id
    )


async def run_cross_user_group_event_is_not_delivered(ticket: str, second_user_id) -> None:
    communicator = communicator_for_ticket(ticket=ticket)

    connected, _ = await communicator.connect()
    assert connected is True

    event = build_user_event(
        event_type=EVENT_DOCUMENT_UPLOAD_STATUS_CHANGED,
        data={"upload_id": uuid.uuid4(), "status": "available", "url": "http://secret"},
    )
    await get_channel_layer().group_send(
        user_group_name(user_id=second_user_id),
        {"type": "user.event", "event": event},
    )

    assert await communicator.receive_nothing(timeout=0.05, interval=0.01) is True
    await communicator.disconnect()


def test_bad_origin_is_rejected() -> None:
    membership = MembershipFactory()
    ticket = create_websocket_ticket(membership=membership)
    async_to_sync(run_bad_origin_is_rejected)(ticket.ticket)


async def run_bad_origin_is_rejected(ticket: str) -> None:
    communicator = communicator_for_ticket(ticket=ticket, origin=b"http://evil.test")

    connected, _ = await communicator.connect()

    assert connected is False


def test_ping_is_only_supported_client_message() -> None:
    membership = MembershipFactory()
    ticket = create_websocket_ticket(membership=membership)
    async_to_sync(run_ping_is_only_supported_client_message)(ticket.ticket)


async def run_ping_is_only_supported_client_message(ticket: str) -> None:
    communicator = communicator_for_ticket(ticket=ticket)

    connected, _ = await communicator.connect()
    assert connected is True
    await communicator.send_json_to({"type": "ping"})
    assert await communicator.receive_json_from() == {"type": "pong"}

    await communicator.send_json_to({"type": "subscribe", "group": "user.any"})
    assert await communicator.receive_close() == 1008


def test_upload_event_payload_filters_secret_fields(monkeypatch: pytest.MonkeyPatch) -> None:
    calls = []

    class FakeChannelLayer:
        async def group_send(self, group_name: str, message: dict) -> None:
            calls.append((group_name, message))

    monkeypatch.setattr("common.realtime.publisher.get_channel_layer", FakeChannelLayer)

    user_id = uuid.uuid4()
    upload_id = uuid.uuid4()
    result = publish_upload_status_from_payload(
        payload={
            "user_id": str(user_id),
            "upload_id": str(upload_id),
            "status": "available",
            "progress": 100,
            "url": "http://minio.example/presigned",
            "token": "jwt-secret",
        }
    )

    assert result == "published"
    assert calls[0][0] == user_group_name(user_id=user_id)
    assert calls[0][1]["event"]["data"] == {
        "upload_id": str(upload_id),
        "status": "available",
        "progress": 100,
    }


def communicator_for_ticket(*, ticket: str, origin: bytes = b"http://localhost"):
    return JsonWebsocketCommunicator(
        application=application,
        path=f"/ws/v1/events/?ticket={ticket}",
        headers=[(b"origin", origin)],
    )


class JsonWebsocketCommunicator:
    def __init__(self, *, application, path: str, headers: list[tuple[bytes, bytes]]) -> None:
        self.communicator = ApplicationCommunicator(
            application,
            websocket_scope(path=path, headers=headers),
        )

    async def connect(self) -> tuple[bool, int | None]:
        await self.communicator.send_input({"type": "websocket.connect"})
        output = await self.communicator.receive_output(timeout=1)
        if output["type"] == "websocket.accept":
            return True, None
        return False, output.get("code")

    async def disconnect(self) -> None:
        await self.communicator.send_input({"type": "websocket.disconnect", "code": 1000})
        await self.communicator.wait(timeout=1)

    async def send_json_to(self, content: dict) -> None:
        await self.communicator.send_input({"type": "websocket.receive", "text": dumps(content)})

    async def receive_json_from(self) -> dict:
        output = await self.communicator.receive_output(timeout=1)
        assert output["type"] == "websocket.send"
        return loads(output["text"])

    async def receive_close(self) -> int | None:
        output = await self.communicator.receive_output(timeout=1)
        assert output["type"] == "websocket.close"
        return output.get("code")

    async def receive_nothing(self, *, timeout: float, interval: float) -> bool:
        return await self.communicator.receive_nothing(timeout=timeout, interval=interval)


def websocket_scope(*, path: str, headers: list[tuple[bytes, bytes]]) -> dict:
    split = urlsplit(path)
    return {
        "type": "websocket",
        "path": split.path,
        "raw_path": split.path.encode(),
        "query_string": split.query.encode(),
        "headers": headers + [(b"host", b"testserver")],
        "subprotocols": [],
        "client": ("127.0.0.1", 12345),
        "server": ("testserver", 80),
    }
