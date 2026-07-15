"""Offboarding API views."""

from __future__ import annotations

from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.offboarding.api.v1.openapi import execute_schema, preview_schema, retrieve_schema
from apps.offboarding.api.v1.serializers import (
    OffboardingExecuteRequestSerializer,
    OffboardingPreviewRequestSerializer,
    OffboardingPreviewSerializer,
    OffboardingRunSerializer,
)
from apps.offboarding.selectors import offboarding_run_get_for_admin
from apps.offboarding.services import (
    execute_offboarding,
    offboarding_run_response,
    preview_offboarding,
)


@preview_schema
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def preview(request):
    serializer = OffboardingPreviewRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    snapshot = preview_offboarding(actor=request.user, data=serializer.validated_data)
    return Response(OffboardingPreviewSerializer(snapshot).data)


@execute_schema
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def execute(request):
    serializer = OffboardingExecuteRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    status_code, body = execute_offboarding(
        actor=request.user,
        data=serializer.validated_data,
        idempotency_key=idempotency_key_from_request(request=request),
        request_id=getattr(request, "request_id", ""),
    )
    return Response(OffboardingRunSerializer(body).data, status=status_code)


@retrieve_schema
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def retrieve(request, run_id):
    run = offboarding_run_get_for_admin(actor=request.user, run_id=run_id)
    return Response(OffboardingRunSerializer(offboarding_run_response(run=run)).data)


def idempotency_key_from_request(*, request) -> str:
    key = request.headers.get("Idempotency-Key", "").strip()
    if not key:
        raise ValidationError({"Idempotency-Key": ["This header is required."]})
    return key
