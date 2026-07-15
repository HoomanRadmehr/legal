"""Views for activity endpoints."""

from __future__ import annotations

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, generics
from rest_framework.permissions import IsAuthenticated

from apps.accounts.selectors import get_current_membership
from apps.activity.api.v1.filters import ActivityFilter
from apps.activity.api.v1.openapi import activity_schema, matter_timeline_schema
from apps.activity.api.v1.serializers import ActivityLogSerializer
from apps.activity.models import ActivityLog
from apps.activity.selectors import activity_list, matter_timeline
from common.api.pagination import DefaultPagination
from common.api.viewsets import CommonModelViewSet


@activity_schema
class ActivityViewSet(CommonModelViewSet):
    http_method_names = ("get", "head", "options")
    permission_classes = (IsAuthenticated,)
    serializer_class = ActivityLogSerializer
    filterset_class = ActivityFilter
    ordering = ("-created_at",)
    ordering_fields = ("created_at", "action", "target_type")

    def get_queryset(self):
        membership = current_membership_from_request(request=self.request)
        if membership is None:
            return ActivityLog.objects.none()
        return activity_list(actor=self.request.user, organization=membership.organization)


class MatterTimelineView(generics.ListAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = ActivityLogSerializer
    filterset_class = ActivityFilter
    filter_backends = (DjangoFilterBackend, filters.OrderingFilter)
    ordering = ("-created_at",)
    ordering_fields = ("created_at", "action", "target_type")
    pagination_class = DefaultPagination

    @matter_timeline_schema
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        membership = current_membership_from_request(request=self.request)
        if membership is None:
            return ActivityLog.objects.none()
        return matter_timeline(
            actor=self.request.user,
            organization=membership.organization,
            matter_id=self.kwargs["matter_id"],
        )


def current_membership_from_request(*, request):
    user = getattr(request, "user", None)
    if user is None or not user.is_authenticated:
        return None
    return get_current_membership(user=user)
