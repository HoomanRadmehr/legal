"""Mutation services for direct private document uploads."""

from __future__ import annotations

import re
import uuid
from datetime import timedelta
from pathlib import PurePosixPath

from django.conf import settings
from django.db import transaction
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from minio.error import S3Error
from rest_framework.exceptions import APIException, NotFound, PermissionDenied

from apps.accounts.selectors import get_current_membership
from apps.activity.models import (
    ACTION_DOCUMENT_AVAILABLE,
    ACTION_DOCUMENT_DOWNLOAD_REQUESTED,
    ACTION_DOCUMENT_UPLOAD_COMPLETED,
    ACTION_DOCUMENT_UPLOAD_INITIATED,
)
from apps.documents.models import (
    ACTIVE_DOCUMENT_UPLOAD_STATUSES,
    DOCUMENT_STATUS_AVAILABLE,
    DOCUMENT_STATUS_CANCELLED,
    DOCUMENT_STATUS_EXPIRED,
    DOCUMENT_STATUS_FAILED,
    DOCUMENT_STATUS_PENDING_UPLOAD,
    DOCUMENT_STATUS_VERIFYING,
    Document,
)
from apps.matters.permissions import require_matter_edit, require_matter_view
from apps.matters.selectors import matter_get
from common.api.errors import ConflictError, DomainRuleError
from common.services.activity import record_activity
from common.services.idempotency import (
    begin_idempotency_record,
    complete_idempotency_record,
    request_hash_for_payload,
)
from common.services.outbox import create_outbox_event, dispatch_outbox_event
from common.storage import delete_abandoned_object, presign_download_object, presign_upload_object
from common.storage import stat_object as minio_stat_object

ALLOWED_CONTENT_TYPES = {
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg",
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".txt": "text/plain",
    ".xls": "application/vnd.ms-excel",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}
CHECKSUM_PATTERN = re.compile(r"^[a-f0-9]{64}$")
IDEMPOTENCY_SCOPE_DOCUMENT_PRESIGN = "documents.presign"
MAX_ACTIVE_DOCUMENT_UPLOADS = 5


class UploadTooLargeError(APIException):
    status_code = 413
    default_detail = _("Upload exceeds the configured size limit.")
    default_code = "upload_size_exceeded"


class UploadRateLimitError(APIException):
    status_code = 429
    default_detail = _("Too many active document uploads.")
    default_code = "upload_active_document_limit_exceeded"


class StorageUnavailableError(APIException):
    status_code = 503
    default_detail = _("Document storage is temporarily unavailable.")
    default_code = "storage_unavailable"


def create_document_presign(
    *,
    actor,
    matter_id,
    filename: str,
    content_type: str,
    size: int,
    checksum_sha256: str = "",
    description: str = "",
    idempotency_key: str,
    request_id: str = "",
) -> dict:
    actor_membership, matter, metadata = presign_context(
        actor=actor,
        matter_id=matter_id,
        filename=filename,
        content_type=content_type,
        size=size,
        checksum_sha256=checksum_sha256,
    )
    record = begin_presign_idempotency(
        actor_membership=actor_membership,
        matter_id=matter.id,
        metadata=metadata,
        description=description,
        idempotency_key=idempotency_key,
    )
    replay = replay_presign_if_available(record=record)
    if replay is not None:
        return replay
    return create_new_presign(
        actor_membership=actor_membership,
        matter=matter,
        metadata=metadata,
        description=description,
        record=record,
        request_id=request_id,
    )


def presign_context(
    *,
    actor,
    matter_id,
    filename: str,
    content_type: str,
    size: int,
    checksum_sha256: str,
):
    actor_membership = require_upload_actor(actor=actor)
    matter = matter_get(
        actor=actor,
        organization=actor_membership.organization,
        matter_id=matter_id,
    )
    require_matter_edit(membership=actor_membership, matter=matter)
    metadata = clean_upload_metadata(
        filename=filename,
        content_type=content_type,
        size=size,
        checksum_sha256=checksum_sha256,
    )
    require_active_document_capacity(actor_membership=actor_membership)
    return actor_membership, matter, metadata


def complete_document_upload(*, actor, document_id, request_id: str = "") -> Document:
    actor_membership = require_upload_actor(actor=actor)
    document = document_for_completion(actor_membership=actor_membership, document_id=document_id)
    if document.status == DOCUMENT_STATUS_AVAILABLE:
        return document
    reject_expired_pending_document(document=document)

    document = mark_document_verifying(
        document_id=document.id,
        actor_membership=actor_membership,
        request_id=request_id,
    )
    object_stat = verified_document_stat(document=document)
    return mark_document_available(
        document_id=document.id,
        object_stat=object_stat,
        actor_membership=actor_membership,
        request_id=request_id,
    )


def issue_download_url(*, actor, document: Document, request_id: str = "") -> dict:
    actor_membership = require_upload_actor(actor=actor)
    require_matter_view(membership=actor_membership, matter=document.matter)
    if document.status != DOCUMENT_STATUS_AVAILABLE:
        raise ConflictError(_("Document is not available."), code="document_not_available")

    record_activity(
        organization=document.organization,
        matter=document.matter,
        actor_membership=actor_membership,
        actor_user=actor_membership.user,
        action=ACTION_DOCUMENT_DOWNLOAD_REQUESTED,
        target_type="document",
        target_id=document.id,
        after_values={"id": str(document.id), "matter_id": str(document.matter_id)},
        request_id=request_id,
    )
    return {
        "url": presign_download_object(
            object_key=document.object_key,
            expires_in_seconds=settings.MINIO_PRESIGNED_DOWNLOAD_TTL_SECONDS,
        ),
        "expires_in_seconds": settings.MINIO_PRESIGNED_DOWNLOAD_TTL_SECONDS,
    }


def revoke_document(*, actor, document: Document) -> Document:
    actor_membership = require_upload_actor(actor=actor)
    require_matter_edit(membership=actor_membership, matter=document.matter)
    if document.status == DOCUMENT_STATUS_CANCELLED:
        return document
    document.status = DOCUMENT_STATUS_CANCELLED
    document.save(update_fields=["status", "updated_at"])
    create_document_status_outbox(document=document)
    return document


def expire_pending_document_uploads(*, limit: int = 100) -> int:
    expired_documents = list(expired_document_queryset()[:limit])
    expired_count = 0
    for document in expired_documents:
        if mark_document_expired(document=document):
            delete_orphan_object(object_key=document.object_key)
            expired_count += 1
    return expired_count


def clean_upload_metadata(
    *, filename: str, content_type: str, size: int, checksum_sha256: str = ""
) -> dict:
    cleaned_filename = clean_filename(filename=filename)
    cleaned_content_type = content_type.strip().lower()
    extension = file_extension(filename=cleaned_filename)
    if extension not in ALLOWED_CONTENT_TYPES:
        raise_invalid_upload_input()
    if ALLOWED_CONTENT_TYPES[extension] != cleaned_content_type:
        raise_invalid_upload_input()
    validate_upload_size(size=size)
    validate_checksum(checksum_sha256=checksum_sha256)
    return {
        "filename": cleaned_filename,
        "content_type": cleaned_content_type,
        "size": size,
        "checksum_sha256": checksum_sha256.strip(),
    }


def create_new_presign(
    *, actor_membership, matter, metadata: dict, description: str, record, request_id: str
):
    document_id = uuid.uuid4()
    expires_at = upload_expiry()
    object_key = build_document_object_key(
        organization_id=actor_membership.organization_id,
        matter_id=matter.id,
        document_id=document_id,
    )
    upload = presign_document_upload(
        object_key=object_key,
        content_type=metadata["content_type"],
        expires_at=expires_at,
    )
    with transaction.atomic():
        document = create_pending_document(
            document_id=document_id,
            actor_membership=actor_membership,
            matter=matter,
            object_key=object_key,
            metadata=metadata,
            description=description,
            expires_at=expires_at,
        )
        record_upload_initiated(
            document=document,
            actor_membership=actor_membership,
            request_id=request_id,
        )
        complete_idempotency_record(
            record=record,
            response_status=201,
            response_body={"document_id": str(document.id)},
        )
    return presign_response(document=document, upload=upload)


def create_pending_document(
    *,
    document_id,
    actor_membership,
    matter,
    object_key: str,
    metadata: dict,
    description: str,
    expires_at,
) -> Document:
    return Document.objects.create(
        id=document_id,
        organization=actor_membership.organization,
        matter=matter,
        object_key=object_key,
        original_filename=metadata["filename"],
        content_type=metadata["content_type"],
        expected_size=metadata["size"],
        expected_checksum=metadata["checksum_sha256"],
        status=DOCUMENT_STATUS_PENDING_UPLOAD,
        description=description,
        uploaded_by=actor_membership,
        upload_expires_at=expires_at,
    )


def begin_presign_idempotency(
    *, actor_membership, matter_id, metadata: dict, description: str, idempotency_key: str
):
    request_hash = request_hash_for_payload(
        payload={
            "matter_id": str(matter_id),
            "filename": metadata["filename"],
            "content_type": metadata["content_type"],
            "size": metadata["size"],
            "checksum_sha256": metadata["checksum_sha256"],
            "description": description,
        }
    )
    return begin_idempotency_record(
        organization=actor_membership.organization,
        actor_membership=actor_membership,
        scope=IDEMPOTENCY_SCOPE_DOCUMENT_PRESIGN,
        key=idempotency_key,
        request_hash=request_hash,
    )


def replay_presign_if_available(*, record) -> dict | None:
    document_id = record.response_body.get("document_id")
    if record.status != "completed" or not document_id:
        return None
    document = Document.objects.filter(id=document_id).first()
    if document is None:
        raise ConflictError(_("Upload intent is no longer available."), code="upload_expired")
    if document.status != DOCUMENT_STATUS_PENDING_UPLOAD:
        raise ConflictError(_("Upload intent is no longer pending."), code="upload_expired")
    require_document_not_expired(document=document)
    upload = presign_document_upload(
        object_key=document.object_key,
        content_type=document.content_type,
        expires_at=document.upload_expires_at,
    )
    return presign_response(document=document, upload=upload)


def document_for_completion(*, actor_membership, document_id) -> Document:
    document = (
        Document.objects.select_related(
            "organization", "matter", "uploaded_by", "uploaded_by__user"
        )
        .filter(id=document_id, organization=actor_membership.organization)
        .first()
    )
    if document is None:
        raise NotFound(_("Not found."))
    require_matter_edit(membership=actor_membership, matter=document.matter)
    return document


def mark_document_verifying(*, document_id, actor_membership, request_id: str) -> Document:
    with transaction.atomic():
        document = locked_document(document_id=document_id)
        require_matter_edit(membership=actor_membership, matter=document.matter)
        require_document_pending(document=document)
        require_document_not_expired(document=document)
        document.status = DOCUMENT_STATUS_VERIFYING
        document.save(update_fields=["status", "updated_at"])
        record_upload_completed(
            document=document,
            actor_membership=actor_membership,
            request_id=request_id,
        )
        create_document_status_outbox(document=document)
        return document


def mark_document_available(
    *, document_id, object_stat, actor_membership, request_id: str
) -> Document:
    with transaction.atomic():
        document = locked_document(document_id=document_id)
        if document.status == DOCUMENT_STATUS_AVAILABLE:
            return document
        require_matter_edit(membership=actor_membership, matter=document.matter)
        require_document_verifying(document=document)
        document.actual_size = stat_size(object_stat=object_stat)
        document.actual_checksum = stat_checksum(object_stat=object_stat)
        document.etag = stat_etag(object_stat=object_stat)
        document.uploaded_at = timezone.now()
        document.status = DOCUMENT_STATUS_AVAILABLE
        document.failure_code = ""
        document.save(update_fields=available_update_fields())
        record_document_available(document=document, request_id=request_id)
        create_document_status_outbox(document=document)
        return document


def mark_document_failed(*, document_id, failure_code: str) -> None:
    with transaction.atomic():
        document = locked_document(document_id=document_id)
        if document.status in {DOCUMENT_STATUS_AVAILABLE, DOCUMENT_STATUS_FAILED}:
            return
        document.status = DOCUMENT_STATUS_FAILED
        document.failure_code = failure_code[:64]
        document.save(update_fields=["status", "failure_code", "updated_at"])
        create_document_status_outbox(document=document)


def locked_document(*, document_id) -> Document:
    return (
        Document.objects.select_for_update()
        .select_related("organization", "matter", "uploaded_by", "uploaded_by__user")
        .get(id=document_id)
    )


def verified_document_stat(*, document: Document):
    try:
        object_stat = upload_object_stat(object_key=document.object_key)
        validate_object_stat(document=document, object_stat=object_stat)
        return object_stat
    except APIException as error:
        code = error.get_codes()
        mark_document_failed(document_id=document.id, failure_code=str(code))
        delete_orphan_object(object_key=document.object_key)
        raise


def upload_object_stat(*, object_key: str):
    try:
        return minio_stat_object(object_key=object_key)
    except S3Error as error:
        if error.code in {"NoSuchKey", "NoSuchObject", "NoSuchBucket"}:
            raise ConflictError(
                _("Uploaded object is not available yet."), code="upload_object_missing"
            ) from error
        raise StorageUnavailableError() from error


def delete_orphan_object(*, object_key: str) -> None:
    try:
        delete_abandoned_object(object_key=object_key)
    except S3Error:
        return


def validate_object_stat(*, document: Document, object_stat) -> None:
    if stat_size(object_stat=object_stat) != document.expected_size:
        raise ConflictError(_("Uploaded object size differs."), code="upload_size_mismatch")
    content_type = stat_content_type(object_stat=object_stat)
    if content_type and content_type.lower() != document.content_type:
        raise ConflictError(
            _("Uploaded object content type differs."), code="upload_content_type_mismatch"
        )
    if not checksum_matches(document=document, object_stat=object_stat):
        raise ConflictError(_("Uploaded object checksum differs."), code="upload_checksum_mismatch")


def presign_document_upload(*, object_key: str, content_type: str, expires_at) -> dict:
    remaining_seconds = max(1, int((expires_at - timezone.now()).total_seconds()))
    try:
        url = presign_upload_object(
            object_key=object_key,
            expires_in_seconds=remaining_seconds,
        )
    except S3Error as error:
        raise StorageUnavailableError() from error
    return {
        "method": "PUT",
        "url": url,
        "headers": {"Content-Type": content_type},
        "expires_at": expires_at,
    }


def presign_response(*, document: Document, upload: dict) -> dict:
    return {
        "document": document_summary(document=document),
        "upload": {
            "method": upload["method"],
            "url": upload["url"],
            "headers": upload["headers"],
            "expires_at": upload["expires_at"],
        },
    }


def document_summary(*, document: Document) -> dict:
    return {
        "id": str(document.id),
        "filename": document.original_filename,
        "status": document.status,
        "upload_expires_at": iso_or_none(value=document.upload_expires_at),
    }


def document_complete_body(*, document: Document) -> dict:
    return {
        "id": str(document.id),
        "filename": document.original_filename,
        "content_type": document.content_type,
        "size": document.actual_size or document.expected_size,
        "status": document.status,
        "uploaded_at": iso_or_none(value=document.uploaded_at),
    }


def require_upload_actor(*, actor):
    membership = get_current_membership(user=actor)
    if membership is None:
        raise PermissionDenied(_("An active organization membership is required."))
    return membership


def require_active_document_capacity(*, actor_membership) -> None:
    active_count = Document.objects.filter(
        uploaded_by=actor_membership,
        status__in=ACTIVE_DOCUMENT_UPLOAD_STATUSES,
        upload_expires_at__gt=timezone.now(),
    ).count()
    if active_count >= MAX_ACTIVE_DOCUMENT_UPLOADS:
        raise UploadRateLimitError()


def require_document_pending(*, document: Document) -> None:
    if document.status == DOCUMENT_STATUS_FAILED:
        raise ConflictError(_("Upload already failed."), code="upload_already_failed")
    if document.status == DOCUMENT_STATUS_EXPIRED:
        raise ConflictError(_("Upload has expired."), code="upload_expired")
    if document.status != DOCUMENT_STATUS_PENDING_UPLOAD:
        raise ConflictError(_("Upload cannot be completed."), code="upload_state_conflict")


def require_document_verifying(*, document: Document) -> None:
    if document.status != DOCUMENT_STATUS_VERIFYING:
        raise ConflictError(_("Upload cannot be completed."), code="upload_state_conflict")


def require_document_not_expired(*, document: Document) -> None:
    if document.upload_expires_at and document.upload_expires_at <= timezone.now():
        raise ConflictError(_("Upload has expired."), code="upload_expired")


def reject_expired_pending_document(*, document: Document) -> None:
    if document.status != DOCUMENT_STATUS_PENDING_UPLOAD:
        return
    if document.upload_expires_at and document.upload_expires_at <= timezone.now():
        mark_document_expired(document=document)
        raise ConflictError(_("Upload has expired."), code="upload_expired")


def expired_document_queryset():
    return (
        Document.objects.filter(
            status=DOCUMENT_STATUS_PENDING_UPLOAD,
            upload_expires_at__lte=timezone.now(),
        )
        .select_related("matter", "organization", "uploaded_by")
        .order_by("upload_expires_at", "created_at")
    )


def mark_document_expired(*, document: Document) -> bool:
    updated = Document.objects.filter(
        id=document.id,
        status=DOCUMENT_STATUS_PENDING_UPLOAD,
    ).update(
        status=DOCUMENT_STATUS_EXPIRED,
        failure_code="upload_expired",
        updated_at=timezone.now(),
    )
    if updated == 1:
        document.status = DOCUMENT_STATUS_EXPIRED
        document.failure_code = "upload_expired"
        create_document_status_outbox(document=document)
    return updated == 1


def record_upload_initiated(*, document: Document, actor_membership, request_id: str) -> None:
    record_activity(
        organization=document.organization,
        matter=document.matter,
        actor_membership=actor_membership,
        actor_user=actor_membership.user,
        action=ACTION_DOCUMENT_UPLOAD_INITIATED,
        target_type="document",
        target_id=document.id,
        after_values=safe_document_values(document=document),
        request_id=request_id,
    )
    create_document_status_outbox(document=document)


def record_upload_completed(*, document: Document, actor_membership, request_id: str) -> None:
    record_activity(
        organization=document.organization,
        matter=document.matter,
        actor_membership=actor_membership,
        actor_user=actor_membership.user,
        action=ACTION_DOCUMENT_UPLOAD_COMPLETED,
        target_type="document",
        target_id=document.id,
        after_values=safe_document_values(document=document),
        request_id=request_id,
    )


def record_document_available(*, document: Document, request_id: str) -> None:
    record_activity(
        organization=document.organization,
        matter=document.matter,
        actor_membership=document.uploaded_by,
        actor_user=document.uploaded_by.user,
        action=ACTION_DOCUMENT_AVAILABLE,
        target_type="document",
        target_id=document.id,
        after_values=safe_document_values(document=document),
        request_id=request_id,
    )


def create_document_status_outbox(*, document: Document) -> None:
    event = create_outbox_event(
        organization=document.organization,
        event_type="document.upload.status_changed",
        aggregate_type="document",
        aggregate_id=document.id,
        payload={
            "document_id": str(document.id),
            "id": str(document.id),
            "matter_id": str(document.matter_id),
            "status": document.status,
            "upload_id": str(document.id),
            "user_id": str(document.uploaded_by.user_id),
        },
    )
    if document.status != DOCUMENT_STATUS_PENDING_UPLOAD:
        transaction.on_commit(lambda: dispatch_outbox_event(event_id=event.id))


def safe_document_values(*, document: Document) -> dict:
    return {
        "id": str(document.id),
        "matter_id": str(document.matter_id),
        "status": document.status,
    }


def build_document_object_key(*, organization_id, matter_id, document_id) -> str:
    return str(
        PurePosixPath(
            "organizations",
            str(organization_id),
            "matters",
            str(matter_id),
            "documents",
            str(document_id),
        )
    )


def clean_filename(*, filename: str) -> str:
    cleaned = filename.replace("\\", "/").split("/")[-1].strip()
    if not cleaned or len(cleaned) > 255:
        raise_invalid_upload_input()
    return cleaned


def file_extension(*, filename: str) -> str:
    return PurePosixPath(filename).suffix.lower()


def validate_upload_size(*, size: int) -> None:
    if size <= 0:
        raise_invalid_upload_input()
    if size > settings.MAX_UPLOAD_SIZE_BYTES:
        raise UploadTooLargeError()


def validate_checksum(*, checksum_sha256: str) -> None:
    checksum = checksum_sha256.strip()
    if checksum and CHECKSUM_PATTERN.fullmatch(checksum) is None:
        raise_invalid_upload_input()


def checksum_matches(*, document: Document, object_stat) -> bool:
    if not document.expected_checksum:
        return True
    return stat_checksum(object_stat=object_stat) in {"", document.expected_checksum}


def stat_size(*, object_stat) -> int:
    return int(getattr(object_stat, "size", -1))


def stat_content_type(*, object_stat) -> str:
    return str(getattr(object_stat, "content_type", "") or "")


def stat_checksum(*, object_stat) -> str:
    metadata = getattr(object_stat, "metadata", {}) or {}
    return metadata.get("checksum") or metadata.get("x-amz-meta-checksum-sha256") or ""


def stat_etag(*, object_stat) -> str:
    return str(getattr(object_stat, "etag", "") or "")


def upload_expiry():
    return timezone.now() + timedelta(seconds=settings.MINIO_PRESIGNED_UPLOAD_TTL_SECONDS)


def available_update_fields() -> list[str]:
    return [
        "actual_size",
        "actual_checksum",
        "etag",
        "uploaded_at",
        "status",
        "failure_code",
        "updated_at",
    ]


def iso_or_none(*, value) -> str | None:
    if value is None:
        return None
    return value.isoformat().replace("+00:00", "Z")


def raise_invalid_upload_input() -> None:
    raise DomainRuleError(_("File type or upload policy is not allowed."), code="invalid_input")
