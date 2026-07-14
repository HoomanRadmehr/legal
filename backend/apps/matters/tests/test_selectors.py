"""Tests for matter selectors."""

from __future__ import annotations

import pytest
from rest_framework.exceptions import NotFound

from apps.matters.models import ACCESS_LEVEL_VIEW
from apps.matters.selectors import matter_get, matter_list
from apps.matters.tests.factories import MatterAccessFactory, MatterFactory
from apps.organizations.models import (
    ROLE_LEGAL_ADMIN,
    ROLE_LEGAL_COUNSEL,
    ROLE_LEGAL_MANAGER,
    ROLE_VIEWER,
)
from apps.organizations.tests.factories import MembershipFactory, OrganizationFactory

pytestmark = pytest.mark.django_db


def test_matter_list_role_matrix_with_two_organizations() -> None:
    matrix = create_selector_matrix()

    assert list(matter_list(actor=matrix["admin"].user, organization=matrix["organization"])) == [
        matrix["owned"],
        matrix["unowned"],
        matrix["granted"],
    ]
    assert list(matter_list(actor=matrix["manager"].user, organization=matrix["organization"])) == [
        matrix["owned"],
        matrix["unowned"],
        matrix["granted"],
    ]
    assert list(
        matter_list(actor=matrix["counsel_owner"].user, organization=matrix["organization"])
    ) == [matrix["owned"]]
    assert list(matter_list(actor=matrix["viewer"].user, organization=matrix["organization"])) == [
        matrix["granted"]
    ]
    assert (
        list(matter_list(actor=matrix["other_admin"].user, organization=matrix["organization"]))
        == []
    )


def test_matter_get_returns_not_found_for_cross_organization_and_unrelated_user() -> None:
    organization = OrganizationFactory()
    other_organization = OrganizationFactory()
    admin = MembershipFactory(organization=organization, role=ROLE_LEGAL_ADMIN)
    unrelated = MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL)
    other_matter = MatterFactory(organization=other_organization)
    private_matter = MatterFactory(organization=organization, owner=admin, created_by=admin)

    with pytest.raises(NotFound):
        matter_get(actor=admin.user, organization=organization, matter_id=other_matter.id)
    with pytest.raises(NotFound):
        matter_get(actor=unrelated.user, organization=organization, matter_id=private_matter.id)


def create_selector_matrix() -> dict:
    organization = OrganizationFactory()
    other_organization = OrganizationFactory()
    admin = MembershipFactory(organization=organization, role=ROLE_LEGAL_ADMIN)
    manager = MembershipFactory(organization=organization, role=ROLE_LEGAL_MANAGER)
    counsel_owner = MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL)
    viewer = MembershipFactory(organization=organization, role=ROLE_VIEWER)
    other_admin = MembershipFactory(organization=other_organization, role=ROLE_LEGAL_ADMIN)
    owned = MatterFactory(organization=organization, owner=counsel_owner, created_by=counsel_owner)
    unowned = MatterFactory(organization=organization, owner=admin, created_by=admin)
    granted = MatterFactory(organization=organization, owner=admin, created_by=admin)
    MatterFactory(organization=other_organization, owner=other_admin, created_by=other_admin)
    MatterAccessFactory(matter=granted, membership=viewer, level=ACCESS_LEVEL_VIEW)
    return {
        "organization": organization,
        "admin": admin,
        "manager": manager,
        "counsel_owner": counsel_owner,
        "viewer": viewer,
        "other_admin": other_admin,
        "owned": owned,
        "unowned": unowned,
        "granted": granted,
    }
