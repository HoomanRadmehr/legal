"""ViewSets for organization membership endpoints."""

from __future__ import annotations

from rest_framework.decorators import action
from rest_framework.exceptions import MethodNotAllowed, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.accounts.selectors import get_current_membership
from apps.organizations.api.v1.openapi import membership_schema
from apps.organizations.api.v1.serializers import (
    MembershipChoiceFilter,
    MembershipChoiceSerializer,
    MembershipInvitationCreateSerializer,
    MembershipInvitationSerializer,
    MembershipRoleChangeSerializer,
    MembershipSerializer,
)
from apps.organizations.models import Membership
from apps.organizations.selectors import membership_choices, membership_list_for_admin
from apps.organizations.services import change_membership_role, create_membership_invitation
from common.api.errors import InvalidInputError
from common.api.pagination import ChoiceCursorPagination
from common.api.throttles import MembershipChoicesThrottle
from common.api.viewsets import CommonModelViewSet


@membership_schema
class MembershipViewSet(CommonModelViewSet):
    http_method_names = ("get", "post", "head", "options")
    permission_classes = (IsAuthenticated,)
    queryset = Membership.objects.none()
    pagination_class = ChoiceCursorPagination

    def get_queryset(self):
        if self.action == "list":
            return membership_list_for_admin(actor=self.request.user)
        return Membership.objects.none()

    def get_serializer_class(self):
        if self.action == "choices":
            return MembershipChoiceSerializer
        if self.action == "create":
            return MembershipInvitationCreateSerializer
        if self.action == "change_role":
            return MembershipRoleChangeSerializer
        if self.action == "list":
            return MembershipSerializer
        return MembershipInvitationSerializer

    def retrieve(self, request, *args, **kwargs):
        raise MethodNotAllowed("GET")

    def get_throttles(self):
        if self.action == "choices":
            return [MembershipChoicesThrottle()]
        return super().get_throttles()

    @action(detail=False, methods=["get"], url_path="choices")
    def choices(self, request):
        filters = validated_membership_choice_filters(data=request.query_params)
        queryset = membership_choices(
            actor=request.user,
            exclude_membership_id=filters.get("exclude_membership_id"),
            purpose=filters["purpose"],
            query=filters["q"],
        )
        page = self.paginate_queryset(queryset)
        serializer = MembershipChoiceSerializer(page, many=True)
        return self.get_paginated_response(serializer.data)

    @action(detail=True, methods=["post"], url_path="role")
    def change_role(self, request, *args, **kwargs):
        serializer = MembershipRoleChangeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        membership = change_membership_role(
            actor=request.user,
            membership_id=kwargs["pk"],
            role=serializer.validated_data["role"],
            request_id=getattr(request, "request_id", ""),
        )
        return Response(MembershipSerializer(membership).data)

    def create(self, request, *args, **kwargs):
        serializer = MembershipInvitationCreateSerializer(
            data=request.data,
            context=self.get_serializer_context(),
        )
        serializer.is_valid(raise_exception=True)
        response_status, body = create_membership_invitation(
            actor=request.user,
            data=serializer.validated_data,
            idempotency_key=idempotency_key_from_request(request=request),
            request_id=getattr(request, "request_id", ""),
        )
        output = MembershipInvitationSerializer(body)
        return Response(output.data, status=response_status)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["organization"] = current_organization_from_request(request=self.request)
        return context


def current_organization_from_request(*, request):
    user = getattr(request, "user", None)
    if user is None or not user.is_authenticated:
        return None
    membership = get_current_membership(user=user)
    return getattr(membership, "organization", None)


def idempotency_key_from_request(*, request) -> str:
    key = request.headers.get("Idempotency-Key", "").strip()
    if not key:
        raise ValidationError({"Idempotency-Key": ["This header is required."]})
    return key


def validated_membership_choice_filters(*, data):
    serializer = MembershipChoiceFilter(data=data)
    if not serializer.is_valid():
        raise InvalidInputError(serializer.errors)
    return serializer.validated_data
