"""Tests for organization membership selectors."""

from __future__ import annotations

import pytest

from apps.accounts.tests.factories import UserFactory
from apps.organizations.models import (
    ROLE_LEGAL_ADMIN,
    ROLE_LEGAL_COUNSEL,
    STATUS_ACTIVE,
    STATUS_SUSPENDED,
)
from apps.organizations.selectors import get_active_membership, list_admin_memberships
from apps.organizations.tests.factories import MembershipFactory, OrganizationFactory

pytestmark = pytest.mark.django_db


def test_get_active_membership_is_organization_scoped() -> None:
    actor = UserFactory()
    organization = OrganizationFactory()
    other_organization = OrganizationFactory()
    membership = MembershipFactory(organization=organization, user=actor)
    MembershipFactory(organization=other_organization, user=actor)

    found = get_active_membership(actor=actor, organization=organization)

    assert found == membership
    assert found.organization == organization


def test_get_active_membership_excludes_suspended_membership_and_inactive_user() -> None:
    suspended = MembershipFactory(status=STATUS_SUSPENDED)
    inactive_user = UserFactory(is_active=False)
    inactive_user_membership = MembershipFactory(user=inactive_user, status=STATUS_ACTIVE)

    assert get_active_membership(actor=suspended.user, organization=suspended.organization) is None
    assert (
        get_active_membership(
            actor=inactive_user,
            organization=inactive_user_membership.organization,
        )
        is None
    )


def test_list_admin_memberships_is_organization_scoped_and_active_only() -> None:
    organization = OrganizationFactory()
    other_organization = OrganizationFactory()
    admin = MembershipFactory(organization=organization, role=ROLE_LEGAL_ADMIN)
    MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL)
    MembershipFactory(organization=organization, role=ROLE_LEGAL_ADMIN, status=STATUS_SUSPENDED)
    MembershipFactory(organization=other_organization, role=ROLE_LEGAL_ADMIN)

    found = list(list_admin_memberships(organization=organization))

    assert found == [admin]
