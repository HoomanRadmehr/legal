"""URL routes for organization membership endpoints."""

from __future__ import annotations

from rest_framework.routers import DefaultRouter

from apps.organizations.api.v1.viewsets import MembershipViewSet

router = DefaultRouter()
router.register("memberships", MembershipViewSet, basename="memberships")

urlpatterns = router.urls
