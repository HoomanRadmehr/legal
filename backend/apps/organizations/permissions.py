"""Explicit role permission helpers for organizations."""

from __future__ import annotations

from django.utils.translation import gettext_lazy as _
from rest_framework.exceptions import PermissionDenied

from apps.organizations.models import (
    ROLE_LEGAL_ADMIN,
    ROLE_LEGAL_COUNSEL,
    ROLE_LEGAL_MANAGER,
    ROLE_VIEWER,
    STATUS_ACTIVE,
)
from apps.organizations.selectors import get_active_membership
from common.permissions import CommonPermission


class OrganizationPermission(CommonPermission):
    def has_object_permission(self, request, view, obj) -> bool:
        user = self.authenticated_user(request)
        if user is None:
            return False

        membership = resolve_active_membership(actor=user, organization=obj)
        action = getattr(view, "action", "")
        if action in {"update", "partial_update", "destroy", "offboard"}:
            return is_admin(membership=membership)
        return membership is not None


def is_active_membership(*, membership) -> bool:
    if membership is None:
        return False
    return membership.status == STATUS_ACTIVE and membership.user.is_active


def resolve_active_membership(*, actor, organization):
    return get_active_membership(actor=actor, organization=organization)


def is_admin(*, membership) -> bool:
    return is_active_membership(membership=membership) and membership.role == ROLE_LEGAL_ADMIN


def is_manager(*, membership) -> bool:
    return is_active_membership(membership=membership) and membership.role == ROLE_LEGAL_MANAGER


def is_counsel(*, membership) -> bool:
    return is_active_membership(membership=membership) and membership.role == ROLE_LEGAL_COUNSEL


def is_viewer(*, membership) -> bool:
    return is_active_membership(membership=membership) and membership.role == ROLE_VIEWER


def is_admin_or_manager(*, membership) -> bool:
    return is_admin(membership=membership) or is_manager(membership=membership)


def require_admin(*, membership) -> None:
    if not is_admin(membership=membership):
        raise PermissionDenied(_("Only legal administrators may perform this action."))


def require_manager(*, membership) -> None:
    if not is_admin_or_manager(membership=membership):
        raise PermissionDenied(_("Only legal administrators or managers may perform this action."))
