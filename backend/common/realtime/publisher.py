"""Small helpers for publishing safe user realtime events."""

from __future__ import annotations

import uuid

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.utils import timezone

EVENT_DOCUMENT_UPLOAD_STATUS_CHANGED = "document.upload.status_changed"
EVENT_NOTIFICATION_CREATED = "notification.created"
EVENT_DEADLINE_REMINDER_CREATED = "deadline.reminder.created"
EVENT_OFFBOARDING_STATUS_CHANGED = "offboarding.status_changed"
PUBLISHED = "published"
NO_CHANNEL_LAYER = "no_channel_layer"
MISSING_EVENT_PAYLOAD = "missing_event_payload"


def user_group_name(*, user_id) -> str:
    return f"user.{user_id}"


def publish_user_event(*, user_id, event_type: str, data: dict, version: int = 1) -> str:
    channel_layer = get_channel_layer()
    if channel_layer is None:
        return NO_CHANNEL_LAYER
    event = build_user_event(event_type=event_type, data=data, version=version)
    async_to_sync(channel_layer.group_send)(
        user_group_name(user_id=user_id),
        {"type": "user.event", "event": event},
    )
    return PUBLISHED


def publish_upload_status(*, user_id, document_id, status: str, progress: int | None = None) -> str:
    data = {
        "document_id": str(document_id),
        "upload_id": str(document_id),
        "status": status,
    }
    if progress is not None:
        data["progress"] = normalized_progress(progress=progress)
    return publish_user_event(
        user_id=user_id,
        event_type=EVENT_DOCUMENT_UPLOAD_STATUS_CHANGED,
        data=data,
    )


def publish_upload_status_from_payload(*, payload: dict) -> str:
    user_id = payload.get("user_id") or payload.get("requested_by_id")
    document_id = payload.get("document_id") or payload.get("upload_id") or payload.get("id")
    status = payload.get("status")
    if not user_id or not document_id or not status:
        return MISSING_EVENT_PAYLOAD
    return publish_upload_status(
        user_id=user_id,
        document_id=document_id,
        status=status,
        progress=payload.get("progress"),
    )


def build_user_event(*, event_type: str, data: dict, version: int = 1) -> dict:
    return {
        "event_id": str(uuid.uuid4()),
        "event_type": event_type,
        "version": version,
        "occurred_at": timezone.now().isoformat().replace("+00:00", "Z"),
        "data": safe_event_data(event_type=event_type, data=data),
    }


def safe_event_data(*, event_type: str, data: dict) -> dict:
    if event_type == EVENT_DOCUMENT_UPLOAD_STATUS_CHANGED:
        return upload_status_data(data=data)
    if event_type == EVENT_NOTIFICATION_CREATED:
        return notification_data(data=data)
    if event_type == EVENT_DEADLINE_REMINDER_CREATED:
        return deadline_reminder_data(data=data)
    if event_type == EVENT_OFFBOARDING_STATUS_CHANGED:
        return offboarding_status_data(data=data)
    return {}


def upload_status_data(*, data: dict) -> dict:
    document_id = data.get("document_id") or data.get("upload_id")
    safe_data = {
        "document_id": str(document_id),
        "upload_id": str(document_id),
        "status": str(data["status"]),
    }
    if data.get("progress") is not None:
        safe_data["progress"] = normalized_progress(progress=data["progress"])
    return safe_data


def notification_data(*, data: dict) -> dict:
    return {"notification_id": str(data["notification_id"])}


def deadline_reminder_data(*, data: dict) -> dict:
    return {"deadline_id": str(data["deadline_id"])}


def offboarding_status_data(*, data: dict) -> dict:
    return {"run_id": str(data["run_id"]), "status": str(data["status"])}


def normalized_progress(*, progress) -> int:
    value = int(progress)
    return min(100, max(0, value))
