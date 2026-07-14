"""URL routes for document upload endpoints."""

from __future__ import annotations

from rest_framework.routers import DefaultRouter

from apps.documents.api.v1.viewsets import DocumentViewSet, UploadSessionViewSet

router = DefaultRouter()
router.register("documents/uploads", UploadSessionViewSet, basename="documents-uploads")
router.register("documents", DocumentViewSet, basename="documents")

urlpatterns = router.urls
