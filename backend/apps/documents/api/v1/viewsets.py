"""ViewSets for document upload endpoints."""

from __future__ import annotations

from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import MethodNotAllowed, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.documents.api.v1.openapi import document_schema, upload_session_schema
from apps.documents.api.v1.serializers import (
    DocumentSerializer,
    DownloadUrlSerializer,
    UploadInitiateResponseSerializer,
    UploadInitiateSerializer,
    UploadSessionSerializer,
)
from apps.documents.models import Document, UploadSession
from apps.documents.selectors import document_get, document_list, upload_session_get
from apps.documents.services import (
    complete_upload,
    initiate_upload,
    issue_download_url,
    revoke_document,
)
from common.api.throttles import UploadInitiateThrottle
from common.api.viewsets import CommonModelViewSet


@upload_session_schema
class UploadSessionViewSet(CommonModelViewSet):
    http_method_names = ("get", "post", "head", "options")
    permission_classes = (IsAuthenticated,)
    pagination_class = None
    queryset = UploadSession.objects.none()

    def get_serializer_class(self):
        if self.action == "create":
            return UploadInitiateSerializer
        if self.action == "retrieve":
            return UploadSessionSerializer
        return UploadSessionSerializer

    def get_throttles(self):
        if self.action == "create":
            return [UploadInitiateThrottle()]
        return []

    def list(self, request, *args, **kwargs):
        raise MethodNotAllowed("GET")

    def create(self, request, *args, **kwargs):
        serializer = UploadInitiateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = initiate_upload(
            actor=request.user,
            data=serializer.validated_data,
            request_id=getattr(request, "request_id", ""),
        )
        output = UploadInitiateResponseSerializer(result)
        return Response(output.data, status=status.HTTP_201_CREATED)

    def retrieve(self, request, pk=None, *args, **kwargs):
        session = upload_session_get(actor=request.user, upload_id=pk)
        return Response(UploadSessionSerializer(session).data)

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        response_status, body = complete_upload(
            actor=request.user,
            upload_id=pk,
            idempotency_key=idempotency_key_from_request(request=request),
            request_id=getattr(request, "request_id", ""),
        )
        return Response(body, status=response_status)


@document_schema
class DocumentViewSet(CommonModelViewSet):
    http_method_names = ("get", "post", "head", "options")
    permission_classes = (IsAuthenticated,)
    serializer_class = DocumentSerializer
    queryset = Document.objects.none()
    ordering = ("-created_at",)
    ordering_fields = ("created_at", "available_at", "original_filename", "status")

    def get_queryset(self):
        return document_list(actor=self.request.user)

    def retrieve(self, request, pk=None, *args, **kwargs):
        return Response(DocumentSerializer(document_get(actor=request.user, document_id=pk)).data)

    @action(detail=True, methods=["post"], url_path="download-url")
    def download_url(self, request, pk=None):
        document = document_get(actor=request.user, document_id=pk)
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
