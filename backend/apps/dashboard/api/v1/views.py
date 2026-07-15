"""Views for dashboard endpoints."""

from __future__ import annotations

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.dashboard.api.v1.openapi import dashboard_schema
from apps.dashboard.api.v1.serializers import DashboardSerializer
from apps.dashboard.selectors import dashboard_summary


class DashboardView(APIView):
    permission_classes = (IsAuthenticated,)

    @dashboard_schema
    def get(self, request):
        summary = dashboard_summary(actor=request.user)
        return Response(DashboardSerializer(summary).data)
