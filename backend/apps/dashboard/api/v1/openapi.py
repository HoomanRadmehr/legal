"""OpenAPI declarations for dashboard endpoints."""

from __future__ import annotations

from drf_spectacular.utils import OpenApiExample, OpenApiResponse, extend_schema

from apps.dashboard.api.v1.serializers import DashboardSerializer

DASHBOARD_EXAMPLE = OpenApiExample(
    "Dashboard summary",
    value={
        "cases": {"total": 12, "open": 8, "high_priority": 3},
        "contracts": {"total": 9, "expiring_soon": 2},
        "notices": {"open": 4, "response_overdue": 1},
        "deadlines": {"today": 2, "overdue": 1, "upcoming": 7, "assigned_to_me": 3},
        "tasks": {"assigned_to_me": 5, "overdue": 1},
        "recent_activity": [],
    },
)

dashboard_schema = extend_schema(
    operation_id="dashboard_retrieve",
    summary="Return permission-aware dashboard summary",
    responses={200: OpenApiResponse(DashboardSerializer, examples=[DASHBOARD_EXAMPLE])},
)
