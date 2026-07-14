"""ViewSets for legal case endpoints."""

from __future__ import annotations

from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.accounts.selectors import get_current_membership
from apps.cases.api.v1.filters import CaseFilter
from apps.cases.api.v1.openapi import case_schema
from apps.cases.api.v1.serializers import (
    CaseArchiveSerializer,
    CaseCreateSerializer,
    CaseDetailSerializer,
    CaseListSerializer,
    CaseTimelineSerializer,
    CaseUpdateSerializer,
)
from apps.cases.models import LegalCase
from apps.cases.selectors import case_list, case_timeline
from apps.cases.services import case_archive, case_create, case_update
from common.api.viewsets import CommonModelViewSet


@case_schema
class CaseViewSet(CommonModelViewSet):
    http_method_names = ("get", "post", "patch", "head", "options")
    permission_classes = (IsAuthenticated,)
    filterset_class = CaseFilter
    ordering = ("reference_code",)
    ordering_fields = (
        "created_at",
        "updated_at",
        "priority",
        "reference_code",
        "case_type",
    )

    def get_queryset(self):
        membership = current_membership_from_request(request=self.request)
        if membership is None:
            return LegalCase.objects.none()
        return case_list(actor=self.request.user, organization=membership.organization)

    def get_serializer_class(self):
        if self.action == "list":
            return CaseListSerializer
        if self.action == "create":
            return CaseCreateSerializer
        if self.action == "partial_update":
            return CaseUpdateSerializer
        if self.action == "archive":
            return CaseArchiveSerializer
        if self.action == "timeline":
            return CaseTimelineSerializer
        return CaseDetailSerializer

    def create(self, request, *args, **kwargs):
        serializer = CaseCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        legal_case = case_create(actor=request.user, data=serializer.validated_data)
        output = CaseDetailSerializer(legal_case, context=self.get_serializer_context())
        return Response(output.data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, *args, **kwargs):
        legal_case = self.get_object()
        serializer = CaseUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated = case_update(
            actor=request.user,
            legal_case=legal_case,
            data=serializer.validated_data,
            expected_version=serializer.validated_data["version"],
        )
        output = CaseDetailSerializer(updated, context=self.get_serializer_context())
        return Response(output.data)

    @action(detail=True, methods=["post"])
    def archive(self, request, pk=None):
        legal_case = self.get_object()
        serializer = CaseArchiveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        archived = case_archive(
            actor=request.user,
            legal_case=legal_case,
            expected_version=serializer.validated_data["version"],
        )
        output = CaseDetailSerializer(archived, context=self.get_serializer_context())
        return Response(output.data)

    @action(detail=True, methods=["get"])
    def timeline(self, request, pk=None):
        legal_case = self.get_object()
        timeline = case_timeline(
            actor=request.user,
            organization=legal_case.matter.organization,
            case_id=legal_case.matter_id,
        )
        return Response(CaseTimelineSerializer(timeline, many=True).data)


def current_membership_from_request(*, request):
    user = getattr(request, "user", None)
    if user is None or not user.is_authenticated:
        return None
    return get_current_membership(user=user)
