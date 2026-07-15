"""URL routes for account authentication and user choice endpoints."""

from __future__ import annotations

from django.urls import path
from rest_framework.routers import DefaultRouter

from apps.accounts.api.v1 import viewsets

router = DefaultRouter()
router.register("users", viewsets.UserViewSet, basename="users")

urlpatterns = [
    path("auth/csrf/", viewsets.csrf, name="auth-csrf"),
    path("auth/login/", viewsets.login, name="auth-login"),
    path("auth/refresh/", viewsets.refresh, name="auth-refresh"),
    path("auth/logout/", viewsets.logout, name="auth-logout"),
    path(
        "auth/invitations/accept/",
        viewsets.accept_invitation,
        name="auth-invitations-accept",
    ),
    path("auth/me/", viewsets.me, name="auth-me"),
    path("auth/ws-ticket/", viewsets.ws_ticket, name="auth-ws-ticket"),
] + router.urls
