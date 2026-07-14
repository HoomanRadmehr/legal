"""OpenAPI declarations for contract endpoints."""

from __future__ import annotations

from drf_spectacular.utils import (
    OpenApiExample,
    OpenApiParameter,
    OpenApiResponse,
    extend_schema,
    extend_schema_view,
)

from apps.contracts.api.v1.serializers import (
    ContractArchiveSerializer,
    ContractCreateSerializer,
    ContractDetailSerializer,
    ContractListSerializer,
    ContractTimelineSerializer,
    ContractUpdateSerializer,
)
from apps.contracts.models import MAX_KEY_TERMS_BYTES
from common.api.openapi import COMMON_ERROR_RESPONSES

CONTRACT_EXAMPLE = OpenApiExample(
    "Contract",
    value={
        "id": "11111111-1111-1111-1111-111111111111",
        "title": "Vendor services agreement",
        "reference_code": "CON-2026-001",
        "status": "active",
        "priority": "normal",
        "owner_id": "22222222-2222-2222-2222-222222222222",
        "contract_type": "vendor",
        "counterparty": "Northwind Legal Ops",
        "effective_date": "2026-07-14",
        "expiration_date": "2027-07-14",
        "renewal_date": "2027-06-14",
        "version": 1,
        "archived_at": None,
        "created_at": "2026-07-14T12:00:00Z",
        "updated_at": "2026-07-14T12:00:00Z",
    },
)

CONTRACT_ID_PARAMETER = OpenApiParameter(
    name="id",
    type=str,
    location=OpenApiParameter.PATH,
    description="Contract identifier. This is the underlying Matter UUID.",
)


contract_schema = extend_schema_view(
    list=extend_schema(
        operation_id="contracts_list",
        summary="List visible contracts",
        responses={200: OpenApiResponse(ContractListSerializer, examples=[CONTRACT_EXAMPLE])},
    ),
    retrieve=extend_schema(
        operation_id="contracts_retrieve",
        summary="Retrieve a visible contract",
        parameters=[CONTRACT_ID_PARAMETER],
        responses={200: ContractDetailSerializer, 404: COMMON_ERROR_RESPONSES[404]},
    ),
    create=extend_schema(
        operation_id="contracts_create",
        summary="Create a contract",
        description=(
            "Creates a contract as one Matter with one Contract detail record. "
            f"`key_terms` is limited to {MAX_KEY_TERMS_BYTES} serialized bytes and must not "
            "contain uploaded document content. Renewal dates after expiration are rejected."
        ),
        request=ContractCreateSerializer,
        responses={
            201: ContractDetailSerializer,
            400: COMMON_ERROR_RESPONSES[400],
            403: COMMON_ERROR_RESPONSES[403],
            409: COMMON_ERROR_RESPONSES[409],
            422: COMMON_ERROR_RESPONSES[422],
        },
    ),
    partial_update=extend_schema(
        operation_id="contracts_partial_update",
        summary="Update a contract with expected version",
        parameters=[CONTRACT_ID_PARAMETER],
        request=ContractUpdateSerializer,
        responses={
            200: ContractDetailSerializer,
            400: COMMON_ERROR_RESPONSES[400],
            403: COMMON_ERROR_RESPONSES[403],
            404: COMMON_ERROR_RESPONSES[404],
            409: COMMON_ERROR_RESPONSES[409],
            422: COMMON_ERROR_RESPONSES[422],
        },
    ),
    archive=extend_schema(
        operation_id="contracts_archive",
        summary="Archive a contract without hard delete",
        parameters=[CONTRACT_ID_PARAMETER],
        request=ContractArchiveSerializer,
        responses={
            200: ContractDetailSerializer,
            403: COMMON_ERROR_RESPONSES[403],
            404: COMMON_ERROR_RESPONSES[404],
            409: COMMON_ERROR_RESPONSES[409],
        },
    ),
    timeline=extend_schema(
        operation_id="contracts_timeline",
        summary="Return permission-aware contract activity timeline",
        parameters=[CONTRACT_ID_PARAMETER],
        responses={200: ContractTimelineSerializer(many=True), 404: COMMON_ERROR_RESPONSES[404]},
    ),
)
