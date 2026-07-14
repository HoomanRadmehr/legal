"""User-scoped JSON WebSocket consumers."""

from __future__ import annotations

from urllib.parse import parse_qs

from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer

from common.auth.tickets import consume_websocket_ticket
from common.realtime.publisher import user_group_name

CODE_POLICY_VIOLATION = 1008


class CommonJsonConsumer(AsyncJsonWebsocketConsumer):
    """Project base for ticket-authenticated JSON WebSocket consumers."""

    async def consume_ticket(self):
        ticket = ticket_from_scope(scope=self.scope)
        if not ticket:
            return None
        return await sync_to_async(consume_websocket_ticket)(ticket=ticket)


class UserEventsConsumer(CommonJsonConsumer):
    """One user-scoped event stream."""

    group_name = ""

    async def connect(self) -> None:
        consumed_ticket = await self.consume_ticket()
        if consumed_ticket is None:
            await self.close(code=CODE_POLICY_VIOLATION)
            return

        self.group_name = user_group_name(user_id=consumed_ticket.user_id)
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code: int) -> None:
        if self.group_name:
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content: dict, **kwargs) -> None:
        if content == {"type": "ping"}:
            await self.send_json({"type": "pong"})
            return
        await self.close(code=CODE_POLICY_VIOLATION)

    async def user_event(self, event: dict) -> None:
        await self.send_json(event["event"])


def ticket_from_scope(*, scope: dict) -> str:
    query_string = scope.get("query_string", b"")
    query = query_string.decode("utf-8", errors="ignore")
    values = parse_qs(query, keep_blank_values=False).get("ticket", [])
    if len(values) != 1:
        return ""
    return values[0]
