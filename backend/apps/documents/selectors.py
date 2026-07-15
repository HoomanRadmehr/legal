"""Read selectors for direct document uploads."""

from __future__ import annotations

from rest_framework.exceptions import NotFound

from apps.accounts.selectors import get_current_membership
from apps.documents.models import Document
from apps.matters.models import Matter
from apps.matters.permissions import filter_visible_matters, require_matter_view


def document_base_queryset():
    return Document.objects.select_related(
        "organization",
        "matter",
        "uploaded_by",
        "uploaded_by__user",
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


def document_get_for_download(*, actor, document_id) -> Document:
    document = document_get(actor=actor, document_id=document_id)
    membership = get_current_membership(user=actor)
    if membership is None:
        raise NotFound("Not found.")
    require_matter_view(membership=membership, matter=document.matter)
    return document
