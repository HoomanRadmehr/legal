"""URL routes for document endpoints."""

from __future__ import annotations

from rest_framework.routers import DefaultRouter

from apps.documents.api.v1.viewsets import DocumentViewSet

router = DefaultRouter()
router.register("documents", DocumentViewSet, basename="documents")

urlpatterns = router.urls
