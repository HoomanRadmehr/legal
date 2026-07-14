"""ViewSets for deadline endpoints."""

from __future__ import annotations

from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.accounts.selectors import get_current_membership
from apps.deadlines.api.v1.filters import DeadlineFilter
from apps.deadlines.api.v1.openapi import deadline_schema
from apps.deadlines.api.v1.serializers import (
    DeadlineActionSerializer,
    DeadlineCreateSerializer,
    DeadlineDetailSerializer,
    DeadlineListSerializer,
    DeadlineUpdateSerializer,
)
from apps.deadlines.models import Deadline
from apps.deadlines.selectors import (
    deadline_list,
    deadline_list_assigned_to_me,
    deadline_list_overdue,
    deadline_list_today,
    deadline_list_upcoming,
)
from apps.deadlines.services import (
    deadline_cancel,
    deadline_complete,
    deadline_create,
    deadline_update,
)
from common.api.viewsets import CommonModelViewSet

DEADLINE_VIEWS = {"today", "upcoming", "overdue", "assigned_to_me"}


@deadline_schema
class DeadlineViewSet(CommonModelViewSet):
    http_method_names = ("get", "post", "patch", "head", "options")
    permission_classes = (IsAuthenticated,)
    filterset_class = DeadlineFilter
    ordering = ("due_at",)
    ordering_fields = ("due_at", "priority", "status", "created_at", "updated_at")

    def get_queryset(self):
        membership = current_membership_from_request(request=self.request)
        if membership is None:
            return Deadline.objects.none()
        return deadline_queryset_for_view(request=self.request, membership=membership)

    def get_serializer_class(self):
        if self.action == "list":
            return DeadlineListSerializer
        if self.action == "create":
            return DeadlineCreateSerializer
        if self.action == "partial_update":
            return DeadlineUpdateSerializer
        if self.action in {"complete", "cancel"}:
            return DeadlineActionSerializer
        return DeadlineDetailSerializer

    def create(self, request, *args, **kwargs):
        serializer = DeadlineCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        deadline = deadline_create(actor=request.user, data=serializer.validated_data)
        output = DeadlineDetailSerializer(deadline, context=self.get_serializer_context())
        return Response(output.data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, *args, **kwargs):
        deadline = self.get_object()
        serializer = DeadlineUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated = deadline_update(
            actor=request.user,
            deadline=deadline,
            data=serializer.validated_data,
            expected_version=serializer.validated_data["version"],
        )
        output = DeadlineDetailSerializer(updated, context=self.get_serializer_context())
        return Response(output.data)

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        deadline = self.get_object()
        serializer = DeadlineActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        completed = deadline_complete(
            actor=request.user,
            deadline=deadline,
            expected_version=serializer.validated_data["version"],
        )
        output = DeadlineDetailSerializer(completed, context=self.get_serializer_context())
        return Response(output.data)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        deadline = self.get_object()
        serializer = DeadlineActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        cancelled = deadline_cancel(
            actor=request.user,
            deadline=deadline,
            expected_version=serializer.validated_data["version"],
        )
        output = DeadlineDetailSerializer(cancelled, context=self.get_serializer_context())
        return Response(output.data)


def deadline_queryset_for_view(*, request, membership):
    view_name = request.query_params.get("view")
    include_closed = "status" in request.query_params
    organization = membership.organization
    if view_name is None:
        return deadline_list(actor=request.user, organization=organization)
    if view_name not in DEADLINE_VIEWS:
        raise ValidationError({"view": ["Unsupported deadline view."]})
    if view_name == "today":
        return deadline_list_today(
            actor=request.user,
            organization=organization,
            include_closed=include_closed,
        )
    if view_name == "upcoming":
        return deadline_list_upcoming(
            actor=request.user,
            organization=organization,
            include_closed=include_closed,
        )
    if view_name == "overdue":
        return deadline_list_overdue(
            actor=request.user,
            organization=organization,
            include_closed=include_closed,
        )
    return deadline_list_assigned_to_me(
        actor=request.user,
        organization=organization,
        include_closed=include_closed,
    )


def current_membership_from_request(*, request):
    user = getattr(request, "user", None)
    if user is None or not user.is_authenticated:
        return None
    return get_current_membership(user=user)
