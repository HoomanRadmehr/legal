"""Serializers for direct document upload endpoints."""

from __future__ import annotations

from rest_framework import serializers

from apps.documents.models import Document

FORBIDDEN_PRESIGN_FIELDS = {
    "access_key",
    "bucket",
    "file",
    "minio_credentials",
    "object_key",
    "organization_id",
    "secret_key",
    "status",
    "uploaded_at",
    "uploaded_by",
}


class DocumentPresignRequestSerializer(serializers.Serializer):
    matter_id = serializers.UUIDField()
    filename = serializers.CharField(max_length=255)
    content_type = serializers.CharField(max_length=127)
    size = serializers.IntegerField(min_value=1)
    checksum_sha256 = serializers.CharField(max_length=64, allow_blank=True, required=False)
    description = serializers.CharField(allow_blank=True, required=False)

    def validate(self, attrs):
        submitted = set(self.initial_data)
        forbidden = sorted(submitted & FORBIDDEN_PRESIGN_FIELDS)
        if forbidden:
            raise serializers.ValidationError({"forbidden_fields": forbidden})
        return attrs


class DocumentUploadDetailsSerializer(serializers.ModelSerializer):
    filename = serializers.CharField(source="original_filename", read_only=True)

    class Meta:
        model = Document
        fields = ("id", "filename", "status", "upload_expires_at")


class PresignedUploadSerializer(serializers.Serializer):
    method = serializers.CharField()
    url = serializers.URLField()
    headers = serializers.DictField()
    expires_at = serializers.DateTimeField()


class DocumentPresignResponseSerializer(serializers.Serializer):
    document = DocumentUploadDetailsSerializer()
    upload = PresignedUploadSerializer()


class DocumentCompleteSerializer(serializers.ModelSerializer):
    filename = serializers.CharField(source="original_filename", read_only=True)
    size = serializers.IntegerField(source="actual_size", read_only=True)

    class Meta:
        model = Document
        fields = ("id", "filename", "content_type", "size", "status", "uploaded_at")


class DocumentSerializer(serializers.ModelSerializer):
    matter_id = serializers.UUIDField(read_only=True)
    uploaded_by_id = serializers.UUIDField(read_only=True)
    size = serializers.IntegerField(source="actual_size", read_only=True)

    class Meta:
        model = Document
        fields = (
            "id",
            "matter_id",
            "original_filename",
            "content_type",
            "expected_size",
            "size",
            "expected_checksum",
            "actual_checksum",
            "etag",
            "status",
            "description",
            "uploaded_by_id",
            "upload_expires_at",
            "uploaded_at",
            "failure_code",
            "created_at",
            "updated_at",
        )


class DownloadUrlSerializer(serializers.Serializer):
    url = serializers.URLField()
    expires_in_seconds = serializers.IntegerField()
