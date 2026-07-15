from __future__ import annotations

import pytest

from apps.cases.api.v1.filters import CaseFilter
from apps.cases.api.v1.viewsets import CaseViewSet
from apps.deadlines.api.v1.filters import DeadlineFilter
from apps.deadlines.api.v1.viewsets import DeadlineViewSet
from apps.documents.api.v1.viewsets import DocumentViewSet
from apps.documents.models import Document
from apps.matters.models import Matter
from apps.tasks.api.v1.filters import TaskFilter
from apps.tasks.api.v1.viewsets import TaskViewSet
from apps.tasks.models import Task


def test_filtersets_use_explicit_fields() -> None:
    assert CaseFilter.Meta.fields != "__all__"
    assert DeadlineFilter.Meta.fields != "__all__"
    assert TaskFilter.Meta.fields != "__all__"
    assert set(CaseFilter.Meta.fields) >= {"status", "priority", "owner", "search"}
    assert set(DeadlineFilter.Meta.fields) >= {"matter", "assignee", "status", "due_after"}
    assert set(TaskFilter.Meta.fields) >= {"matter", "assignee", "status", "due_after"}


@pytest.mark.parametrize(
    ("viewset", "forbidden"),
    (
        (CaseViewSet, "description"),
        (DeadlineViewSet, "title"),
        (TaskViewSet, "title"),
        (DocumentViewSet, "object_key"),
    ),
)
def test_ordering_allowlists_exclude_unreviewed_fields(viewset, forbidden: str) -> None:
    assert "__all__" not in viewset.ordering_fields
    assert forbidden not in viewset.ordering_fields


def test_representative_indexes_cover_dashboard_and_list_paths() -> None:
    matter_indexes = index_fields(model=Matter)
    task_indexes = index_fields(model=Task)
    document_indexes = index_fields(model=Document)

    assert ("organization", "kind", "priority") in matter_indexes
    assert ("organization", "kind", "created_at") in matter_indexes
    assert ("organization", "kind", "archived_at") in matter_indexes
    assert ("organization", "assignee", "status", "due_at") in task_indexes
    assert ("organization", "original_filename") in document_indexes


def index_fields(*, model) -> set[tuple[str, ...]]:
    return {tuple(index.fields) for index in model._meta.indexes}
