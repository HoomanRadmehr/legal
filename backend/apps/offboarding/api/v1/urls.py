"""URL routes for offboarding endpoints."""

from __future__ import annotations

from django.urls import path

from apps.offboarding.api.v1 import views

urlpatterns = [
    path("offboarding/preview/", views.preview, name="offboarding-preview"),
    path("offboarding/execute/", views.execute, name="offboarding-execute"),
    path("offboarding/<uuid:run_id>/", views.retrieve, name="offboarding-retrieve"),
]
