"""Explicit activity recording helpers."""

from __future__ import annotations

from apps.activity.models import ActivityLog

SAFE_ACTIVITY_FIELDS = {
    "action",
    "actor_id",
    "aggregate_id",
    "aggregate_type",
    "id",
    "kind",
    "level",
    "matter_id",
    "organization_id",
    "owner_id",
    "priority",
    "reference_code",
    "request_id",
    "status",
    "target_id",
    "target_type",
    "title",
    "version",
}


def record_activity(
    *,
    organization,
    action: str,
    target_type: str,
    matter=None,
    actor_membership=None,
    actor_user=None,
    target_id=None,
    before_values=None,
    after_values=None,
    metadata=None,
    request_id: str = "",
) -> ActivityLog:
    return ActivityLog.objects.create(
        organization=organization,
        matter=matter,
        actor_membership=actor_membership,
        actor_user=actor_user,
        action=action,
        target_type=target_type,
        target_id=target_id,
        before_values=redact_activity_values(before_values or {}),
        after_values=redact_activity_values(after_values or {}),
        metadata=redact_activity_values(metadata or {}),
        request_id=request_id,
    )


def redact_activity_values(values: dict) -> dict:
    return {key: values[key] for key in values if key in SAFE_ACTIVITY_FIELDS}
