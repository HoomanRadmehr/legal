"""Views for notification endpoints."""

from __future__ import annotations

from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.notifications.api.v1.filters import NotificationFilter
from apps.notifications.api.v1.openapi import (
    notification_preference_list_schema,
    notification_preference_replace_schema,
    notification_schema,
)
from apps.notifications.api.v1.serializers import (
    NotificationPreferenceReplaceSerializer,
    NotificationPreferenceSerializer,
    NotificationSerializer,
)
from apps.notifications.models import Notification
from apps.notifications.selectors import notification_list, notification_preference_list
from apps.notifications.services import (
    mark_all_notifications_read,
    mark_notification_read,
    replace_own_preferences,
)
from common.api.viewsets import CommonModelViewSet


@notification_schema
class NotificationViewSet(CommonModelViewSet):
    http_method_names = ("get", "patch", "post", "head", "options")
    permission_classes = (IsAuthenticated,)
    serializer_class = NotificationSerializer
    filterset_class = NotificationFilter
    ordering = ("-created_at",)
    ordering_fields = ("created_at", "read_at")

    def get_queryset(self):
        if not self.request.user.is_authenticated:
            return Notification.objects.none()
        return notification_list(actor=self.request.user)

    @action(detail=True, methods=["patch"])
    def read(self, request, pk=None):
        notification = self.get_object()
        updated = mark_notification_read(actor=request.user, notification=notification)
        output = NotificationSerializer(updated, context=self.get_serializer_context())
        return Response(output.data)

    @action(detail=False, methods=["post"], url_path="read-all")
    def read_all(self, request):
        updated = mark_all_notifications_read(actor=request.user)
        return Response({"updated": updated}, status=status.HTTP_200_OK)


class NotificationPreferenceView(APIView):
    permission_classes = (IsAuthenticated,)

    @notification_preference_list_schema
    def get(self, request):
        preferences = notification_preference_list(actor=request.user)
        output = NotificationPreferenceSerializer(preferences, many=True)
        return Response(output.data)

    @notification_preference_replace_schema
    def put(self, request):
        serializer = NotificationPreferenceReplaceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        preferences = replace_own_preferences(
            actor=request.user,
            preferences=serializer.validated_data["preferences"],
        )
        output = NotificationPreferenceSerializer(preferences, many=True)
        return Response(output.data)
