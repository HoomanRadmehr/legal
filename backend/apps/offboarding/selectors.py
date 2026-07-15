"""Read selectors for offboarding."""

from __future__ import annotations

import hashlib

from rest_framework.exceptions import NotFound

from apps.deadlines.models import STATUS_OPEN as DEADLINE_STATUS_OPEN
from apps.deadlines.models import Deadline
from apps.matters.models import STATUS_ARCHIVED, Matter, MatterAccess
from apps.offboarding.models import OffboardingRun
from apps.organizations.selectors import require_membership_admin
from apps.tasks.models import OPEN_TASK_STATUSES, Task
from common.services.idempotency import request_hash_for_payload


def offboarding_run_get_for_admin(*, actor, run_id) -> OffboardingRun:
    actor_membership = require_membership_admin(actor=actor)
    run = (
        OffboardingRun.objects.select_related(
            "organization",
            "departing_membership",
            "departing_membership__user",
            "replacement_membership",
            "replacement_membership__user",
            "initiated_by",
            "initiated_by__user",
        )
        .filter(id=run_id, organization=actor_membership.organization)
        .first()
    )
    if run is None:
        raise NotFound("Not found.")
    return run


def build_preview_snapshot(*, departing, replacement) -> dict:
    snapshot = {
        "departing": membership_summary(membership=departing),
        "replacement": membership_summary(membership=replacement),
        "owned_matters": matter_summaries(membership=departing),
        "open_tasks": task_summaries(membership=departing),
        "open_deadlines": deadline_summaries(membership=departing),
        "active_access_grants": access_summaries(membership=departing),
        "warnings": [],
    }
    snapshot["counts"] = preview_counts(snapshot=snapshot)
    snapshot["fingerprint"] = preview_fingerprint(snapshot=snapshot)
    return snapshot


def owned_matters(*, membership):
    return Matter.objects.filter(
        organization=membership.organization,
        owner=membership,
        archived_at__isnull=True,
    ).exclude(status=STATUS_ARCHIVED)


def open_tasks(*, membership):
    return Task.objects.filter(
        organization=membership.organization,
        assignee=membership,
        status__in=OPEN_TASK_STATUSES,
    )


def open_deadlines(*, membership):
    return Deadline.objects.filter(
        organization=membership.organization,
        assignee=membership,
        status=DEADLINE_STATUS_OPEN,
    )


def active_grants(*, membership):
    return MatterAccess.objects.filter(
        organization=membership.organization,
        membership=membership,
        revoked_at__isnull=True,
    )


def membership_summary(*, membership) -> dict:
    return {
        "id": str(membership.id),
        "display_name": membership.user.get_full_name().strip() or membership.user.username,
        "role": membership.role,
    }


def matter_summaries(*, membership) -> list[dict]:
    return [
        matter_summary(matter=matter)
        for matter in owned_matters(membership=membership).order_by("reference_code")
    ]


def matter_summary(*, matter) -> dict:
    return {
        "id": str(matter.id),
        "reference_code": matter.reference_code,
        "title": matter.title,
        "version": matter.version,
    }


def task_summaries(*, membership) -> list[dict]:
    return [
        work_summary(work=task)
        for task in open_tasks(membership=membership).order_by("created_at", "id")
    ]


def deadline_summaries(*, membership) -> list[dict]:
    return [
        work_summary(work=deadline)
        for deadline in open_deadlines(membership=membership).order_by("due_at", "id")
    ]


def work_summary(*, work) -> dict:
    return {
        "id": str(work.id),
        "matter_id": str(work.matter_id),
        "title": work.title,
        "version": work.version,
    }


def access_summaries(*, membership) -> list[dict]:
    return [
        {
            "id": str(grant.id),
            "matter_id": str(grant.matter_id),
            "level": grant.level,
        }
        for grant in active_grants(membership=membership).order_by("matter_id", "id")
    ]


def preview_counts(*, snapshot: dict) -> dict:
    return {
        "owned_matters": len(snapshot["owned_matters"]),
        "open_tasks": len(snapshot["open_tasks"]),
        "open_deadlines": len(snapshot["open_deadlines"]),
        "active_access_grants": len(snapshot["active_access_grants"]),
    }


def preview_fingerprint(*, snapshot: dict) -> str:
    payload = {
        "departing_id": snapshot["departing"]["id"],
        "replacement_id": snapshot["replacement"]["id"],
        "owned_matters": id_versions(items=snapshot["owned_matters"]),
        "open_tasks": id_versions(items=snapshot["open_tasks"]),
        "open_deadlines": id_versions(items=snapshot["open_deadlines"]),
        "active_access_grants": ids_only(items=snapshot["active_access_grants"]),
    }
    return hashlib.sha256(request_hash_for_payload(payload=payload).encode("utf-8")).hexdigest()


def id_versions(*, items: list[dict]) -> list[tuple[str, int]]:
    return [(item["id"], item["version"]) for item in items]


def ids_only(*, items: list[dict]) -> list[str]:
    return [item["id"] for item in items]
