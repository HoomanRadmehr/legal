"""Tests for optimistic concurrency primitives."""

from __future__ import annotations

import pytest

from apps.matters.models import Matter
from apps.matters.tests.factories import MatterFactory
from common.api.errors import ConflictError
from common.services.versioning import require_version, update_with_expected_version

pytestmark = pytest.mark.django_db


def test_require_version_accepts_matching_expected_version() -> None:
    require_version(current_version=3, expected_version=3)


def test_require_version_raises_409_for_stale_version() -> None:
    with pytest.raises(ConflictError) as exc_info:
        require_version(
            current_version=3,
            expected_version=2,
            conflict_code="case_version_conflict",
        )

    assert exc_info.value.status_code == 409
    assert exc_info.value.get_codes() == "case_version_conflict"


def test_update_with_expected_version_updates_and_increments_atomically() -> None:
    matter = MatterFactory(version=1, title="Old title")

    updated_count = update_with_expected_version(
        queryset=Matter.objects.filter(id=matter.id),
        expected_version=1,
        values={"title": "New title"},
    )

    matter.refresh_from_db()
    assert updated_count == 1
    assert matter.title == "New title"
    assert matter.version == 2


def test_update_with_expected_version_raises_409_for_stale_write() -> None:
    matter = MatterFactory(version=2, title="Original title")

    with pytest.raises(ConflictError) as exc_info:
        update_with_expected_version(
            queryset=Matter.objects.filter(id=matter.id),
            expected_version=1,
            values={"title": "Overwritten title"},
        )

    matter.refresh_from_db()
    assert exc_info.value.status_code == 409
    assert exc_info.value.get_codes() == "version_conflict"
    assert matter.title == "Original title"
    assert matter.version == 2


def test_update_with_expected_version_rejects_manual_version_value() -> None:
    matter = MatterFactory(version=1)

    with pytest.raises(ValueError):
        update_with_expected_version(
            queryset=Matter.objects.filter(id=matter.id),
            expected_version=1,
            values={"version": 8},
        )
