"""URL routes for dashboard endpoints."""

from __future__ import annotations

from django.urls import path

from apps.dashboard.api.v1.views import DashboardView

urlpatterns = [
    path("dashboard/", DashboardView.as_view(), name="dashboard"),
]
