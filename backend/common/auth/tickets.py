"""One-time WebSocket ticket helpers."""

from __future__ import annotations

import hashlib
import secrets
from dataclasses import dataclass
from datetime import timedelta

from django.core.cache import cache
from django.utils import timezone

WEBSOCKET_TICKET_TTL_SECONDS = 60


@dataclass(frozen=True)
class WebSocketTicket:
    ticket: str
    expires_at: object


@dataclass(frozen=True)
class ConsumedWebSocketTicket:
    user_id: str
    organization_id: str
    membership_id: str


def create_websocket_ticket(*, membership) -> WebSocketTicket:
    ticket = secrets.token_urlsafe(32)
    expires_at = timezone.now() + timedelta(seconds=WEBSOCKET_TICKET_TTL_SECONDS)
    cache.set(
        websocket_ticket_key(ticket=ticket),
        {
            "membership_id": str(membership.id),
            "organization_id": str(membership.organization_id),
            "user_id": str(membership.user_id),
        },
        timeout=WEBSOCKET_TICKET_TTL_SECONDS,
    )
    return WebSocketTicket(ticket=ticket, expires_at=expires_at)


def consume_websocket_ticket(*, ticket: str) -> ConsumedWebSocketTicket | None:
    if not reserve_ticket_for_consume(ticket=ticket):
        return None

    key = websocket_ticket_key(ticket=ticket)
    payload = cache.get(key)
    cache.delete(key)
    if not payload:
        return None
    return ConsumedWebSocketTicket(**payload)


def reserve_ticket_for_consume(*, ticket: str) -> bool:
    return cache.add(
        websocket_ticket_consumed_key(ticket=ticket),
        "1",
        timeout=WEBSOCKET_TICKET_TTL_SECONDS,
    )


def websocket_ticket_key(*, ticket: str) -> str:
    return f"websocket-ticket:{hash_ticket(ticket=ticket)}"


def websocket_ticket_consumed_key(*, ticket: str) -> str:
    return f"websocket-ticket-consumed:{hash_ticket(ticket=ticket)}"


def hash_ticket(*, ticket: str) -> str:
    return hashlib.sha256(ticket.encode()).hexdigest()
