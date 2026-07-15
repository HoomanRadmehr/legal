"""OpenAPI declarations for direct document upload endpoints."""

from __future__ import annotations

from drf_spectacular.utils import (
    OpenApiExample,
    OpenApiParameter,
    OpenApiResponse,
    extend_schema,
    extend_schema_view,
)

from apps.documents.api.v1.serializers import (
    DocumentCompleteSerializer,
    DocumentPresignRequestSerializer,
    DocumentPresignResponseSerializer,
    DocumentSerializer,
    DownloadUrlSerializer,
)
from common.api.openapi import COMMON_ERROR_RESPONSES, IDEMPOTENCY_KEY_HEADER

DOCUMENT_PRESIGN_EXAMPLE = OpenApiExample(
    "Document presign",
    value={
        "document": {
            "id": "11111111-1111-1111-1111-111111111111",
            "filename": "contract.pdf",
            "status": "pending_upload",
            "upload_expires_at": "2026-07-15T18:10:00Z",
        },
        "upload": {
            "method": "PUT",
            "url": "http://localhost:9000/legal-documents/example-presigned",
            "headers": {"Content-Type": "application/pdf"},
            "expires_at": "2026-07-15T18:10:00Z",
        },
    },
)

DOCUMENT_ID_PARAMETER = OpenApiParameter(
    name="id",
    type=str,
    location=OpenApiParameter.PATH,
    description="Document UUID.",
)

document_schema = extend_schema_view(
    list=extend_schema(
        operation_id="documents_list",
        summary="List visible document metadata",
        responses={200: DocumentSerializer(many=True)},
    ),
    retrieve=extend_schema(
        operation_id="documents_retrieve",
        summary="Retrieve visible document metadata",
        parameters=[DOCUMENT_ID_PARAMETER],
        responses={200: DocumentSerializer, 404: COMMON_ERROR_RESPONSES[404]},
    ),
    presign=extend_schema(
        operation_id="documents_presign",
        summary="Create a pending document and direct MinIO upload URL",
        parameters=[IDEMPOTENCY_KEY_HEADER],
        request=DocumentPresignRequestSerializer,
        responses={
            201: OpenApiResponse(
                DocumentPresignResponseSerializer,
                examples=[DOCUMENT_PRESIGN_EXAMPLE],
            ),
            400: COMMON_ERROR_RESPONSES[400],
            403: COMMON_ERROR_RESPONSES[403],
            404: COMMON_ERROR_RESPONSES[404],
            409: COMMON_ERROR_RESPONSES[409],
            413: COMMON_ERROR_RESPONSES[413],
            422: COMMON_ERROR_RESPONSES[422],
            429: COMMON_ERROR_RESPONSES[429],
            503: COMMON_ERROR_RESPONSES[503],
        },
    ),
    complete=extend_schema(
        operation_id="documents_complete",
        summary="Complete a direct MinIO document upload",
        parameters=[DOCUMENT_ID_PARAMETER],
        request=None,
        responses={
            200: DocumentCompleteSerializer,
            400: COMMON_ERROR_RESPONSES[400],
            404: COMMON_ERROR_RESPONSES[404],
            409: COMMON_ERROR_RESPONSES[409],
            503: COMMON_ERROR_RESPONSES[503],
        },
    ),
    download_url=extend_schema(
        operation_id="documents_download_url",
        summary="Issue an audited short-lived document download URL",
        parameters=[DOCUMENT_ID_PARAMETER],
        request=None,
        responses={
            200: DownloadUrlSerializer,
            404: COMMON_ERROR_RESPONSES[404],
            409: COMMON_ERROR_RESPONSES[409],
            429: COMMON_ERROR_RESPONSES[429],
        },
    ),
    revoke=extend_schema(
        operation_id="documents_revoke",
        summary="Cancel document availability without hard delete",
        parameters=[DOCUMENT_ID_PARAMETER],
        request=None,
        responses={
            200: DocumentSerializer,
            403: COMMON_ERROR_RESPONSES[403],
            404: COMMON_ERROR_RESPONSES[404],
        },
    ),
)
