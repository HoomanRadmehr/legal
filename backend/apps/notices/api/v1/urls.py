"""URL routes for legal notice endpoints."""

from __future__ import annotations

from rest_framework.routers import DefaultRouter

from apps.notices.api.v1.viewsets import NoticeViewSet

router = DefaultRouter()
router.register("notices", NoticeViewSet, basename="notices")

urlpatterns = router.urls
