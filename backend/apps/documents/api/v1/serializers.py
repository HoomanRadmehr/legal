"""Serializers for document upload endpoints."""

from __future__ import annotations

from rest_framework import serializers

from apps.documents.models import Document, UploadSession


class UploadInitiateSerializer(serializers.Serializer):
    matter_id = serializers.UUIDField()
    filename = serializers.CharField(max_length=255)
    content_type = serializers.CharField(max_length=127)
    size = serializers.IntegerField(min_value=1)
    checksum = serializers.CharField(max_length=128, allow_blank=True, required=False)
    description = serializers.CharField(allow_blank=True, required=False)


class UploadSessionSerializer(serializers.ModelSerializer):
    matter_id = serializers.UUIDField(read_only=True)
    requested_by_id = serializers.UUIDField(read_only=True)

    class Meta:
        model = UploadSession
        fields = (
            "id",
            "matter_id",
            "requested_by_id",
            "original_filename",
            "expected_size",
            "expected_content_type",
            "expected_checksum",
            "description",
            "status",
            "expires_at",
            "completed_at",
            "failure_code",
            "created_at",
            "updated_at",
        )


class UploadInitiateResponseSerializer(serializers.Serializer):
    id = serializers.UUIDField(source="upload.id")
    status = serializers.CharField(source="upload.status")
    expires_at = serializers.DateTimeField(source="upload.expires_at")
    method = serializers.CharField(source="instructions.method")
    url = serializers.URLField(source="instructions.url")
    headers = serializers.DictField(source="instructions.headers")
    fields = serializers.DictField(source="instructions.fields")
    completion_url = serializers.CharField(source="instructions.completion_url")
    polling_url = serializers.CharField(source="instructions.polling_url")


class DocumentSerializer(serializers.ModelSerializer):
    matter_id = serializers.UUIDField(read_only=True)
    uploaded_by_id = serializers.UUIDField(read_only=True)

    class Meta:
        model = Document
        fields = (
            "id",
            "matter_id",
            "upload_session_id",
            "original_filename",
            "content_type",
            "size",
            "checksum",
            "status",
            "description",
            "uploaded_by_id",
            "available_at",
            "revoked_at",
            "created_at",
            "updated_at",
        )


class DownloadUrlSerializer(serializers.Serializer):
    url = serializers.URLField()
    expires_in_seconds = serializers.IntegerField()
