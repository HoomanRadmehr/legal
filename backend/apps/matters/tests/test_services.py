"""Tests for small matter mutation services."""

from __future__ import annotations

import pytest
from rest_framework.exceptions import PermissionDenied

from apps.matters.models import ACCESS_LEVEL_EDIT, ACCESS_LEVEL_VIEW, MatterAccess
from apps.matters.services import grant_matter_access, revoke_matter_access, transfer_matter_owner
from apps.matters.tests.factories import MatterFactory
from apps.organizations.models import ROLE_LEGAL_ADMIN, ROLE_LEGAL_COUNSEL, ROLE_VIEWER
from apps.organizations.tests.factories import MembershipFactory, OrganizationFactory
from common.api.errors import DomainRuleError

pytestmark = pytest.mark.django_db


def test_grant_matter_access_creates_or_updates_active_grant() -> None:
    organization = OrganizationFactory()
    admin = MembershipFactory(organization=organization, role=ROLE_LEGAL_ADMIN)
    viewer = MembershipFactory(organization=organization, role=ROLE_VIEWER)
    matter = MatterFactory(organization=organization, owner=admin, created_by=admin)

    grant = grant_matter_access(
        actor_membership=admin,
        matter=matter,
        membership=viewer,
        level=ACCESS_LEVEL_VIEW,
    )
    updated = grant_matter_access(
        actor_membership=admin,
        matter=matter,
        membership=viewer,
        level=ACCESS_LEVEL_EDIT,
    )

    assert grant == updated
    assert updated.level == ACCESS_LEVEL_EDIT
    assert (
        MatterAccess.objects.filter(matter=matter, membership=viewer, revoked_at=None).count() == 1
    )


def test_grant_matter_access_rejects_cross_organization_membership() -> None:
    admin = MembershipFactory(role=ROLE_LEGAL_ADMIN)
    other_membership = MembershipFactory(role=ROLE_VIEWER)
    matter = MatterFactory(organization=admin.organization, owner=admin, created_by=admin)

    with pytest.raises(DomainRuleError) as error:
        grant_matter_access(
            actor_membership=admin,
            matter=matter,
            membership=other_membership,
            level=ACCESS_LEVEL_VIEW,
        )

    assert error.value.get_codes() == "cross_organization_membership"


def test_revoke_matter_access_marks_active_grant_revoked() -> None:
    organization = OrganizationFactory()
    admin = MembershipFactory(organization=organization, role=ROLE_LEGAL_ADMIN)
    viewer = MembershipFactory(organization=organization, role=ROLE_VIEWER)
    matter = MatterFactory(organization=organization, owner=admin, created_by=admin)
    grant_matter_access(
        actor_membership=admin,
        matter=matter,
        membership=viewer,
        level=ACCESS_LEVEL_VIEW,
    )

    revoked = revoke_matter_access(actor_membership=admin, matter=matter, membership=viewer)

    assert revoked is not None
    assert revoked.revoked_at is not None


def test_transfer_matter_owner_requires_admin_or_manager() -> None:
    organization = OrganizationFactory()
    admin = MembershipFactory(organization=organization, role=ROLE_LEGAL_ADMIN)
    owner = MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL)
    new_owner = MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL)
    viewer = MembershipFactory(organization=organization, role=ROLE_VIEWER)
    matter = MatterFactory(organization=organization, owner=owner, created_by=owner)

    with pytest.raises(PermissionDenied):
        transfer_matter_owner(actor_membership=owner, matter=matter, new_owner=new_owner)
    with pytest.raises(PermissionDenied):
        transfer_matter_owner(actor_membership=viewer, matter=matter, new_owner=new_owner)

    transferred = transfer_matter_owner(actor_membership=admin, matter=matter, new_owner=new_owner)

    assert transferred.owner == new_owner
    assert transferred.version == 2
    assert MatterAccess.objects.get(matter=matter, membership=new_owner).level == ACCESS_LEVEL_EDIT


def test_transfer_matter_owner_rejects_cross_organization_admin() -> None:
    organization = OrganizationFactory()
    admin = MembershipFactory(organization=organization, role=ROLE_LEGAL_ADMIN)
    other_admin = MembershipFactory(role=ROLE_LEGAL_ADMIN)
    new_owner = MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL)
    matter = MatterFactory(organization=organization, owner=admin, created_by=admin)

    with pytest.raises(DomainRuleError) as error:
        transfer_matter_owner(
            actor_membership=other_admin,
            matter=matter,
            new_owner=new_owner,
        )

    assert error.value.get_codes() == "cross_organization_membership"
