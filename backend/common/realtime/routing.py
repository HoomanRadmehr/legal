"""Realtime WebSocket URL routing."""

from __future__ import annotations

from django.urls import path

from common.realtime.consumers import UserEventsConsumer

websocket_urlpatterns = [
    path("ws/v1/events/", UserEventsConsumer.as_asgi(), name="user-events"),
]
