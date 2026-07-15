"""Tests for the idempotent demo seed command."""

from __future__ import annotations

from pathlib import Path

import pytest
from django.contrib.auth import get_user_model
from django.core.management import call_command

from apps.activity.models import ActivityLog, OutboxEvent
from apps.cases.models import CaseParty, LegalCase
from apps.deadlines.models import Deadline
from apps.deadlines.selectors import (
    deadline_list_assigned_to_me,
    deadline_list_overdue,
    deadline_list_today,
    deadline_list_upcoming,
)
from apps.documents.models import Document
from apps.matters.models import Matter, MatterAccess, MatterRelation
from apps.matters.permissions import can_view_matter
from apps.notices.models import LegalNotice
from apps.notifications.models import (
    Notification,
    NotificationDelivery,
    NotificationPreference,
)
from apps.organizations.management.commands._seed_demo_data import (
    DEMO_PASSWORD,
    ISOLATION_ORG_NAME,
    PRIMARY_ORG_NAME,
    PRIMARY_USERS,
)
from apps.organizations.models import (
    ROLE_LEGAL_COUNSEL,
    ROLE_VIEWER,
    Membership,
    Organization,
)
from apps.tasks.models import Task

pytestmark = pytest.mark.django_db


def test_seed_demo_is_idempotent_and_covers_required_demo_data() -> None:
    call_command("seed_demo")
    first_counts = model_counts()

    call_command("seed_demo")

    assert model_counts() == first_counts
    primary = Organization.objects.get(name=PRIMARY_ORG_NAME)
    isolation = Organization.objects.get(name=ISOLATION_ORG_NAME)
    assert seeded_roles(primary) == {
        "legal_admin",
        "legal_manager",
        "legal_counsel",
        "viewer",
    }
    assert seeded_roles(isolation) == seeded_roles(primary)
    assert seeded_usernames_have_demo_password()
    assert organization_isolation_exists(primary=primary, isolation=isolation)
    assert visibility_boundary_exists(primary=primary)
    assert deadline_views_are_populated(primary=primary)
    assert screen_fixture_rows_exist(primary=primary)


def test_seed_demo_readme_documents_development_only_credentials() -> None:
    readme = Path(__file__).resolve().parents[1].joinpath("README.md").read_text()

    assert "development-only" in readme
    assert "demo-primary-admin" in readme
    assert DEMO_PASSWORD in readme


def model_counts() -> dict[str, int]:
    models = [
        get_user_model(),
        Organization,
        Membership,
        Matter,
        MatterAccess,
        MatterRelation,
        LegalCase,
        CaseParty,
        LegalNotice,
        Deadline,
        Task,
        Document,
        NotificationPreference,
        Notification,
        NotificationDelivery,
        ActivityLog,
        OutboxEvent,
    ]
    return {model.__name__: model.objects.count() for model in models}


def seeded_roles(organization: Organization) -> set[str]:
    return set(Membership.objects.filter(organization=organization).values_list("role", flat=True))


def seeded_usernames_have_demo_password() -> bool:
    user_model = get_user_model()
    usernames = [demo_user.username for demo_user in PRIMARY_USERS]
    users = user_model.objects.filter(username__in=usernames)
    if users.count() != len(usernames):
        return False
    return all(user.check_password(DEMO_PASSWORD) for user in users)


def organization_isolation_exists(*, primary: Organization, isolation: Organization) -> bool:
    return (
        Matter.objects.filter(organization=isolation, reference_code="CASE-ISO-001").exists()
        and not Matter.objects.filter(organization=primary, reference_code="CASE-ISO-001").exists()
    )


def visibility_boundary_exists(*, primary: Organization) -> bool:
    visible = Matter.objects.get(organization=primary, reference_code="CASE-DEMO-001")
    hidden = Matter.objects.get(organization=primary, reference_code="CON-DEMO-001")
    viewer = Membership.objects.get(organization=primary, role=ROLE_VIEWER)
    counsel = Membership.objects.get(organization=primary, role=ROLE_LEGAL_COUNSEL)
    return (
        can_view_matter(membership=viewer, matter=visible)
        and not can_view_matter(membership=viewer, matter=hidden)
        and can_view_matter(membership=counsel, matter=visible)
    )


def deadline_views_are_populated(*, primary: Organization) -> bool:
    counsel = Membership.objects.get(organization=primary, role=ROLE_LEGAL_COUNSEL)
    today_titles = deadline_titles(deadline_list_today(actor=counsel.user, organization=primary))
    upcoming_titles = deadline_titles(
        deadline_list_upcoming(actor=counsel.user, organization=primary)
    )
    overdue_titles = deadline_titles(
        deadline_list_overdue(actor=counsel.user, organization=primary)
    )
    assigned_titles = deadline_titles(
        deadline_list_assigned_to_me(actor=counsel.user, organization=primary)
    )
    return (
        "Synthetic deadline due today" in today_titles
        and "Synthetic upcoming deadline" in upcoming_titles
        and "Synthetic overdue deadline" in overdue_titles
        and "Synthetic deadline due today" in assigned_titles
    )


def deadline_titles(queryset) -> set[str]:
    return set(queryset.values_list("title", flat=True))


def screen_fixture_rows_exist(*, primary: Organization) -> bool:
    matter = Matter.objects.get(organization=primary, reference_code="CASE-DEMO-001")
    return (
        LegalNotice.objects.filter(matter__organization=primary).exists()
        and Task.objects.filter(matter=matter, title="Synthetic assigned task").exists()
        and Document.objects.filter(
            matter=matter,
            original_filename__startswith="synthetic",
        ).exists()
        and NotificationPreference.objects.filter(membership__organization=primary).exists()
        and Notification.objects.filter(recipient__organization=primary).exists()
        and ActivityLog.objects.filter(organization=primary).exists()
    )
