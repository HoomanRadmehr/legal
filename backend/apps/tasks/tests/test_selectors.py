"""Tests for task selectors."""

from __future__ import annotations

import pytest
from rest_framework.exceptions import NotFound

from apps.matters.models import ACCESS_LEVEL_VIEW
from apps.matters.tests.factories import MatterAccessFactory
from apps.organizations.models import ROLE_LEGAL_ADMIN, ROLE_LEGAL_COUNSEL, ROLE_VIEWER
from apps.organizations.tests.factories import MembershipFactory, OrganizationFactory
from apps.tasks.selectors import task_get, task_list, task_list_assigned_to_me
from apps.tasks.tests.factories import TaskFactory

pytestmark = pytest.mark.django_db


def test_task_list_is_matter_permission_scoped() -> None:
    organization = OrganizationFactory()
    other_organization = OrganizationFactory()
    admin = MembershipFactory(organization=organization, role=ROLE_LEGAL_ADMIN)
    counsel = MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL)
    viewer = MembershipFactory(organization=organization, role=ROLE_VIEWER)
    other_admin = MembershipFactory(organization=other_organization, role=ROLE_LEGAL_ADMIN)
    owned = TaskFactory(matter__organization=organization, matter__owner=counsel, assignee=counsel)
    granted = TaskFactory(matter__organization=organization, matter__owner=admin, assignee=viewer)
    hidden = TaskFactory(matter__organization=organization, matter__owner=admin, assignee=admin)
    TaskFactory(matter__organization=other_organization, matter__owner=other_admin)
    MatterAccessFactory(matter=granted.matter, membership=viewer, level=ACCESS_LEVEL_VIEW)

    admin_ids = set(
        task_list(actor=admin.user, organization=organization).values_list("id", flat=True)
    )
    counsel_ids = set(
        task_list(actor=counsel.user, organization=organization).values_list("id", flat=True)
    )
    viewer_ids = set(
        task_list(actor=viewer.user, organization=organization).values_list("id", flat=True)
    )

    assert admin_ids == {owned.id, granted.id, hidden.id}
    assert counsel_ids == {owned.id}
    assert viewer_ids == {granted.id}


def test_task_get_hides_unscoped_records() -> None:
    owner = MembershipFactory(role=ROLE_LEGAL_COUNSEL)
    other = MembershipFactory(role=ROLE_LEGAL_ADMIN)
    task = TaskFactory(matter__organization=owner.organization, matter__owner=owner, assignee=owner)

    with pytest.raises(NotFound):
        task_get(actor=other.user, organization=other.organization, task_id=task.id)


def test_task_list_assigned_to_me_excludes_final_status_by_default() -> None:
    owner = MembershipFactory(role=ROLE_LEGAL_COUNSEL)
    open_task = TaskFactory(
        matter__organization=owner.organization,
        matter__owner=owner,
        assignee=owner,
    )
    done_task = TaskFactory(
        matter__organization=owner.organization,
        matter__owner=owner,
        assignee=owner,
        status="done",
    )

    open_ids = set(
        task_list_assigned_to_me(actor=owner.user, organization=owner.organization).values_list(
            "id", flat=True
        )
    )
    all_ids = set(
        task_list_assigned_to_me(
            actor=owner.user,
            organization=owner.organization,
            include_closed=True,
        ).values_list("id", flat=True)
    )

    assert open_ids == {open_task.id}
    assert all_ids == {open_task.id, done_task.id}
