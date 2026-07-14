"""Read selectors for document upload sessions."""

from __future__ import annotations

from rest_framework.exceptions import NotFound

from apps.accounts.selectors import get_current_membership
from apps.documents.models import Document, UploadSession
from apps.matters.models import Matter
from apps.matters.permissions import filter_visible_matters, require_matter_view


def upload_session_base_queryset():
    return UploadSession.objects.select_related(
        "organization",
        "matter",
        "requested_by",
        "requested_by__user",
    )


def upload_session_get(*, actor, upload_id) -> UploadSession:
    membership = get_current_membership(user=actor)
    if membership is None:
        raise NotFound("Not found.")

    session = (
        upload_session_base_queryset()
        .filter(
            id=upload_id,
            organization=membership.organization,
        )
        .first()
    )
    if session is None:
        raise NotFound("Not found.")

    require_matter_view(membership=membership, matter=session.matter)
    return session


def document_base_queryset():
    return Document.objects.select_related(
        "organization",
        "matter",
        "uploaded_by",
        "uploaded_by__user",
        "upload_session",
    )


def document_list(*, actor):
    membership = get_current_membership(user=actor)
    if membership is None:
        return Document.objects.none()

    visible_matters = filter_visible_matters(
        queryset=Matter.objects.filter(organization=membership.organization),
        membership=membership,
    )
    return document_base_queryset().filter(
        organization=membership.organization,
        matter__in=visible_matters,
    )


def document_get(*, actor, document_id) -> Document:
    document = document_list(actor=actor).filter(id=document_id).first()
    if document is None:
        raise NotFound("Not found.")
    return document
