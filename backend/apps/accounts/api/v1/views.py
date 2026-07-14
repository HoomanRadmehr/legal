"""Account authentication API views."""

from __future__ import annotations

from datetime import timedelta

from django.conf import settings
from django.middleware.csrf import get_token
from django.utils.translation import gettext_lazy as _
from rest_framework.authentication import CSRFCheck
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
    throttle_classes,
)
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication

from apps.accounts.api.v1.openapi import (
    csrf_schema,
    login_schema,
    logout_schema,
    me_schema,
    refresh_schema,
    ws_ticket_schema,
)
from apps.accounts.api.v1.serializers import (
    AuthSessionSerializer,
    LoginInputSerializer,
    MeSerializer,
    WebSocketTicketSerializer,
)
from apps.accounts.selectors import get_current_membership
from apps.accounts.services import AuthError, login_user, logout_refresh_token, refresh_session
from common.api.throttles import LoginThrottle, RefreshThrottle, WebSocketTicketThrottle
from common.auth.tickets import create_websocket_ticket


@csrf_schema
@api_view(["GET"])
@authentication_classes([])
@permission_classes([AllowAny])
def csrf(request):
    get_token(request._request)
    return Response({})


@login_schema
@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
@throttle_classes([LoginThrottle])
def login(request):
    enforce_csrf(request)
    serializer = LoginInputSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    session = login_user(**serializer.validated_data)
    response = Response(auth_session_data(session=session))
    set_refresh_cookie(response=response, refresh_token=session.refresh_token)
    return response


@refresh_schema
@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
@throttle_classes([RefreshThrottle])
def refresh(request):
    enforce_csrf(request)
    refresh_token = request.COOKIES.get(settings.JWT_REFRESH_COOKIE_NAME)
    session = refresh_session(refresh_token=refresh_token)
    response = Response(auth_session_data(session=session))
    set_refresh_cookie(response=response, refresh_token=session.refresh_token)
    return response


@logout_schema
@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def logout(request):
    enforce_csrf(request)
    refresh_token = request.COOKIES.get(settings.JWT_REFRESH_COOKIE_NAME)
    logout_refresh_token(refresh_token=refresh_token)
    response = Response(status=204)
    clear_refresh_cookie(response=response)
    return response


@me_schema
@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def me(request):
    membership = get_current_membership(user=request.user)
    if membership is None:
        raise AuthError(
            _("Unable to authenticate with the provided credentials."),
            code="inactive_account",
        )

    return Response(MeSerializer({"user": request.user, "membership": membership}).data)


@ws_ticket_schema
@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
@throttle_classes([WebSocketTicketThrottle])
def ws_ticket(request):
    membership = get_current_membership(user=request.user)
    if membership is None:
        raise AuthError(
            _("Unable to authenticate with the provided credentials."),
            code="inactive_account",
        )

    ticket = create_websocket_ticket(membership=membership)
    return Response(
        WebSocketTicketSerializer(
            {
                "expires_at": ticket.expires_at,
                "ticket": ticket.ticket,
                "websocket_url": f"/ws/v1/events/?ticket={ticket.ticket}",
            }
        ).data
    )


def enforce_csrf(request) -> None:
    check = CSRFCheck(lambda csrf_request: None)
    reason = check.process_view(request._request, None, (), {})
    if reason:
        raise PermissionDenied(_("CSRF verification failed."), code="csrf_failed")


def auth_session_data(*, session) -> dict:
    return AuthSessionSerializer(
        {
            "access": session.access_token,
            "user": session.user,
            "membership": session.membership,
        }
    ).data


def set_refresh_cookie(*, response: Response, refresh_token: str) -> None:
    response.set_cookie(
        settings.JWT_REFRESH_COOKIE_NAME,
        refresh_token,
        domain=settings.JWT_COOKIE_DOMAIN,
        httponly=True,
        max_age=int(timedelta(days=settings.JWT_REFRESH_DAYS).total_seconds()),
        path=settings.JWT_REFRESH_COOKIE_PATH,
        samesite=settings.SESSION_COOKIE_SAMESITE,
        secure=getattr(settings, "JWT_REFRESH_COOKIE_SECURE", settings.SESSION_COOKIE_SECURE),
    )


def clear_refresh_cookie(*, response: Response) -> None:
    response.delete_cookie(
        settings.JWT_REFRESH_COOKIE_NAME,
        domain=settings.JWT_COOKIE_DOMAIN,
        path=settings.JWT_REFRESH_COOKIE_PATH,
        samesite=settings.SESSION_COOKIE_SAMESITE,
    )
