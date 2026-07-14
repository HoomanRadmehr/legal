"""Explicit optimistic concurrency helpers."""

from __future__ import annotations

from django.db.models import F, QuerySet
from django.utils.translation import gettext_lazy as _

from common.api.errors import ConflictError


def require_version(
    *,
    current_version: int,
    expected_version: int,
    conflict_code: str = "version_conflict",
) -> None:
    if current_version != expected_version:
        raise ConflictError(
            detail=_("The record was changed by another request."),
            code=conflict_code,
        )


def update_with_expected_version(
    *,
    queryset: QuerySet,
    expected_version: int,
    values: dict,
    conflict_code: str = "version_conflict",
) -> int:
    update_values = dict(values)
    if "version" in update_values:
        raise ValueError("Version is managed by update_with_expected_version.")

    update_values["version"] = F("version") + 1
    updated_count = queryset.filter(version=expected_version).update(**update_values)
    if updated_count == 0:
        raise ConflictError(
            detail=_("The record was changed by another request."),
            code=conflict_code,
        )
    return updated_count
