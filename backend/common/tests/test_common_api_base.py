from __future__ import annotations

from django.db import models
from rest_framework.exceptions import MethodNotAllowed
from rest_framework.test import APIRequestFactory

from common.api.filters import CommonFilterSet
from common.api.pagination import DefaultPagination
from common.api.serializers import CommonModelSerializer
from common.api.viewsets import CommonModelViewSet
from common.models import CommonModel


def test_common_model_contains_only_uuid_and_timestamps() -> None:
    fields = {field.name for field in CommonModel._meta.fields}

    assert CommonModel._meta.abstract is True
    assert fields == {"id", "created_at", "updated_at"}
    assert isinstance(CommonModel._meta.get_field("id"), models.UUIDField)


def test_common_model_serializer_declares_common_read_only_fields() -> None:
    assert CommonModelSerializer.Meta.read_only_fields == ("id", "created_at", "updated_at")


def test_common_filterset_does_not_expose_all_model_fields() -> None:
    meta = getattr(CommonFilterSet, "Meta", None)

    assert meta is None or getattr(meta, "fields", None) != "__all__"


def test_common_viewset_disables_destroy_by_default() -> None:
    request = APIRequestFactory().delete("/api/v1/example/1/")

    try:
        CommonModelViewSet().destroy(request)
    except MethodNotAllowed as exc:
        assert exc.get_codes() == "method_not_allowed"
        assert "Hard delete" in str(exc.detail)
    else:
        raise AssertionError("destroy should be denied by default")


def test_common_viewset_uses_standard_filtering_and_pagination() -> None:
    backend_names = {backend.__name__ for backend in CommonModelViewSet.filter_backends}

    assert "DjangoFilterBackend" in backend_names
    assert "OrderingFilter" in backend_names
    assert CommonModelViewSet.ordering == ("-created_at",)
    assert CommonModelViewSet.ordering_fields == ("created_at", "updated_at")
    assert CommonModelViewSet.pagination_class is DefaultPagination


def test_default_pagination_has_safe_maximum() -> None:
    assert DefaultPagination.page_size == 25
    assert DefaultPagination.page_size_query_param == "page_size"
    assert DefaultPagination.max_page_size == 100
