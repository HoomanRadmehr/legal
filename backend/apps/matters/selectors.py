"""Read selectors for matter visibility."""

from __future__ import annotations

from django.db.models import Q
from rest_framework.exceptions import NotFound

from apps.accounts.selectors import get_current_membership
from apps.matters.models import ACCESS_LEVEL_EDIT, KIND_CASE, KIND_CONTRACT, KIND_NOTICE, Matter
from apps.matters.permissions import active_grant_query, filter_visible_matters
from apps.organizations.permissions import (
    is_admin_or_manager,
    is_counsel,
    resolve_active_membership,
)

MATTER_CHOICE_PURPOSE_LINK = "link"
MATTER_CHOICE_PURPOSE_DOCUMENT_UPLOAD = "document_upload"
MATTER_CHOICE_PURPOSE_DEADLINE_CREATE = "deadline_create"
MATTER_CHOICE_PURPOSE_TASK_CREATE = "task_create"
MATTER_CHOICE_PURPOSE_NOTICE_RELATION = "notice_relation"
MATTER_VISIBLE_CHOICE_PURPOSES = (
    MATTER_CHOICE_PURPOSE_LINK,
    MATTER_CHOICE_PURPOSE_NOTICE_RELATION,
)
MATTER_EDIT_CHOICE_PURPOSES = (
    MATTER_CHOICE_PURPOSE_DOCUMENT_UPLOAD,
    MATTER_CHOICE_PURPOSE_DEADLINE_CREATE,
    MATTER_CHOICE_PURPOSE_TASK_CREATE,
)
MATTER_CHOICE_KINDS = (KIND_CASE, KIND_CONTRACT, KIND_NOTICE)


def matter_base_queryset():
    return Matter.objects.select_related(
        "organization",
        "owner",
        "owner__user",
        "created_by",
        "created_by__user",
    )


def matter_list(*, actor, organization):
    membership = resolve_active_membership(actor=actor, organization=organization)
    queryset = matter_base_queryset().filter(organization=organization)
    return filter_visible_matters(queryset=queryset, membership=membership)


def matter_get(*, actor, organization, matter_id) -> Matter:
    matter = matter_list(actor=actor, organization=organization).filter(id=matter_id).first()
    if matter is None:
        raise NotFound("Not found.")
    return matter


def matter_choices(
    *,
    actor,
    purpose: str,
    query: str = "",
    kind: str | None = None,
    exclude_matter_id=None,
):
    membership = get_current_membership(user=actor)
    if membership is None:
        return Matter.objects.none()
    queryset = matter_base_queryset().filter(organization=membership.organization)
    queryset = apply_matter_choice_purpose(
        queryset=queryset, membership=membership, purpose=purpose
    )
    queryset = apply_matter_choice_filters(
        queryset=queryset,
        kind=kind,
        exclude_matter_id=exclude_matter_id,
    )
    return search_matter_choices(queryset=queryset, query=query)


def apply_matter_choice_purpose(*, queryset, membership, purpose: str):
    if purpose in MATTER_VISIBLE_CHOICE_PURPOSES:
        return filter_visible_matters(queryset=queryset, membership=membership)
    if purpose in MATTER_EDIT_CHOICE_PURPOSES:
        return filter_editable_choice_matters(queryset=queryset, membership=membership)
    return queryset.none()


def filter_editable_choice_matters(*, queryset, membership):
    if is_admin_or_manager(membership=membership):
        return queryset
    if is_counsel(membership=membership):
        return queryset.filter(
            Q(owner=membership)
            | active_grant_query(membership=membership, levels=(ACCESS_LEVEL_EDIT,))
        ).distinct()
    return queryset.none()


def apply_matter_choice_filters(*, queryset, kind: str | None, exclude_matter_id=None):
    if kind in MATTER_CHOICE_KINDS:
        queryset = queryset.filter(kind=kind)
    if exclude_matter_id is not None:
        queryset = queryset.exclude(id=exclude_matter_id)
    return queryset


def search_matter_choices(*, queryset, query: str):
    value = query.strip()
    if not value:
        return queryset.order_by("-created_at", "-id")
    return queryset.filter(Q(title__icontains=value) | Q(reference_code__icontains=value)).order_by(
        "-created_at", "-id"
    )
