"""ViewSets for contract endpoints."""

from __future__ import annotations

from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.accounts.selectors import get_current_membership
from apps.contracts.api.v1.filters import ContractFilter
from apps.contracts.api.v1.openapi import contract_schema
from apps.contracts.api.v1.serializers import (
    ContractArchiveSerializer,
    ContractCreateSerializer,
    ContractDetailSerializer,
    ContractListSerializer,
    ContractTimelineSerializer,
    ContractUpdateSerializer,
)
from apps.contracts.models import Contract
from apps.contracts.selectors import contract_list, contract_timeline
from apps.contracts.services import contract_archive, contract_create, contract_update
from common.api.viewsets import CommonModelViewSet


@contract_schema
class ContractViewSet(CommonModelViewSet):
    http_method_names = ("get", "post", "patch", "head", "options")
    permission_classes = (IsAuthenticated,)
    filterset_class = ContractFilter
    ordering = ("reference_code",)
    ordering_fields = (
        "created_at",
        "updated_at",
        "priority",
        "reference_code",
        "contract_type",
        "counterparty",
        "effective_date",
        "expiration_date",
        "renewal_date",
    )

    def get_queryset(self):
        membership = current_membership_from_request(request=self.request)
        if membership is None:
            return Contract.objects.none()
        return contract_list(actor=self.request.user, organization=membership.organization)

    def get_serializer_class(self):
        if self.action == "list":
            return ContractListSerializer
        if self.action == "create":
            return ContractCreateSerializer
        if self.action == "partial_update":
            return ContractUpdateSerializer
        if self.action == "archive":
            return ContractArchiveSerializer
        if self.action == "timeline":
            return ContractTimelineSerializer
        return ContractDetailSerializer

    def create(self, request, *args, **kwargs):
        serializer = ContractCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        contract = contract_create(actor=request.user, data=serializer.validated_data)
        output = ContractDetailSerializer(contract, context=self.get_serializer_context())
        return Response(output.data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, *args, **kwargs):
        contract = self.get_object()
        serializer = ContractUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated = contract_update(
            actor=request.user,
            contract=contract,
            data=serializer.validated_data,
            expected_version=serializer.validated_data["version"],
        )
        output = ContractDetailSerializer(updated, context=self.get_serializer_context())
        return Response(output.data)

    @action(detail=True, methods=["post"])
    def archive(self, request, pk=None):
        contract = self.get_object()
        serializer = ContractArchiveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        archived = contract_archive(
            actor=request.user,
            contract=contract,
            expected_version=serializer.validated_data["version"],
        )
        output = ContractDetailSerializer(archived, context=self.get_serializer_context())
        return Response(output.data)

    @action(detail=True, methods=["get"])
    def timeline(self, request, pk=None):
        contract = self.get_object()
        timeline = contract_timeline(
            actor=request.user,
            organization=contract.matter.organization,
            contract_id=contract.matter_id,
        )
        return Response(ContractTimelineSerializer(timeline, many=True).data)


def current_membership_from_request(*, request):
    user = getattr(request, "user", None)
    if user is None or not user.is_authenticated:
        return None
    return get_current_membership(user=user)
