"""Small MinIO boundary functions for private document storage."""

from __future__ import annotations

from datetime import timedelta
from urllib.parse import urlparse

from django.conf import settings
from minio import Minio


def storage_client() -> Minio:
    return Minio(
        settings.MINIO_ENDPOINT,
        access_key=settings.MINIO_ACCESS_KEY,
        secret_key=settings.MINIO_SECRET_KEY,
        secure=settings.MINIO_USE_SSL,
    )


def public_presign_client() -> Minio:
    endpoint, secure = parse_public_endpoint(settings.MINIO_PUBLIC_ENDPOINT)
    return Minio(
        endpoint,
        access_key=settings.MINIO_ACCESS_KEY,
        secret_key=settings.MINIO_SECRET_KEY,
        secure=secure,
    )


def parse_public_endpoint(public_endpoint: str) -> tuple[str, bool]:
    parsed = urlparse(public_endpoint)
    if parsed.scheme and parsed.netloc:
        return parsed.netloc, parsed.scheme == "https"
    return public_endpoint, settings.MINIO_USE_SSL


def stat_object(*, object_key: str):
    return storage_client().stat_object(settings.MINIO_BUCKET_DOCUMENTS, object_key)


def presign_upload_object(*, object_key: str, expires_in_seconds: int) -> str:
    return public_presign_client().presigned_put_object(
        settings.MINIO_BUCKET_DOCUMENTS,
        object_key,
        expires=timedelta(seconds=expires_in_seconds),
    )


def presign_download_object(*, object_key: str, expires_in_seconds: int) -> str:
    return public_presign_client().presigned_get_object(
        settings.MINIO_BUCKET_DOCUMENTS,
        object_key,
        expires=timedelta(seconds=expires_in_seconds),
    )


def delete_abandoned_object(*, object_key: str) -> None:
    storage_client().remove_object(settings.MINIO_BUCKET_DOCUMENTS, object_key)
