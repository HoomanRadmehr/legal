"""Read selectors for account authentication."""

from __future__ import annotations

from apps.organizations.models import STATUS_ACTIVE, Membership


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
