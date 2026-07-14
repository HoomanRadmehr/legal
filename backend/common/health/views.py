"""Safe health endpoints."""

from __future__ import annotations

from django.core.cache import cache
from django.db import DatabaseError, connection
from drf_spectacular.utils import extend_schema
from redis.exceptions import RedisError
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from common.health.serializers import HealthResponseSerializer


@extend_schema(operation_id="health_live", responses={200: HealthResponseSerializer})
@api_view(["GET"])
@permission_classes([AllowAny])
def live(request):
    return Response({"status": "ok"})


@extend_schema(
    operation_id="health_ready",
    responses={200: HealthResponseSerializer, 503: HealthResponseSerializer},
)
@api_view(["GET"])
@permission_classes([AllowAny])
def ready(request):
    checks = readiness_checks()
    is_ready = all(value == "ok" for value in checks.values())
    status_code = 200 if is_ready else 503
    status_label = "ready" if is_ready else "unavailable"
    return Response({"status": status_label, "checks": checks}, status=status_code)


def readiness_checks() -> dict[str, str]:
    return {
        "database": dependency_status(database_ready()),
        "cache": dependency_status(cache_ready()),
    }


def database_ready() -> bool:
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
    except DatabaseError:
        return False
    return True


def cache_ready() -> bool:
    try:
        cache.get("health:ready")
    except (ConnectionError, OSError, RedisError, TimeoutError):
        return False
    return True


def dependency_status(is_ready: bool) -> str:
    if is_ready:
        return "ok"
    return "unavailable"
