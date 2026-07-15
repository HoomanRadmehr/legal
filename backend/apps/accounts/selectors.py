"""Read selectors for account authentication."""

from __future__ import annotations

from django.db.models import Q

from apps.organizations.models import (
    ROLE_LEGAL_ADMIN,
    ROLE_LEGAL_COUNSEL,
    ROLE_LEGAL_MANAGER,
    STATUS_ACTIVE,
    Membership,
)

USER_CHOICE_PURPOSE_OWNER = "owner"
USER_CHOICE_PURPOSE_ASSIGNEE = "assignee"
USER_CHOICE_PURPOSE_OFFBOARDING_REPLACEMENT = "offboarding_replacement"
USER_ASSIGNABLE_ROLES = (
    ROLE_LEGAL_ADMIN,
    ROLE_LEGAL_MANAGER,
    ROLE_LEGAL_COUNSEL,
)


def get_current_membership(*, user) -> Membership | None:
    return (
        Membership.objects.select_related("organization", "user")
        .filter(
            organization__is_active=True,
            status=STATUS_ACTIVE,
            user=user,
            user__is_active=True,
        )
        .order_by("joined_at")
        .first()
    )


def user_choices(
    *,
    actor,
    purpose: str,
    query: str = "",
    exclude_user_id=None,
):
    membership = get_current_membership(user=actor)
    if membership is None:
        return Membership.objects.none()
    queryset = active_memberships_for_choices(organization=membership.organization)
    queryset = apply_user_choice_purpose(
        queryset=queryset,
        purpose=purpose,
        exclude_user_id=exclude_user_id,
    )
    return search_user_choices(queryset=queryset, query=query)


def active_memberships_for_choices(*, organization):
    return Membership.objects.select_related("user").filter(
        organization=organization,
        organization__is_active=True,
        status=STATUS_ACTIVE,
        user__is_active=True,
    )


def apply_user_choice_purpose(*, queryset, purpose: str, exclude_user_id=None):
    if purpose == USER_CHOICE_PURPOSE_OWNER:
        return queryset.filter(role__in=USER_ASSIGNABLE_ROLES)
    if purpose == USER_CHOICE_PURPOSE_ASSIGNEE:
        return queryset.filter(role__in=USER_ASSIGNABLE_ROLES)
    if purpose == USER_CHOICE_PURPOSE_OFFBOARDING_REPLACEMENT:
        return queryset.filter(role__in=USER_ASSIGNABLE_ROLES).exclude(user_id=exclude_user_id)
    return queryset


def search_user_choices(*, queryset, query: str):
    value = query.strip()
    if not value:
        return queryset.order_by("-created_at", "-id")
    return queryset.filter(
        Q(user__first_name__icontains=value)
        | Q(user__last_name__icontains=value)
        | Q(user__email__icontains=value)
    ).order_by("-created_at", "-id")
