"""Common ViewSet primitives."""

from __future__ import annotations

from django.utils.translation import gettext_lazy as _
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets
from rest_framework.exceptions import MethodNotAllowed

from common.api.pagination import DefaultPagination


class CommonModelViewSet(viewsets.ModelViewSet):
    filter_backends = (DjangoFilterBackend, filters.OrderingFilter)
    ordering = ("-created_at",)
    ordering_fields = ("created_at", "updated_at")
    pagination_class = DefaultPagination

    def destroy(self, request, *args, **kwargs):
        raise MethodNotAllowed("DELETE", detail=_("Hard delete is not allowed."))
