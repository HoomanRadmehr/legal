"""Root URL configuration for the backend project."""

from __future__ import annotations

from django.urls import include, path

from common.health import views as health_views

urlpatterns = [
    path("api/v1/auth/", include("apps.accounts.api.v1.urls")),
    path("api/v1/", include("apps.cases.api.v1.urls")),
    path("api/v1/", include("apps.contracts.api.v1.urls")),
    path("api/v1/", include("apps.deadlines.api.v1.urls")),
    path("api/v1/", include("apps.notices.api.v1.urls")),
    path("api/v1/", include("apps.tasks.api.v1.urls")),
    path("api/v1/", include("apps.documents.api.v1.urls")),
    path("api/v1/", include("apps.notifications.api.v1.urls")),
    path("health/live/", health_views.live, name="health-live"),
    path("health/ready/", health_views.ready, name="health-ready"),
]
