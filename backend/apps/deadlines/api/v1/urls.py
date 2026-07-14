"""URL routes for deadline endpoints."""

from __future__ import annotations

from rest_framework.routers import DefaultRouter

from apps.deadlines.api.v1.viewsets import DeadlineViewSet

router = DefaultRouter()
router.register("deadlines", DeadlineViewSet, basename="deadlines")

urlpatterns = router.urls
