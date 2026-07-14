"""Small matter mutation services."""

from __future__ import annotations

from django.db import transaction
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from apps.matters.models import ACCESS_LEVEL_EDIT, MatterAccess
from apps.matters.permissions import require_matter_edit
from apps.organizations.permissions import is_active_membership, require_manager
from common.api.errors import DomainRuleError


def grant_matter_access(*, actor_membership, matter, membership, level: str) -> MatterAccess:
    require_matter_edit(membership=actor_membership, matter=matter)
    require_same_active_organization(matter=matter, membership=membership)
    require_same_active_organization(matter=matter, membership=actor_membership)

    with transaction.atomic():
        grant = active_grant_for_update(matter=matter, membership=membership)
        if grant is None:
            return MatterAccess.objects.create(
                organization=matter.organization,
                matter=matter,
                membership=membership,
                level=level,
                granted_by=actor_membership,
            )
        if grant.level != level:
            grant.level = level
            grant.granted_by = actor_membership
            grant.save(update_fields=["level", "granted_by", "updated_at"])
        return grant


def revoke_matter_access(*, actor_membership, matter, membership) -> MatterAccess | None:
    require_matter_edit(membership=actor_membership, matter=matter)
    require_same_active_organization(matter=matter, membership=membership)

    with transaction.atomic():
        grant = active_grant_for_update(matter=matter, membership=membership)
        if grant is None:
            return None
        grant.revoked_at = timezone.now()
        grant.save(update_fields=["revoked_at", "updated_at"])
        return grant


def transfer_matter_owner(*, actor_membership, matter, new_owner):
    require_manager(membership=actor_membership)
    require_same_active_organization(matter=matter, membership=actor_membership)
    require_same_active_organization(matter=matter, membership=new_owner)

    with transaction.atomic():
        matter.owner = new_owner
        matter.version += 1
        matter.save(update_fields=["owner", "version", "updated_at"])
        ensure_edit_grant(
            actor_membership=actor_membership,
            matter=matter,
            membership=new_owner,
        )
        return matter


def require_same_active_organization(*, matter, membership) -> None:
    if not is_active_membership(membership=membership):
        raise DomainRuleError(_("Membership must be active."), code="inactive_membership")
    if membership.organization_id != matter.organization_id:
        raise DomainRuleError(
            _("Membership must belong to the matter organization."),
            code="cross_organization_membership",
        )


def active_grant_for_update(*, matter, membership) -> MatterAccess | None:
    return (
        MatterAccess.objects.select_for_update()
        .filter(
            matter=matter,
            membership=membership,
            revoked_at__isnull=True,
        )
        .first()
    )


def ensure_edit_grant(*, actor_membership, matter, membership) -> MatterAccess:
    grant = active_grant_for_update(matter=matter, membership=membership)
    if grant is None:
        return MatterAccess.objects.create(
            organization=matter.organization,
            matter=matter,
            membership=membership,
            level=ACCESS_LEVEL_EDIT,
            granted_by=actor_membership,
        )
    if grant.level != ACCESS_LEVEL_EDIT:
        grant.level = ACCESS_LEVEL_EDIT
        grant.granted_by = actor_membership
        grant.save(update_fields=["level", "granted_by", "updated_at"])
    return grant
