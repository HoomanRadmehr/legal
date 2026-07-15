"""Account authentication views and user choice ViewSets."""

from __future__ import annotations

from datetime import timedelta

from django.conf import settings
from django.middleware.csrf import get_token
from django.utils.translation import gettext_lazy as _
from rest_framework.authentication import CSRFCheck
from rest_framework.decorators import (
    action,
    api_view,
    authentication_classes,
    permission_classes,
    throttle_classes,
)
from rest_framework.exceptions import MethodNotAllowed, PermissionDenied
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication

from apps.accounts.api.v1.filters import UserChoiceFilter
from apps.accounts.api.v1.openapi import (
    csrf_schema,
    invitation_accept_schema,
    login_schema,
    logout_schema,
    me_schema,
    refresh_schema,
    user_schema,
    ws_ticket_schema,
)
from apps.accounts.api.v1.serializers import (
    AuthSessionSerializer,
    InvitationAcceptResponseSerializer,
    InvitationAcceptSerializer,
    LoginInputSerializer,
    MeSerializer,
    UserChoiceSerializer,
    WebSocketTicketSerializer,
)
from apps.accounts.models import User
from apps.accounts.selectors import get_current_membership, user_choices
from apps.accounts.services import AuthError, login_user, logout_refresh_token, refresh_session
from apps.organizations.services import accept_user_invitation
from common.api.errors import InvalidInputError
from common.api.pagination import ChoiceCursorPagination
from common.api.throttles import (
    InvitationAcceptThrottle,
    LoginThrottle,
    RefreshThrottle,
    UserChoicesThrottle,
    WebSocketTicketThrottle,
)
from common.api.viewsets import CommonModelViewSet
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


@invitation_accept_schema
@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
@throttle_classes([InvitationAcceptThrottle])
def accept_invitation(request):
    serializer = InvitationAcceptSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    body = accept_user_invitation(
        data=serializer.validated_data,
        request_id=getattr(request, "request_id", ""),
    )
    return Response(InvitationAcceptResponseSerializer(body).data)


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


@user_schema
class UserViewSet(CommonModelViewSet):
    http_method_names = ("get", "head", "options")
    permission_classes = (IsAuthenticated,)
    pagination_class = ChoiceCursorPagination
    serializer_class = UserChoiceSerializer
    queryset = User.objects.none()

    def list(self, request, *args, **kwargs):
        raise MethodNotAllowed("GET")

    def retrieve(self, request, *args, **kwargs):
        raise MethodNotAllowed("GET")

    def get_throttles(self):
        if self.action == "choices":
            return [UserChoicesThrottle()]
        return []

    @action(detail=False, methods=["get"], url_path="choices")
    def choices(self, request):
        filters = validated_user_choice_filters(data=request.query_params)
        queryset = user_choices(
            actor=request.user,
            purpose=filters["purpose"],
            query=filters["q"],
            exclude_user_id=filters.get("exclude_user_id"),
        )
        page = self.paginate_queryset(queryset)
        serializer = UserChoiceSerializer(page, many=True)
        return self.get_paginated_response(serializer.data)


def validated_user_choice_filters(*, data):
    serializer = UserChoiceFilter(data=data)
    if not serializer.is_valid():
        raise InvalidInputError(serializer.errors)
    return serializer.validated_data


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
