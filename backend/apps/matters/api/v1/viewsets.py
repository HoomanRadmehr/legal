"""ViewSets for matter choice endpoints."""

from __future__ import annotations

from rest_framework.decorators import action
from rest_framework.exceptions import MethodNotAllowed
from rest_framework.permissions import IsAuthenticated

from apps.matters.api.v1.filters import MatterChoiceFilter
from apps.matters.api.v1.openapi import matter_schema
from apps.matters.api.v1.serializers import MatterChoiceSerializer
from apps.matters.models import Matter
from apps.matters.selectors import matter_choices
from common.api.errors import InvalidInputError
from common.api.pagination import ChoiceCursorPagination
from common.api.throttles import MatterChoicesThrottle
from common.api.viewsets import CommonModelViewSet


@matter_schema
class MatterViewSet(CommonModelViewSet):
    http_method_names = ("get", "head", "options")
    permission_classes = (IsAuthenticated,)
    pagination_class = ChoiceCursorPagination
    serializer_class = MatterChoiceSerializer
    queryset = Matter.objects.none()

    def list(self, request, *args, **kwargs):
        raise MethodNotAllowed("GET")

    def retrieve(self, request, *args, **kwargs):
        raise MethodNotAllowed("GET")

    def get_throttles(self):
        if self.action == "choices":
            return [MatterChoicesThrottle()]
        return []

    @action(detail=False, methods=["get"], url_path="choices")
    def choices(self, request):
        filters = validated_matter_choice_filters(data=request.query_params)
        queryset = matter_choices(
            actor=request.user,
            purpose=filters["purpose"],
            query=filters["q"],
            kind=filters.get("kind"),
            exclude_matter_id=filters.get("exclude_matter_id"),
        )
        page = self.paginate_queryset(queryset)
        serializer = MatterChoiceSerializer(page, many=True)
        return self.get_paginated_response(serializer.data)


def validated_matter_choice_filters(*, data):
    serializer = MatterChoiceFilter(data=data)
    if not serializer.is_valid():
        raise InvalidInputError(serializer.errors)
    return serializer.validated_data
