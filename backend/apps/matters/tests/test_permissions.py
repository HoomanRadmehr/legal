"""Tests for explicit matter permission helpers."""

from __future__ import annotations

import pytest
from rest_framework.exceptions import NotFound, PermissionDenied

from apps.matters.permissions import (
    ACCESS_LEVEL_EDIT,
    ACCESS_LEVEL_VIEW,
    MatterPermission,
    can_edit_matter,
    can_view_matter,
    filter_visible_matters,
    require_matter_edit,
    require_matter_view,
)
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
    other_organization = OrganizationFactory()
    admin = MembershipFactory(organization=organization, role=ROLE_LEGAL_ADMIN)
    manager = MembershipFactory(organization=organization, role=ROLE_LEGAL_MANAGER)
    counsel_owner = MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL)
    counsel_grantee = MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL)
    viewer_grantee = MembershipFactory(organization=organization, role=ROLE_VIEWER)
    unrelated = MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL)
    other_admin = MembershipFactory(organization=other_organization, role=ROLE_LEGAL_ADMIN)
    suspended_owner = MembershipFactory(
        organization=organization,
        role=ROLE_LEGAL_COUNSEL,
        status=STATUS_SUSPENDED,
    )
    matter = Matter(
        organization=organization,
        owner=counsel_owner,
        access_grants=(
            Grant(membership=counsel_grantee, level=ACCESS_LEVEL_EDIT),
            Grant(membership=viewer_grantee, level=ACCESS_LEVEL_VIEW),
        ),
    )
    suspended_matter = Matter(organization=organization, owner=suspended_owner)
    return {
        "admin": admin,
        "manager": manager,
        "counsel_owner": counsel_owner,
        "counsel_grantee": counsel_grantee,
        "viewer_grantee": viewer_grantee,
        "unrelated": unrelated,
        "other_admin": other_admin,
        "suspended_owner": suspended_owner,
        "matter": matter,
        "suspended_matter": suspended_matter,
    }


def test_matter_grants_must_be_active() -> None:
    organization = OrganizationFactory()
    owner = MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL)
    counsel_viewer = MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL)
    revoked_editor = MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL)
    matter = Matter(
        organization=organization,
        owner=owner,
        access_grants=(
            Grant(membership=counsel_viewer, level=ACCESS_LEVEL_VIEW),
            Grant(membership=revoked_editor, level=ACCESS_LEVEL_EDIT, revoked_at=object()),
        ),
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
    matter = Matter(organization=organization, owner=owner)

    with pytest.raises(NotFound):
        require_matter_view(membership=other_admin, matter=matter)
    with pytest.raises(NotFound):
        require_matter_edit(membership=other_admin, matter=matter)


def test_require_matter_edit_uses_forbidden_when_record_is_visible() -> None:
    organization = OrganizationFactory()
    owner = MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL)
    viewer = MembershipFactory(organization=organization, role=ROLE_VIEWER)
    matter = Matter(
        organization=organization,
        owner=owner,
        access_grants=(Grant(membership=viewer, level=ACCESS_LEVEL_VIEW),),
    )

    require_matter_view(membership=viewer, matter=matter)

    with pytest.raises(PermissionDenied):
        require_matter_edit(membership=viewer, matter=matter)


def test_matter_permission_class_raises_not_found_for_invisible_record() -> None:
    organization = OrganizationFactory()
    other_organization = OrganizationFactory()
    owner = MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL)
    other_admin = MembershipFactory(organization=other_organization, role=ROLE_LEGAL_ADMIN)
    matter = Matter(organization=organization, owner=owner)

    with pytest.raises(NotFound):
        MatterPermission().has_object_permission(
            Request(user=other_admin.user),
            View(action="retrieve"),
            matter,
        )


def test_filter_visible_matters_starts_with_organization_scope() -> None:
    organization = OrganizationFactory()
    admin = MembershipFactory(organization=organization, role=ROLE_LEGAL_ADMIN)
    queryset = RecordingQuerySet()

    result = filter_visible_matters(queryset=queryset, membership=admin)

    assert result is queryset
    assert queryset.calls == [("filter", (), {"organization": organization})]


def test_filter_visible_matters_denies_inactive_before_filtering() -> None:
    suspended = MembershipFactory(role=ROLE_LEGAL_ADMIN, status=STATUS_SUSPENDED)
    queryset = RecordingQuerySet()

    result = filter_visible_matters(queryset=queryset, membership=suspended)

    assert result == "empty-queryset"
    assert queryset.calls == [("none", (), {})]


class Matter:
    def __init__(self, *, organization, owner, access_grants=()) -> None:
        self.organization = organization
        self.organization_id = organization.id
        self.owner = owner
        self.owner_id = owner.id
        self.access_grants = access_grants


class Grant:
    def __init__(self, *, membership, level: str, revoked_at=None) -> None:
        self.membership = membership
        self.membership_id = membership.id
        self.level = level
        self.revoked_at = revoked_at


class RecordingQuerySet:
    def __init__(self) -> None:
        self.calls = []

    def filter(self, *args, **kwargs):
        self.calls.append(("filter", args, kwargs))
        return self

    def none(self):
        self.calls.append(("none", (), {}))
        return "empty-queryset"

    def distinct(self):
        self.calls.append(("distinct", (), {}))
        return self


class Request:
    def __init__(self, *, user) -> None:
        self.user = user


class View:
    def __init__(self, *, action: str) -> None:
        self.action = action
