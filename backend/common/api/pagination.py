"""Common pagination primitives."""

from __future__ import annotations

from urllib.parse import parse_qs, urlparse

from rest_framework.exceptions import NotFound
from rest_framework.pagination import CursorPagination, PageNumberPagination
from rest_framework.response import Response

from common.api.errors import InvalidInputError


class DefaultPagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = "page_size"
    max_page_size = 100


class ChoiceCursorPagination(CursorPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 50
    ordering = ("-created_at", "-id")

    def paginate_queryset(self, queryset, request, view=None):
        try:
            return super().paginate_queryset(queryset, request, view)
        except NotFound as error:
            raise InvalidInputError({"cursor": [str(error.detail)]}) from error

    def get_paginated_response(self, data):
        next_link = self.get_next_link()
        return Response(
            {
                "next_cursor": cursor_from_link(link=next_link),
                "has_more": next_link is not None,
                "results": data,
            }
        )


def cursor_from_link(*, link: str | None) -> str | None:
    if link is None:
        return None
    parsed = urlparse(link)
    values = parse_qs(parsed.query).get("cursor")
    if not values:
        return None
    return values[0]
