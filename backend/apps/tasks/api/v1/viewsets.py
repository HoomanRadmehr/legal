"""ViewSets for task endpoints."""

from __future__ import annotations

from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.accounts.selectors import get_current_membership
from apps.tasks.api.v1.filters import TaskFilter
from apps.tasks.api.v1.openapi import task_schema
from apps.tasks.api.v1.serializers import (
    TaskActionSerializer,
    TaskCreateSerializer,
    TaskDetailSerializer,
    TaskListSerializer,
    TaskUpdateSerializer,
)
from apps.tasks.models import Task
from apps.tasks.selectors import task_list, task_list_assigned_to_me
from apps.tasks.services import task_cancel, task_complete, task_create, task_update
from common.api.viewsets import CommonModelViewSet

TASK_VIEWS = {"assigned_to_me"}


@task_schema
class TaskViewSet(CommonModelViewSet):
    http_method_names = ("get", "post", "patch", "head", "options")
    permission_classes = (IsAuthenticated,)
    filterset_class = TaskFilter
    ordering = ("due_at",)
    ordering_fields = ("due_at", "status", "created_at", "updated_at")

    def get_queryset(self):
        membership = current_membership_from_request(request=self.request)
        if membership is None:
            return Task.objects.none()
        return task_queryset_for_view(request=self.request, membership=membership)

    def get_serializer_class(self):
        if self.action == "list":
            return TaskListSerializer
        if self.action == "create":
            return TaskCreateSerializer
        if self.action == "partial_update":
            return TaskUpdateSerializer
        if self.action in {"complete", "cancel"}:
            return TaskActionSerializer
        return TaskDetailSerializer

    def create(self, request, *args, **kwargs):
        serializer = TaskCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        task = task_create(actor=request.user, data=serializer.validated_data)
        output = TaskDetailSerializer(task, context=self.get_serializer_context())
        return Response(output.data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, *args, **kwargs):
        task = self.get_object()
        serializer = TaskUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated = task_update(
            actor=request.user,
            task=task,
            data=serializer.validated_data,
            expected_version=serializer.validated_data["version"],
        )
        output = TaskDetailSerializer(updated, context=self.get_serializer_context())
        return Response(output.data)

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        task = self.get_object()
        serializer = TaskActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        completed = task_complete(
            actor=request.user,
            task=task,
            expected_version=serializer.validated_data["version"],
        )
        output = TaskDetailSerializer(completed, context=self.get_serializer_context())
        return Response(output.data)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        task = self.get_object()
        serializer = TaskActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        cancelled = task_cancel(
            actor=request.user,
            task=task,
            expected_version=serializer.validated_data["version"],
        )
        output = TaskDetailSerializer(cancelled, context=self.get_serializer_context())
        return Response(output.data)


def task_queryset_for_view(*, request, membership):
    view_name = request.query_params.get("view")
    include_closed = "status" in request.query_params
    organization = membership.organization
    if view_name is None:
        return task_list(actor=request.user, organization=organization)
    if view_name not in TASK_VIEWS:
        raise ValidationError({"view": ["Unsupported task view."]})
    return task_list_assigned_to_me(
        actor=request.user,
        organization=organization,
        include_closed=include_closed,
    )


def current_membership_from_request(*, request):
    user = getattr(request, "user", None)
    if user is None or not user.is_authenticated:
        return None
    return get_current_membership(user=user)
