"""URL routes for task endpoints."""

from __future__ import annotations

from rest_framework.routers import DefaultRouter

from apps.tasks.api.v1.viewsets import TaskViewSet

router = DefaultRouter()
router.register("tasks", TaskViewSet, basename="tasks")

urlpatterns = router.urls
