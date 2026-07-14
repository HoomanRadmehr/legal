"""Read selectors for matter visibility."""

from __future__ import annotations

from rest_framework.exceptions import NotFound

from apps.matters.models import Matter
from apps.matters.permissions import filter_visible_matters
from apps.organizations.permissions import resolve_active_membership


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
