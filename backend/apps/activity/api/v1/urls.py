"""URL routes for activity endpoints."""

from __future__ import annotations

from django.urls import path
from rest_framework.routers import DefaultRouter

from apps.activity.api.v1.views import ActivityViewSet, MatterTimelineView

router = DefaultRouter()
router.register("activity", ActivityViewSet, basename="activity")

urlpatterns = [
    path(
        "matters/<uuid:matter_id>/timeline/", MatterTimelineView.as_view(), name="matter-timeline"
    ),
    *router.urls,
]
