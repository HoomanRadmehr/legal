"""Read selectors for organization membership."""

from __future__ import annotations

from django.db.models import QuerySet

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
