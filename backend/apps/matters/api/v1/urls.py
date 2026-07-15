"""URL routes for matter endpoints."""

from __future__ import annotations

from rest_framework.routers import DefaultRouter

from apps.matters.api.v1.viewsets import MatterViewSet

router = DefaultRouter()
router.register("matters", MatterViewSet, basename="matters")

urlpatterns = router.urls
