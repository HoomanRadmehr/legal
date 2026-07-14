"""URL routes for legal case endpoints."""

from __future__ import annotations

from rest_framework.routers import DefaultRouter

from apps.cases.api.v1.viewsets import CaseViewSet

router = DefaultRouter()
router.register("cases", CaseViewSet, basename="cases")

urlpatterns = router.urls
