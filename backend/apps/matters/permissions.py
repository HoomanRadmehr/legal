"""Explicit matter visibility and edit permission helpers."""

from __future__ import annotations

from django.db.models import Q
from django.utils.translation import gettext_lazy as _
from rest_framework.exceptions import PermissionDenied

from apps.matters.models import ACCESS_LEVEL_EDIT, ACCESS_LEVEL_VIEW
from apps.organizations.permissions import (
    is_active_membership,
    is_admin_or_manager,
    is_counsel,
    is_viewer,
    resolve_active_membership,
)
from common.permissions import CommonPermission

VISIBLE_ACCESS_LEVELS = (ACCESS_LEVEL_VIEW, ACCESS_LEVEL_EDIT)
EDIT_ACCESS_LEVELS = (ACCESS_LEVEL_EDIT,)
WRITE_ACTIONS = {"create", "update", "partial_update", "archive"}


class MatterPermission(CommonPermission):
    def has_object_permission(self, request, view, obj) -> bool:
        user = self.authenticated_user(request)
        if user is None:
            return False

        membership = resolve_active_membership(actor=user, organization=obj.organization)
        action = getattr(view, "action", "")
        if action in WRITE_ACTIONS:
            require_matter_edit(membership=membership, matter=obj)
            return True

        require_matter_view(membership=membership, matter=obj)
        return True


def filter_visible_matters(*, queryset, membership):
    if not is_active_membership(membership=membership):
        return queryset.none()

    queryset = queryset.filter(organization=membership.organization)
    if is_admin_or_manager(membership=membership):
        return queryset
    if is_counsel(membership=membership):
        return filter_counsel_visible_matters(queryset=queryset, membership=membership)
    if is_viewer(membership=membership):
        return filter_granted_matters(queryset=queryset, membership=membership)
    return queryset.none()


def filter_counsel_visible_matters(*, queryset, membership):
    return queryset.filter(
        Q(owner=membership)
        | active_grant_query(membership=membership, levels=VISIBLE_ACCESS_LEVELS)
    ).distinct()


def filter_granted_matters(*, queryset, membership):
    return queryset.filter(
        active_grant_query(membership=membership, levels=VISIBLE_ACCESS_LEVELS)
    ).distinct()


def active_grant_query(*, membership, levels: tuple[str, ...]) -> Q:
    return Q(
        access_grants__membership=membership,
        access_grants__level__in=levels,
        access_grants__revoked_at__isnull=True,
    )


def can_view_matter(*, membership, matter) -> bool:
    if not is_same_active_organization(membership=membership, matter=matter):
        return False
    if is_admin_or_manager(membership=membership):
        return True
    if is_counsel(membership=membership) and is_matter_owner(membership=membership, matter=matter):
        return True
    return has_active_grant(membership=membership, matter=matter, levels=VISIBLE_ACCESS_LEVELS)


def can_edit_matter(*, membership, matter) -> bool:
    if not is_same_active_organization(membership=membership, matter=matter):
        return False
    if is_admin_or_manager(membership=membership):
        return True
    if not is_counsel(membership=membership):
        return False
    if is_matter_owner(membership=membership, matter=matter):
        return True
    return has_active_grant(membership=membership, matter=matter, levels=EDIT_ACCESS_LEVELS)


def require_matter_view(*, membership, matter) -> None:
    if not can_view_matter(membership=membership, matter=matter):
        CommonPermission().deny_not_visible()


def require_matter_edit(*, membership, matter) -> None:
    if not can_view_matter(membership=membership, matter=matter):
        CommonPermission().deny_not_visible()
    if not can_edit_matter(membership=membership, matter=matter):
        raise PermissionDenied(_("You do not have permission to edit this matter."))


def is_same_active_organization(*, membership, matter) -> bool:
    if not is_active_membership(membership=membership):
        return False
    return membership.organization_id == matter.organization_id


def is_matter_owner(*, membership, matter) -> bool:
    return membership.id == matter.owner_id


def has_active_grant(*, membership, matter, levels: tuple[str, ...]) -> bool:
    for grant in matter_grants(matter=matter):
        if active_grant_matches(grant=grant, membership=membership, levels=levels):
            return True
    return False


def matter_grants(*, matter):
    grants = getattr(matter, "access_grants", ())
    if hasattr(grants, "all"):
        return grants.all()
    return grants


def active_grant_matches(*, grant, membership, levels: tuple[str, ...]) -> bool:
    if getattr(grant, "revoked_at", None) is not None:
        return False
    if getattr(grant, "membership_id", None) != membership.id:
        return False
    return getattr(grant, "level", None) in levels
