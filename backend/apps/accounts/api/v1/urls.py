"""URL routes for account authentication endpoints."""

from __future__ import annotations

from django.urls import path

from apps.accounts.api.v1 import views

urlpatterns = [
    path("csrf/", views.csrf, name="auth-csrf"),
    path("login/", views.login, name="auth-login"),
    path("refresh/", views.refresh, name="auth-refresh"),
    path("logout/", views.logout, name="auth-logout"),
    path("invitations/accept/", views.accept_invitation, name="auth-invitations-accept"),
    path("me/", views.me, name="auth-me"),
    path("ws-ticket/", views.ws_ticket, name="auth-ws-ticket"),
]
