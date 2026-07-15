"""Explicit DRF throttles for sensitive endpoints."""

from __future__ import annotations

import hashlib

from rest_framework.throttling import SimpleRateThrottle

from apps.accounts.selectors import get_current_membership


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


class InvitationAcceptThrottle(SimpleRateThrottle):
    scope = "invitation_accept"
    rate = "10/hour"

    def get_cache_key(self, request, view) -> str:
        return build_throttle_key(scope=self.scope, parts=(self.get_ident(request),))


class DocumentPresignThrottle(SimpleRateThrottle):
    scope = "document_presign"
    rate = "20/hour"

    def get_cache_key(self, request, view) -> str | None:
        if not request.user or not request.user.is_authenticated:
            return None
        membership = get_current_membership(user=request.user)
        organization_id = getattr(membership, "organization_id", "no-organization")
        return build_throttle_key(
            scope=self.scope,
            parts=(str(request.user.id), str(organization_id)),
        )


class DocumentCompleteThrottle(SimpleRateThrottle):
    scope = "document_complete"
    rate = "60/hour"

    def get_cache_key(self, request, view) -> str | None:
        if not request.user or not request.user.is_authenticated:
            return None
        return build_throttle_key(scope=self.scope, parts=(str(request.user.id),))


class DocumentDownloadUrlThrottle(SimpleRateThrottle):
    scope = "document_download_url"
    rate = "120/hour"

    def get_cache_key(self, request, view) -> str | None:
        if not request.user or not request.user.is_authenticated:
            return None
        return build_throttle_key(scope=self.scope, parts=(str(request.user.id),))


class UserChoicesThrottle(SimpleRateThrottle):
    scope = "user_choices"
    rate = None

    def get_cache_key(self, request, view) -> str | None:
        return authenticated_user_choice_key(scope=self.scope, request=request)


class MembershipChoicesThrottle(SimpleRateThrottle):
    scope = "membership_choices"
    rate = None

    def get_cache_key(self, request, view) -> str | None:
        return authenticated_user_choice_key(scope=self.scope, request=request)


class MatterChoicesThrottle(SimpleRateThrottle):
    scope = "matter_choices"
    rate = None

    def get_cache_key(self, request, view) -> str | None:
        return authenticated_user_choice_key(scope=self.scope, request=request)


UploadInitiateThrottle = DocumentPresignThrottle


def authenticated_user_choice_key(*, scope: str, request) -> str | None:
    if not request.user or not request.user.is_authenticated:
        return None
    membership = get_current_membership(user=request.user)
    organization_id = getattr(membership, "organization_id", "no-organization")
    return build_throttle_key(
        scope=scope,
        parts=(str(request.user.id), str(organization_id)),
    )


def normalized_login_identifier(request) -> str:
    username = request.data.get("username", "") if hasattr(request, "data") else ""
    return str(username).strip().lower()


def build_throttle_key(*, scope: str, parts: tuple[str, ...]) -> str:
    digest = hashlib.sha256(":".join(parts).encode()).hexdigest()
    return f"throttle:{scope}:{digest}"
