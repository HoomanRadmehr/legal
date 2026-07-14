"""URL routes for notification endpoints."""

from __future__ import annotations

from django.urls import path
from rest_framework.routers import DefaultRouter

from apps.notifications.api.v1.views import NotificationPreferenceView, NotificationViewSet

router = DefaultRouter()
router.register("notifications", NotificationViewSet, basename="notifications")

urlpatterns = [
    path(
        "notification-preferences/",
        NotificationPreferenceView.as_view(),
        name="notification-preferences",
    ),
    *router.urls,
]
