"""Read selectors for organization membership."""

from __future__ import annotations

from django.db.models import Q, QuerySet
from django.utils.translation import gettext_lazy as _
from rest_framework.exceptions import NotFound, PermissionDenied

from apps.organizations.models import (
    ROLE_LEGAL_ADMIN,
    ROLE_LEGAL_COUNSEL,
    ROLE_LEGAL_MANAGER,
    STATUS_ACTIVE,
    Membership,
    Organization,
)

MEMBERSHIP_CHOICE_PURPOSE_ASSIGNEE = "assignee"
MEMBERSHIP_CHOICE_PURPOSE_OFFBOARDING = "offboarding_replacement"
MEMBERSHIP_CHOICE_PURPOSE_OWNER = "owner"
MEMBERSHIP_CHOICE_ASSIGNABLE_ROLES = (
    ROLE_LEGAL_ADMIN,
    ROLE_LEGAL_MANAGER,
    ROLE_LEGAL_COUNSEL,
)


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


def membership_choices(
    *,
    actor,
    purpose: str,
    query: str = "",
    exclude_membership_id=None,
) -> QuerySet[Membership]:
    actor_membership = get_active_membership_for_user(actor=actor)
    if actor_membership is None:
        return Membership.objects.none()
    queryset = active_memberships_for_choices(
        organization=actor_membership.organization,
    )
    queryset = apply_membership_choice_purpose(
        exclude_membership_id=exclude_membership_id,
        purpose=purpose,
        queryset=queryset,
    )
    return search_membership_choices(query=query, queryset=queryset)


def active_memberships_for_choices(*, organization: Organization) -> QuerySet[Membership]:
    return Membership.objects.select_related("user").filter(
        organization=organization,
        organization__is_active=True,
        status=STATUS_ACTIVE,
        user__is_active=True,
    )


def apply_membership_choice_purpose(
    *,
    exclude_membership_id,
    purpose: str,
    queryset: QuerySet[Membership],
) -> QuerySet[Membership]:
    if purpose in {MEMBERSHIP_CHOICE_PURPOSE_OWNER, MEMBERSHIP_CHOICE_PURPOSE_ASSIGNEE}:
        return queryset.filter(role__in=MEMBERSHIP_CHOICE_ASSIGNABLE_ROLES)
    if purpose == MEMBERSHIP_CHOICE_PURPOSE_OFFBOARDING:
        return queryset.filter(role__in=MEMBERSHIP_CHOICE_ASSIGNABLE_ROLES).exclude(
            id=exclude_membership_id
        )
    return queryset


def search_membership_choices(
    *,
    query: str,
    queryset: QuerySet[Membership],
) -> QuerySet[Membership]:
    value = query.strip()
    if not value:
        return queryset.order_by("-created_at", "-id")
    return queryset.filter(
        Q(user__first_name__icontains=value)
        | Q(user__last_name__icontains=value)
        | Q(user__email__icontains=value)
    ).order_by("-created_at", "-id")


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
