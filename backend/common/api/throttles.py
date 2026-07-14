"""Explicit DRF throttles for sensitive endpoints."""

from __future__ import annotations

import hashlib

from rest_framework.throttling import SimpleRateThrottle


class LoginThrottle(SimpleRateThrottle):
    scope = "login"
    rate = "5/min"

    def get_cache_key(self, request, view) -> str:
        return build_throttle_key(
            scope=self.scope,
            parts=(self.get_ident(request), normalized_login_identifier(request)),
        )


class RefreshThrottle(SimpleRateThrottle):
    scope = "refresh"
    rate = "20/min"

    def get_cache_key(self, request, view) -> str:
        return build_throttle_key(scope=self.scope, parts=(self.get_ident(request),))


class WebSocketTicketThrottle(SimpleRateThrottle):
    scope = "ws_ticket"
    rate = "30/min"

    def get_cache_key(self, request, view) -> str | None:
        if not request.user or not request.user.is_authenticated:
            return None
        return build_throttle_key(scope=self.scope, parts=(str(request.user.id),))


def normalized_login_identifier(request) -> str:
    username = request.data.get("username", "") if hasattr(request, "data") else ""
    return str(username).strip().lower()


def build_throttle_key(*, scope: str, parts: tuple[str, ...]) -> str:
    digest = hashlib.sha256(":".join(parts).encode()).hexdigest()
    return f"throttle:{scope}:{digest}"
