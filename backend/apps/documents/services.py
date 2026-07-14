"""Mutation services for private document upload initiation."""

from __future__ import annotations

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
    ACTIVE_UPLOAD_STATUSES,
    DOCUMENT_STATUS_AVAILABLE,
    DOCUMENT_STATUS_REVOKED,
    UPLOAD_STATUS_AVAILABLE,
    UPLOAD_STATUS_EXPIRED,
    UPLOAD_STATUS_FAILED,
    UPLOAD_STATUS_INITIATED,
    UPLOAD_STATUS_PROCESSING,
    Document,
    UploadSession,
)
from apps.matters.permissions import require_matter_edit, require_matter_view
from apps.matters.selectors import matter_get
from common.api.errors import ConflictError, DomainRuleError
from common.services.activity import record_activity
from common.services.idempotency import (
    begin_idempotency_record,
    complete_idempotency_record,
    replay_response_for_record,
    request_hash_for_payload,
)
from common.services.outbox import create_outbox_event
from common.storage import (
    delete_abandoned_object,
    presign_download_object,
    presign_upload_object,
    stat_object,
)
from config.celery import app as celery_app

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
MAX_ACTIVE_UPLOAD_SESSIONS = 5


class UploadTooLargeError(APIException):
    status_code = 413
    default_detail = _("Upload exceeds the configured size limit.")
    default_code = "upload_size_exceeded"


class UploadRateLimitError(APIException):
    status_code = 429
    default_detail = _("Too many active upload sessions.")
    default_code = "upload_active_session_limit_exceeded"


IDEMPOTENCY_SCOPE_UPLOAD_COMPLETE = "documents.upload.complete"


def initiate_upload(*, actor, data: dict, request_id: str = "") -> dict:
    actor_membership = require_upload_actor(actor=actor)
    matter = matter_get(
        actor=actor,
        organization=actor_membership.organization,
        matter_id=data["matter_id"],
    )
    require_matter_edit(membership=actor_membership, matter=matter)
    validate_upload_policy(data=data)
    require_active_session_capacity(actor_membership=actor_membership)

    upload_id = uuid.uuid4()
    expires_at = upload_expiry()
    object_key = build_object_key(
        organization_id=actor_membership.organization_id,
        matter_id=matter.id,
        upload_id=upload_id,
        filename=data["filename"],
    )
    with transaction.atomic():
        session = create_upload_session(
            actor_membership=actor_membership,
            matter=matter,
            upload_id=upload_id,
            object_key=object_key,
            expires_at=expires_at,
            data=data,
        )
        record_upload_initiated(
            session=session, actor_membership=actor_membership, request_id=request_id
        )
    return upload_response(session=session)


def complete_upload(
    *, actor, upload_id, idempotency_key: str, request_id: str = ""
) -> tuple[int, dict]:
    actor_membership = require_upload_actor(actor=actor)
    request_hash = request_hash_for_payload(payload={"upload_id": str(upload_id)})
    record = begin_idempotency_record(
        organization=actor_membership.organization,
        actor_membership=actor_membership,
        scope=IDEMPOTENCY_SCOPE_UPLOAD_COMPLETE,
        key=idempotency_key,
        request_hash=request_hash,
    )
    replay = replay_response_for_record(record=record)
    if replay is not None:
        return replay

    session = upload_session_for_completion(actor_membership=actor_membership, upload_id=upload_id)
    verified_upload_stat(session=session)
    with transaction.atomic():
        locked = locked_upload_session(session_id=session.id)
        require_matter_edit(membership=actor_membership, matter=locked.matter)
        require_session_initiated(session=locked)
        require_session_not_expired(session=locked)
        require_no_document_for_upload(session=locked)
        mark_upload_processing(
            session=locked, actor_membership=actor_membership, request_id=request_id
        )
        response_body = upload_completion_body(session=locked)
        complete_idempotency_record(
            record=record,
            response_status=202,
            response_body=response_body,
        )
        transaction.on_commit(lambda: schedule_upload_processing(upload_id=locked.id))
    return 202, response_body


def process_upload_session(*, upload_id) -> str:
    session = upload_session_for_processing(upload_id=upload_id)
    if session is None:
        return "missing"
    if session.status == UPLOAD_STATUS_AVAILABLE:
        return "already_available"
    if session.status != UPLOAD_STATUS_PROCESSING:
        return "not_ready"

    try:
        object_stat = verified_upload_stat(session=session)
    except APIException as error:
        mark_upload_failed(session_id=session.id, failure_code=error.get_codes())
        return "failed"

    make_document_available(session_id=session.id, object_stat=object_stat)
    return "available"


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
    if document.status == DOCUMENT_STATUS_REVOKED:
        return document
    document.status = DOCUMENT_STATUS_REVOKED
    document.revoked_at = timezone.now()
    document.revoked_by = actor_membership
    document.save(update_fields=["status", "revoked_at", "revoked_by", "updated_at"])
    create_document_outbox(document=document)
    return document


def expire_abandoned_upload_sessions(*, limit: int = 100) -> int:
    expired_sessions = list(expired_upload_queryset()[:limit])
    expired_count = 0
    for session in expired_sessions:
        if mark_session_expired(session=session):
            delete_abandoned_object(object_key=session.object_key)
            expired_count += 1
    return expired_count


def require_upload_actor(*, actor):
    membership = get_current_membership(user=actor)
    if membership is None:
        raise PermissionDenied(_("An active organization membership is required."))
    return membership


def upload_session_for_completion(*, actor_membership, upload_id) -> UploadSession:
    session = (
        UploadSession.objects.select_related("matter", "organization", "requested_by")
        .filter(id=upload_id, organization=actor_membership.organization)
        .first()
    )
    if session is None:
        raise NotFound(_("Not found."))
    require_matter_edit(membership=actor_membership, matter=session.matter)
    require_session_initiated(session=session)
    require_session_not_expired(session=session)
    return session


def locked_upload_session(*, session_id) -> UploadSession:
    return (
        UploadSession.objects.select_for_update()
        .select_related("matter", "organization", "requested_by")
        .get(id=session_id)
    )


def upload_session_for_processing(*, upload_id) -> UploadSession | None:
    return (
        UploadSession.objects.select_related("matter", "organization", "requested_by")
        .filter(id=upload_id)
        .first()
    )


def require_session_initiated(*, session: UploadSession) -> None:
    if session.status != UPLOAD_STATUS_INITIATED:
        raise ConflictError(
            _("Upload cannot be completed from its current state."), code="upload_state_conflict"
        )


def require_session_not_expired(*, session: UploadSession) -> None:
    if session.expires_at <= timezone.now():
        raise ConflictError(_("Upload session has expired."), code="upload_expired")


def require_no_document_for_upload(*, session: UploadSession) -> None:
    if Document.objects.filter(upload_session=session).exists():
        raise ConflictError(_("Upload already has a document."), code="upload_state_conflict")


def verified_upload_stat(*, session: UploadSession):
    object_stat = upload_object_stat(object_key=session.object_key)
    if stat_size(object_stat=object_stat) != session.expected_size:
        raise_object_mismatch()
    content_type = stat_content_type(object_stat=object_stat)
    if content_type and content_type.lower() != session.expected_content_type:
        raise_object_mismatch()
    if not checksum_matches(session=session, object_stat=object_stat):
        raise_object_mismatch()
    return object_stat


def upload_object_stat(*, object_key: str):
    try:
        return stat_object(object_key=object_key)
    except S3Error as error:
        if error.code in {"NoSuchKey", "NoSuchObject", "NoSuchBucket"}:
            raise ConflictError(
                _("Uploaded object is not available yet."), code="upload_object_missing"
            ) from error
        raise


def stat_size(*, object_stat) -> int:
    return int(getattr(object_stat, "size", -1))


def stat_content_type(*, object_stat) -> str:
    return str(getattr(object_stat, "content_type", "") or "")


def checksum_matches(*, session: UploadSession, object_stat) -> bool:
    if not session.expected_checksum:
        return True
    metadata = getattr(object_stat, "metadata", {}) or {}
    checksum = metadata.get("checksum") or metadata.get("x-amz-meta-checksum")
    return checksum in {"", None, session.expected_checksum}


def raise_object_mismatch() -> None:
    raise DomainRuleError(
        _("Uploaded object does not match the upload session."), code="upload_object_mismatch"
    )


def validate_upload_policy(*, data: dict) -> None:
    filename = clean_filename(filename=data["filename"])
    extension = file_extension(filename=filename)
    content_type = data["content_type"].lower()
    if extension not in ALLOWED_CONTENT_TYPES:
        raise_policy_error()
    if ALLOWED_CONTENT_TYPES[extension] != content_type:
        raise_policy_error()
    validate_upload_size(size=data["size"])


def validate_upload_size(*, size: int) -> None:
    if size <= 0:
        raise_policy_error()
    if size > settings.MAX_UPLOAD_SIZE_BYTES:
        raise UploadTooLargeError()


def require_active_session_capacity(*, actor_membership) -> None:
    active_count = UploadSession.objects.filter(
        requested_by=actor_membership,
        status__in=ACTIVE_UPLOAD_STATUSES,
        expires_at__gt=timezone.now(),
    ).count()
    if active_count >= MAX_ACTIVE_UPLOAD_SESSIONS:
        raise UploadRateLimitError()


def create_upload_session(
    *, actor_membership, matter, upload_id, object_key, expires_at, data: dict
):
    return UploadSession.objects.create(
        id=upload_id,
        organization=actor_membership.organization,
        matter=matter,
        requested_by=actor_membership,
        object_key=object_key,
        original_filename=clean_filename(filename=data["filename"]),
        expected_size=data["size"],
        expected_content_type=data["content_type"].lower(),
        expected_checksum=data.get("checksum", ""),
        description=data.get("description", ""),
        status=UPLOAD_STATUS_INITIATED,
        expires_at=expires_at,
    )


def mark_upload_processing(*, session: UploadSession, actor_membership, request_id: str) -> None:
    session.status = UPLOAD_STATUS_PROCESSING
    session.completed_at = timezone.now()
    session.save(update_fields=["status", "completed_at", "updated_at"])
    record_activity(
        organization=session.organization,
        matter=session.matter,
        actor_membership=actor_membership,
        actor_user=actor_membership.user,
        action=ACTION_DOCUMENT_UPLOAD_COMPLETED,
        target_type="upload_session",
        target_id=session.id,
        after_values={
            "id": str(session.id),
            "matter_id": str(session.matter_id),
            "status": session.status,
        },
        request_id=request_id,
    )
    create_upload_outbox(session=session)


def upload_completion_body(*, session: UploadSession) -> dict:
    return {
        "id": str(session.id),
        "matter_id": str(session.matter_id),
        "requested_by_id": str(session.requested_by_id),
        "original_filename": session.original_filename,
        "expected_size": session.expected_size,
        "expected_content_type": session.expected_content_type,
        "expected_checksum": session.expected_checksum,
        "description": session.description,
        "status": session.status,
        "expires_at": session.expires_at.isoformat().replace("+00:00", "Z"),
        "completed_at": session.completed_at.isoformat().replace("+00:00", "Z"),
        "failure_code": session.failure_code,
        "created_at": session.created_at.isoformat().replace("+00:00", "Z"),
        "updated_at": session.updated_at.isoformat().replace("+00:00", "Z"),
    }


def schedule_upload_processing(*, upload_id) -> None:
    celery_app.send_task("documents.process_upload_session", args=[str(upload_id)])


def make_document_available(*, session_id, object_stat) -> None:
    with transaction.atomic():
        session = locked_upload_session(session_id=session_id)
        if session.status == UPLOAD_STATUS_AVAILABLE:
            return
        document = create_or_update_document(session=session, object_stat=object_stat)
        session.status = UPLOAD_STATUS_AVAILABLE
        session.save(update_fields=["status", "updated_at"])
        record_document_available(document=document)
        create_document_outbox(document=document)


def create_or_update_document(*, session: UploadSession, object_stat) -> Document:
    document, _ = Document.objects.update_or_create(
        upload_session=session,
        defaults=document_defaults(session=session, object_stat=object_stat),
    )
    return document


def document_defaults(*, session: UploadSession, object_stat) -> dict:
    return {
        "organization": session.organization,
        "matter": session.matter,
        "object_key": session.object_key,
        "original_filename": session.original_filename,
        "content_type": session.expected_content_type,
        "size": stat_size(object_stat=object_stat),
        "checksum": session.expected_checksum,
        "status": DOCUMENT_STATUS_AVAILABLE,
        "description": session.description,
        "uploaded_by": session.requested_by,
        "available_at": timezone.now(),
    }


def mark_upload_failed(*, session_id, failure_code: str) -> None:
    UploadSession.objects.filter(id=session_id).update(
        status=UPLOAD_STATUS_FAILED,
        failure_code=failure_code[:64],
        updated_at=timezone.now(),
    )


def record_document_available(*, document: Document) -> None:
    record_activity(
        organization=document.organization,
        matter=document.matter,
        actor_membership=document.uploaded_by,
        actor_user=document.uploaded_by.user,
        action=ACTION_DOCUMENT_AVAILABLE,
        target_type="document",
        target_id=document.id,
        after_values={
            "id": str(document.id),
            "matter_id": str(document.matter_id),
            "status": document.status,
        },
    )


def create_upload_outbox(*, session: UploadSession) -> None:
    create_outbox_event(
        organization=session.organization,
        event_type="document.upload.status_changed",
        aggregate_type="upload_session",
        aggregate_id=session.id,
        payload={
            "id": str(session.id),
            "matter_id": str(session.matter_id),
            "status": session.status,
        },
    )


def create_document_outbox(*, document: Document) -> None:
    create_outbox_event(
        organization=document.organization,
        event_type="document.upload.status_changed",
        aggregate_type="document",
        aggregate_id=document.id,
        payload={
            "id": str(document.id),
            "matter_id": str(document.matter_id),
            "status": document.status,
        },
    )


def record_upload_initiated(*, session: UploadSession, actor_membership, request_id: str) -> None:
    record_activity(
        organization=session.organization,
        matter=session.matter,
        actor_membership=actor_membership,
        actor_user=actor_membership.user,
        action=ACTION_DOCUMENT_UPLOAD_INITIATED,
        target_type="upload_session",
        target_id=session.id,
        after_values={
            "id": str(session.id),
            "matter_id": str(session.matter_id),
            "status": session.status,
        },
        request_id=request_id,
    )
    create_upload_outbox(session=session)


def upload_response(*, session: UploadSession) -> dict:
    url = presign_upload_object(
        object_key=session.object_key,
        expires_in_seconds=settings.MINIO_PRESIGNED_UPLOAD_TTL_SECONDS,
    )
    return {
        "upload": session,
        "instructions": {
            "method": "PUT",
            "url": url,
            "headers": {"Content-Type": session.expected_content_type},
            "fields": {},
            "expires_at": session.expires_at,
            "completion_url": f"/api/v1/documents/uploads/{session.id}/complete/",
            "polling_url": f"/api/v1/documents/uploads/{session.id}/",
        },
    }


def expired_upload_queryset():
    return (
        UploadSession.objects.filter(
            status=UPLOAD_STATUS_INITIATED,
            expires_at__lte=timezone.now(),
            document__isnull=True,
        )
        .select_related("matter", "organization", "requested_by")
        .order_by("expires_at", "created_at")
    )


def mark_session_expired(*, session: UploadSession) -> bool:
    updated = UploadSession.objects.filter(
        id=session.id,
        status=UPLOAD_STATUS_INITIATED,
        document__isnull=True,
    ).update(
        status=UPLOAD_STATUS_EXPIRED,
        updated_at=timezone.now(),
    )
    return updated == 1


def build_object_key(*, organization_id, matter_id, upload_id, filename: str) -> str:
    extension = file_extension(filename=clean_filename(filename=filename))
    path = PurePosixPath(
        "organizations",
        str(organization_id),
        "matters",
        str(matter_id),
        "uploads",
        f"{upload_id}{extension}",
    )
    return str(path)


def clean_filename(*, filename: str) -> str:
    cleaned = filename.replace("\\", "/").split("/")[-1].strip()
    if not cleaned:
        raise_policy_error()
    return cleaned[:255]


def file_extension(*, filename: str) -> str:
    return PurePosixPath(filename).suffix.lower()


def upload_expiry():
    return timezone.now() + timedelta(seconds=settings.MINIO_PRESIGNED_UPLOAD_TTL_SECONDS)


def raise_policy_error() -> None:
    raise DomainRuleError(
        _("File type or upload policy is not allowed."), code="upload_policy_violation"
    )
