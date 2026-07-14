"""URL routes for contract endpoints."""

from __future__ import annotations

from rest_framework.routers import DefaultRouter

from apps.contracts.api.v1.viewsets import ContractViewSet

router = DefaultRouter()
router.register("contracts", ContractViewSet, basename="contracts")

urlpatterns = router.urls
