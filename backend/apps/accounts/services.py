"""Authentication service functions."""

from __future__ import annotations

from dataclasses import dataclass

from django.contrib.auth import authenticate, get_user_model
from django.utils.translation import gettext_lazy as _
from rest_framework.exceptions import APIException
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.selectors import get_current_membership


@dataclass(frozen=True)
class AuthSession:
    access_token: str
    refresh_token: str
    user: object
    membership: object


class AuthError(APIException):
    status_code = 401


def login_user(*, username: str, password: str) -> AuthSession:
    normalized_username = normalize_login_identifier(username)
    user = authenticate(username=normalized_username, password=password)
    if user is None:
        reject_inactive_user_with_valid_password(
            username=normalized_username,
            password=password,
        )
        raise_authentication_failed("invalid_credentials")
    return create_session_for_user(user=user)


def refresh_session(*, refresh_token: str | None) -> AuthSession:
    if not refresh_token:
        raise_authentication_failed("refresh_required")

    old_refresh = parse_refresh_token(refresh_token=refresh_token)
    user = get_user_for_refresh(refresh_token=old_refresh)
    blacklist_refresh_token(refresh_token=old_refresh)
    return create_session_for_user(user=user)


def logout_refresh_token(*, refresh_token: str | None) -> None:
    if not refresh_token:
        return
    try:
        RefreshToken(refresh_token).blacklist()
    except TokenError:
        return


def create_session_for_user(*, user) -> AuthSession:
    membership = get_current_membership(user=user)
    if not user.is_active or membership is None:
        raise_authentication_failed("inactive_account")

    refresh = RefreshToken.for_user(user)
    return AuthSession(
        access_token=str(refresh.access_token),
        refresh_token=str(refresh),
        user=user,
        membership=membership,
    )


def normalize_login_identifier(username: str) -> str:
    return username.strip().lower()


def reject_inactive_user_with_valid_password(*, username: str, password: str) -> None:
    user_model = get_user_model()
    user = user_model.objects.filter(username=username, is_active=False).first()
    if user is not None and user.check_password(password):
        raise_authentication_failed("inactive_account")


def parse_refresh_token(*, refresh_token: str) -> RefreshToken:
    try:
        return RefreshToken(refresh_token)
    except TokenError:
        raise_authentication_failed("refresh_invalid")


def get_user_for_refresh(*, refresh_token: RefreshToken):
    user_id = refresh_token["user_id"]
    user_model = get_user_model()
    try:
        return user_model.objects.get(id=user_id)
    except user_model.DoesNotExist:
        raise_authentication_failed("refresh_invalid")


def blacklist_refresh_token(*, refresh_token: RefreshToken) -> None:
    try:
        refresh_token.blacklist()
    except AttributeError:
        raise_authentication_failed("refresh_invalid")


def raise_authentication_failed(code: str) -> None:
    messages = {
        "inactive_account": _("Unable to authenticate with the provided credentials."),
        "invalid_credentials": _("Unable to authenticate with the provided credentials."),
        "refresh_invalid": _("Refresh token is invalid or expired."),
        "refresh_required": _("Refresh token is required."),
    }
    raise AuthError(messages[code], code=code)
