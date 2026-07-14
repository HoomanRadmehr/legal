"""Tests for explicit matter permission helpers."""

from __future__ import annotations

import pytest
from django.utils import timezone
from rest_framework.exceptions import NotFound, PermissionDenied

from apps.matters.models import ACCESS_LEVEL_EDIT, ACCESS_LEVEL_VIEW
from apps.matters.permissions import (
    MatterPermission,
    can_edit_matter,
    can_view_matter,
    filter_visible_matters,
    require_matter_edit,
    require_matter_view,
)
from apps.matters.tests.factories import MatterAccessFactory, MatterFactory
from apps.organizations.models import (
    ROLE_LEGAL_ADMIN,
    ROLE_LEGAL_COUNSEL,
    ROLE_LEGAL_MANAGER,
    ROLE_VIEWER,
    STATUS_SUSPENDED,
)
from apps.organizations.tests.factories import MembershipFactory, OrganizationFactory

pytestmark = pytest.mark.django_db


def test_matter_view_role_matrix_with_two_organizations() -> None:
    matrix = create_role_matrix()
    matter = matrix["matter"]

    assert can_view_matter(membership=matrix["admin"], matter=matter) is True
    assert can_view_matter(membership=matrix["manager"], matter=matter) is True
    assert can_view_matter(membership=matrix["counsel_owner"], matter=matter) is True
    assert can_view_matter(membership=matrix["counsel_grantee"], matter=matter) is True
    assert can_view_matter(membership=matrix["viewer_grantee"], matter=matter) is True
    assert can_view_matter(membership=matrix["unrelated"], matter=matter) is False
    assert can_view_matter(membership=matrix["other_admin"], matter=matter) is False
    assert (
        can_view_matter(
            membership=matrix["suspended_owner"],
            matter=matrix["suspended_matter"],
        )
        is False
    )


def test_matter_edit_role_matrix_with_two_organizations() -> None:
    matrix = create_role_matrix()
    matter = matrix["matter"]

    assert can_edit_matter(membership=matrix["admin"], matter=matter) is True
    assert can_edit_matter(membership=matrix["manager"], matter=matter) is True
    assert can_edit_matter(membership=matrix["counsel_owner"], matter=matter) is True
    assert can_edit_matter(membership=matrix["counsel_grantee"], matter=matter) is True
    assert can_edit_matter(membership=matrix["viewer_grantee"], matter=matter) is False
    assert can_edit_matter(membership=matrix["unrelated"], matter=matter) is False
    assert can_edit_matter(membership=matrix["other_admin"], matter=matter) is False
    assert (
        can_edit_matter(
            membership=matrix["suspended_owner"],
            matter=matrix["suspended_matter"],
        )
        is False
    )


def create_role_matrix() -> dict:
    organization = OrganizationFactory()
    memberships = create_role_memberships(organization=organization)
    matters = create_role_matters(organization=organization, memberships=memberships)
    return {**memberships, **matters}


def create_role_memberships(*, organization) -> dict:
    other_organization = OrganizationFactory()
    return {
        "admin": MembershipFactory(organization=organization, role=ROLE_LEGAL_ADMIN),
        "manager": MembershipFactory(organization=organization, role=ROLE_LEGAL_MANAGER),
        "counsel_owner": MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL),
        "counsel_grantee": MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL),
        "viewer_grantee": MembershipFactory(organization=organization, role=ROLE_VIEWER),
        "unrelated": MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL),
        "other_admin": MembershipFactory(organization=other_organization, role=ROLE_LEGAL_ADMIN),
        "suspended_owner": MembershipFactory(
            organization=organization,
            role=ROLE_LEGAL_COUNSEL,
            status=STATUS_SUSPENDED,
        ),
    }


def create_role_matters(*, organization, memberships: dict) -> dict:
    matter = MatterFactory(
        organization=organization,
        owner=memberships["counsel_owner"],
        created_by=memberships["counsel_owner"],
    )
    MatterAccessFactory(
        matter=matter,
        membership=memberships["counsel_grantee"],
        level=ACCESS_LEVEL_EDIT,
        granted_by=memberships["admin"],
    )
    MatterAccessFactory(
        matter=matter,
        membership=memberships["viewer_grantee"],
        level=ACCESS_LEVEL_VIEW,
        granted_by=memberships["admin"],
    )
    suspended_matter = MatterFactory(
        organization=organization,
        owner=memberships["suspended_owner"],
        created_by=memberships["suspended_owner"],
    )
    return {"matter": matter, "suspended_matter": suspended_matter}


def test_matter_grants_must_be_active() -> None:
    organization = OrganizationFactory()
    owner = MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL)
    counsel_viewer = MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL)
    revoked_editor = MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL)
    matter = MatterFactory(
        organization=organization,
        owner=owner,
        created_by=owner,
    )
    MatterAccessFactory(matter=matter, membership=counsel_viewer, level=ACCESS_LEVEL_VIEW)
    MatterAccessFactory(
        matter=matter,
        membership=revoked_editor,
        level=ACCESS_LEVEL_EDIT,
        revoked_at=timezone.now(),
    )

    assert can_view_matter(membership=counsel_viewer, matter=matter) is True
    assert can_edit_matter(membership=counsel_viewer, matter=matter) is False
    assert can_view_matter(membership=revoked_editor, matter=matter) is False
    assert can_edit_matter(membership=revoked_editor, matter=matter) is False


def test_require_matter_permissions_use_not_visible_for_invisible_records() -> None:
    organization = OrganizationFactory()
    other_organization = OrganizationFactory()
    owner = MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL)
    other_admin = MembershipFactory(organization=other_organization, role=ROLE_LEGAL_ADMIN)
    matter = MatterFactory(organization=organization, owner=owner, created_by=owner)

    with pytest.raises(NotFound):
        require_matter_view(membership=other_admin, matter=matter)
    with pytest.raises(NotFound):
        require_matter_edit(membership=other_admin, matter=matter)


def test_require_matter_edit_uses_forbidden_when_record_is_visible() -> None:
    organization = OrganizationFactory()
    owner = MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL)
    viewer = MembershipFactory(organization=organization, role=ROLE_VIEWER)
    matter = MatterFactory(
        organization=organization,
        owner=owner,
        created_by=owner,
    )
    MatterAccessFactory(matter=matter, membership=viewer, level=ACCESS_LEVEL_VIEW)

    require_matter_view(membership=viewer, matter=matter)

    with pytest.raises(PermissionDenied):
        require_matter_edit(membership=viewer, matter=matter)


def test_matter_permission_class_raises_not_found_for_invisible_record() -> None:
    organization = OrganizationFactory()
    other_organization = OrganizationFactory()
    owner = MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL)
    other_admin = MembershipFactory(organization=other_organization, role=ROLE_LEGAL_ADMIN)
    matter = MatterFactory(organization=organization, owner=owner, created_by=owner)

    with pytest.raises(NotFound):
        MatterPermission().has_object_permission(
            Request(user=other_admin.user),
            View(action="retrieve"),
            matter,
        )


def test_filter_visible_matters_starts_with_organization_scope() -> None:
    organization = OrganizationFactory()
    other_organization = OrganizationFactory()
    admin = MembershipFactory(organization=organization, role=ROLE_LEGAL_ADMIN)
    visible = MatterFactory(organization=organization, owner=admin, created_by=admin)
    MatterFactory(organization=other_organization)

    result = list(
        filter_visible_matters(queryset=MatterFactory._meta.model.objects.all(), membership=admin)
    )

    assert result == [visible]


def test_filter_visible_matters_denies_inactive_before_filtering() -> None:
    suspended = MembershipFactory(role=ROLE_LEGAL_ADMIN, status=STATUS_SUSPENDED)
    MatterFactory(organization=suspended.organization, owner=suspended, created_by=suspended)

    result = filter_visible_matters(
        queryset=MatterFactory._meta.model.objects.all(),
        membership=suspended,
    )

    assert list(result) == []


class Request:
    def __init__(self, *, user) -> None:
        self.user = user


class View:
    def __init__(self, *, action: str) -> None:
        self.action = action
