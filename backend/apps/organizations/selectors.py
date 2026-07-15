"""Read selectors for organization membership."""

from __future__ import annotations

from django.db.models import QuerySet
from django.utils.translation import gettext_lazy as _
from rest_framework.exceptions import NotFound, PermissionDenied

from apps.organizations.models import ROLE_LEGAL_ADMIN, STATUS_ACTIVE, Membership, Organization


def get_active_membership(*, actor, organization: Organization) -> Membership | None:
    return (
        Membership.objects.select_related("organization", "user")
        .filter(
            organization=organization,
            organization__is_active=True,
            status=STATUS_ACTIVE,
            user=actor,
            user__is_active=True,
        )
        .first()
    )


def list_admin_memberships(*, organization: Organization) -> QuerySet[Membership]:
    return (
        Membership.objects.select_related("organization", "user")
        .filter(
            organization=organization,
            organization__is_active=True,
            role=ROLE_LEGAL_ADMIN,
            status=STATUS_ACTIVE,
            user__is_active=True,
        )
        .order_by("user__username")
    )


def membership_list_for_admin(*, actor) -> QuerySet[Membership]:
    actor_membership = require_membership_admin(actor=actor)
    return (
        Membership.objects.select_related("organization", "user")
        .filter(
            organization=actor_membership.organization,
            organization__is_active=True,
            status=STATUS_ACTIVE,
        )
        .order_by("user__username")
    )


def membership_get_for_admin(*, actor, membership_id) -> Membership:
    membership = membership_list_for_admin(actor=actor).filter(id=membership_id).first()
    if membership is None:
        raise NotFound("Not found.")
    return membership


def require_membership_admin(*, actor) -> Membership:
    membership = get_active_membership_for_user(actor=actor)
    if membership is None or membership.role != ROLE_LEGAL_ADMIN:
        raise PermissionDenied(_("Only legal administrators may perform this action."))
    return membership


def get_active_membership_for_user(*, actor) -> Membership | None:
    return (
        Membership.objects.select_related("organization", "user")
        .filter(
            organization__is_active=True,
            status=STATUS_ACTIVE,
            user=actor,
            user__is_active=True,
        )
        .order_by("joined_at")
        .first()
    )
