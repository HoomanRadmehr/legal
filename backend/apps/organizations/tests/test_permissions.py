"""Tests for explicit organization role permission helpers."""

from __future__ import annotations

import pytest
from rest_framework.exceptions import PermissionDenied

from apps.accounts.tests.factories import UserFactory
from apps.organizations.models import (
    ROLE_LEGAL_ADMIN,
    ROLE_LEGAL_COUNSEL,
    ROLE_LEGAL_MANAGER,
    ROLE_VIEWER,
    STATUS_SUSPENDED,
)
from apps.organizations.permissions import (
    is_admin,
    is_admin_or_manager,
    is_counsel,
    is_manager,
    is_viewer,
    require_admin,
    require_manager,
    resolve_active_membership,
)
from apps.organizations.tests.factories import MembershipFactory, OrganizationFactory

pytestmark = pytest.mark.django_db


def test_role_checks_require_active_membership_and_user() -> None:
    admin = MembershipFactory(role=ROLE_LEGAL_ADMIN)
    manager = MembershipFactory(role=ROLE_LEGAL_MANAGER)
    counsel = MembershipFactory(role=ROLE_LEGAL_COUNSEL)
    viewer = MembershipFactory(role=ROLE_VIEWER)
    suspended_admin = MembershipFactory(role=ROLE_LEGAL_ADMIN, status=STATUS_SUSPENDED)
    inactive_user = UserFactory(is_active=False)
    inactive_membership = MembershipFactory(user=inactive_user, role=ROLE_LEGAL_ADMIN)

    assert is_admin(membership=admin) is True
    assert is_manager(membership=manager) is True
    assert is_counsel(membership=counsel) is True
    assert is_viewer(membership=viewer) is True
    assert is_admin_or_manager(membership=admin) is True
    assert is_admin_or_manager(membership=manager) is True
    assert is_admin(membership=suspended_admin) is False
    assert is_admin(membership=inactive_membership) is False
    assert is_admin(membership=None) is False


def test_resolve_active_membership_is_organization_scoped() -> None:
    user = UserFactory()
    organization = OrganizationFactory()
    other_organization = OrganizationFactory()
    membership = MembershipFactory(organization=organization, user=user)
    MembershipFactory(organization=other_organization, user=user)

    found = resolve_active_membership(actor=user, organization=organization)

    assert found == membership
    assert found.organization == organization


def test_require_admin_allows_admin_only() -> None:
    admin = MembershipFactory(role=ROLE_LEGAL_ADMIN)
    manager = MembershipFactory(role=ROLE_LEGAL_MANAGER)

    require_admin(membership=admin)

    with pytest.raises(PermissionDenied):
        require_admin(membership=manager)


def test_require_manager_allows_admin_and_manager_only() -> None:
    admin = MembershipFactory(role=ROLE_LEGAL_ADMIN)
    manager = MembershipFactory(role=ROLE_LEGAL_MANAGER)
    counsel = MembershipFactory(role=ROLE_LEGAL_COUNSEL)

    require_manager(membership=admin)
    require_manager(membership=manager)

    with pytest.raises(PermissionDenied):
        require_manager(membership=counsel)
