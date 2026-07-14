"""ViewSets for legal notice endpoints."""

from __future__ import annotations

from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.accounts.selectors import get_current_membership
from apps.notices.api.v1.filters import NoticeFilter
from apps.notices.api.v1.openapi import notice_schema
from apps.notices.api.v1.serializers import (
    NoticeArchiveSerializer,
    NoticeCreateSerializer,
    NoticeDetailSerializer,
    NoticeListSerializer,
    NoticeTimelineSerializer,
    NoticeUpdateSerializer,
)
from apps.notices.models import LegalNotice
from apps.notices.selectors import notice_list, notice_timeline
from apps.notices.services import notice_archive, notice_create, notice_update
from common.api.viewsets import CommonModelViewSet


@notice_schema
class NoticeViewSet(CommonModelViewSet):
    http_method_names = ("get", "post", "patch", "head", "options")
    permission_classes = (IsAuthenticated,)
    filterset_class = NoticeFilter
    ordering = ("reference_code",)
    ordering_fields = (
        "created_at",
        "updated_at",
        "priority",
        "reference_code",
        "received_date",
        "response_deadline",
        "sender",
    )

    def get_queryset(self):
        membership = current_membership_from_request(request=self.request)
        if membership is None:
            return LegalNotice.objects.none()
        return notice_list(actor=self.request.user, organization=membership.organization)

    def get_serializer_class(self):
        if self.action == "list":
            return NoticeListSerializer
        if self.action == "create":
            return NoticeCreateSerializer
        if self.action == "partial_update":
            return NoticeUpdateSerializer
        if self.action == "archive":
            return NoticeArchiveSerializer
        if self.action == "timeline":
            return NoticeTimelineSerializer
        return NoticeDetailSerializer

    def create(self, request, *args, **kwargs):
        serializer = NoticeCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        notice = notice_create(actor=request.user, data=serializer.validated_data)
        output = NoticeDetailSerializer(notice, context=self.get_serializer_context())
        return Response(output.data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, *args, **kwargs):
        notice = self.get_object()
        serializer = NoticeUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated = notice_update(
            actor=request.user,
            notice=notice,
            data=serializer.validated_data,
            expected_version=serializer.validated_data["version"],
        )
        output = NoticeDetailSerializer(updated, context=self.get_serializer_context())
        return Response(output.data)

    @action(detail=True, methods=["post"])
    def archive(self, request, pk=None):
        notice = self.get_object()
        serializer = NoticeArchiveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        archived = notice_archive(
            actor=request.user,
            notice=notice,
            expected_version=serializer.validated_data["version"],
        )
        output = NoticeDetailSerializer(archived, context=self.get_serializer_context())
        return Response(output.data)

    @action(detail=True, methods=["get"])
    def timeline(self, request, pk=None):
        notice = self.get_object()
        timeline = notice_timeline(
            actor=request.user,
            organization=notice.matter.organization,
            notice_id=notice.matter_id,
        )
        return Response(NoticeTimelineSerializer(timeline, many=True).data)


def current_membership_from_request(*, request):
    user = getattr(request, "user", None)
    if user is None or not user.is_authenticated:
        return None
    return get_current_membership(user=user)
