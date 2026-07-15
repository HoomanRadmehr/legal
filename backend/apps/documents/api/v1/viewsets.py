"""ViewSets for direct document upload endpoints."""

from __future__ import annotations

from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import MethodNotAllowed, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.documents.api.v1.openapi import document_schema
from apps.documents.api.v1.serializers import (
    DocumentCompleteSerializer,
    DocumentPresignRequestSerializer,
    DocumentPresignResponseSerializer,
    DocumentSerializer,
    DownloadUrlSerializer,
)
from apps.documents.models import Document
from apps.documents.selectors import document_get, document_get_for_download, document_list
from apps.documents.services import (
    complete_document_upload,
    create_document_presign,
    issue_download_url,
    revoke_document,
)
from common.api.throttles import (
    DocumentCompleteThrottle,
    DocumentDownloadUrlThrottle,
    DocumentPresignThrottle,
)
from common.api.viewsets import CommonModelViewSet


@document_schema
class DocumentViewSet(CommonModelViewSet):
    http_method_names = ("get", "post", "head", "options")
    permission_classes = (IsAuthenticated,)
    serializer_class = DocumentSerializer
    queryset = Document.objects.none()
    lookup_value_regex = "[0-9a-f-]{36}"
    ordering = ("-created_at",)
    ordering_fields = ("created_at", "uploaded_at", "original_filename", "status")

    def get_queryset(self):
        return document_list(actor=self.request.user)

    def get_throttles(self):
        if self.action == "presign":
            return [DocumentPresignThrottle()]
        if self.action == "complete":
            return [DocumentCompleteThrottle()]
        if self.action == "download_url":
            return [DocumentDownloadUrlThrottle()]
        return []

    def create(self, request, *args, **kwargs):
        raise MethodNotAllowed("POST")

    def retrieve(self, request, pk=None, *args, **kwargs):
        return Response(DocumentSerializer(document_get(actor=request.user, document_id=pk)).data)

    @action(detail=False, methods=["post"])
    def presign(self, request):
        serializer = DocumentPresignRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = create_document_presign(
            actor=request.user,
            idempotency_key=idempotency_key_from_request(request=request),
            request_id=getattr(request, "request_id", ""),
            **serializer.validated_data,
        )
        return Response(
            DocumentPresignResponseSerializer(result).data, status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        document = complete_document_upload(
            actor=request.user,
            document_id=pk,
            request_id=getattr(request, "request_id", ""),
        )
        return Response(DocumentCompleteSerializer(document).data)

    @action(detail=True, methods=["post"], url_path="download-url")
    def download_url(self, request, pk=None):
        document = document_get_for_download(actor=request.user, document_id=pk)
        result = issue_download_url(
            actor=request.user,
            document=document,
            request_id=getattr(request, "request_id", ""),
        )
        return Response(DownloadUrlSerializer(result).data)

    @action(detail=True, methods=["post"])
    def revoke(self, request, pk=None):
        document = document_get(actor=request.user, document_id=pk)
        revoked = revoke_document(actor=request.user, document=document)
        return Response(DocumentSerializer(revoked).data)


def idempotency_key_from_request(*, request) -> str:
    key = request.headers.get("Idempotency-Key", "").strip()
    if not key:
        raise ValidationError({"Idempotency-Key": ["This header is required."]})
    return key
