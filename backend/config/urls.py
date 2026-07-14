"""Root URL configuration for the backend project."""

from __future__ import annotations

from django.urls import include, path

from common.health import views as health_views

urlpatterns = [
    path("api/v1/auth/", include("apps.accounts.api.v1.urls")),
    path("health/live/", health_views.live, name="health-live"),
    path("health/ready/", health_views.ready, name="health-ready"),
]
