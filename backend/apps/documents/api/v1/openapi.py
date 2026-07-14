"""OpenAPI declarations for document upload endpoints."""

from __future__ import annotations

from drf_spectacular.utils import (
    OpenApiExample,
    OpenApiParameter,
    OpenApiResponse,
    extend_schema,
    extend_schema_view,
)

from apps.documents.api.v1.serializers import (
    DocumentSerializer,
    DownloadUrlSerializer,
    UploadInitiateResponseSerializer,
    UploadInitiateSerializer,
    UploadSessionSerializer,
)
from common.api.openapi import COMMON_ERROR_RESPONSES, IDEMPOTENCY_KEY_HEADER

UPLOAD_EXAMPLE = OpenApiExample(
    "Upload initiation",
    value={
        "id": "11111111-1111-1111-1111-111111111111",
        "status": "initiated",
        "expires_at": "2026-07-14T12:15:00Z",
        "method": "PUT",
        "url": "http://localhost:9000/legal-documents/example-presigned",
        "headers": {"Content-Type": "application/pdf"},
        "fields": {},
        "completion_url": (
            "/api/v1/documents/uploads/11111111-1111-1111-1111-111111111111/complete/"
        ),
        "polling_url": "/api/v1/documents/uploads/11111111-1111-1111-1111-111111111111/",
    },
)

UPLOAD_ID_PARAMETER = OpenApiParameter(
    name="id",
    type=str,
    location=OpenApiParameter.PATH,
    description="Upload session UUID.",
)

upload_session_schema = extend_schema_view(
    list=extend_schema(exclude=True),
    create=extend_schema(
        operation_id="documents_uploads_create",
        summary="Initiate a direct private document upload",
        request=UploadInitiateSerializer,
        responses={
            201: OpenApiResponse(UploadInitiateResponseSerializer, examples=[UPLOAD_EXAMPLE]),
            400: COMMON_ERROR_RESPONSES[400],
            403: COMMON_ERROR_RESPONSES[403],
            404: COMMON_ERROR_RESPONSES[404],
            413: COMMON_ERROR_RESPONSES[413],
            422: COMMON_ERROR_RESPONSES[422],
            429: COMMON_ERROR_RESPONSES[429],
        },
    ),
    retrieve=extend_schema(
        operation_id="documents_uploads_retrieve",
        summary="Poll upload session status",
        parameters=[UPLOAD_ID_PARAMETER],
        responses={200: UploadSessionSerializer, 404: COMMON_ERROR_RESPONSES[404]},
    ),
    complete=extend_schema(
        operation_id="documents_uploads_complete",
        summary="Complete an upload after direct MinIO transfer",
        parameters=[UPLOAD_ID_PARAMETER, IDEMPOTENCY_KEY_HEADER],
        request=None,
        responses={
            202: UploadSessionSerializer,
            400: COMMON_ERROR_RESPONSES[400],
            404: COMMON_ERROR_RESPONSES[404],
            409: COMMON_ERROR_RESPONSES[409],
            422: COMMON_ERROR_RESPONSES[422],
        },
    ),
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
    download_url=extend_schema(
        operation_id="documents_download_url",
        summary="Issue an audited short-lived document download URL",
        parameters=[DOCUMENT_ID_PARAMETER],
        request=None,
        responses={
            200: DownloadUrlSerializer,
            404: COMMON_ERROR_RESPONSES[404],
            409: COMMON_ERROR_RESPONSES[409],
        },
    ),
    revoke=extend_schema(
        operation_id="documents_revoke",
        summary="Revoke document availability without hard delete",
        parameters=[DOCUMENT_ID_PARAMETER],
        request=None,
        responses={
            200: DocumentSerializer,
            403: COMMON_ERROR_RESPONSES[403],
            404: COMMON_ERROR_RESPONSES[404],
        },
    ),
)
