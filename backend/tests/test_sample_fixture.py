"""Tests for deterministic sample fixture loading."""

from __future__ import annotations

from io import StringIO

import pytest
from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.core.management.base import CommandError

from apps.cases.models import CaseParty, LegalCase
from apps.contracts.models import Contract
from apps.deadlines.models import Deadline
from apps.documents.models import Document
from apps.matters.models import Matter, MatterAccess, MatterRelation
from apps.notices.models import LegalNotice
from apps.organizations.management.commands.load_sample_fixture import (
    SAMPLE_CASE_MATTER_ID,
    SAMPLE_CASE_MATTER_IDS,
    SAMPLE_CASE_PARTY_IDS,
    SAMPLE_CONTRACT_MATTER_IDS,
    SAMPLE_DEADLINE_ID,
    SAMPLE_DEADLINE_IDS,
    SAMPLE_DOCUMENT_ID,
    SAMPLE_DOCUMENT_IDS,
    SAMPLE_MATTER_ACCESS_IDS,
    SAMPLE_MATTER_RELATION_IDS,
    SAMPLE_MEMBERSHIP_IDS,
    SAMPLE_NOTICE_MATTER_IDS,
    SAMPLE_ORGANIZATION_ID,
    SAMPLE_TASK_ID,
    SAMPLE_TASK_IDS,
    SAMPLE_USER_ADMIN_ID,
    SAMPLE_USER_IDS,
)
from apps.organizations.models import Membership, Organization
from apps.tasks.models import Task

pytestmark = pytest.mark.django_db


def test_load_sample_fixture_is_repeatable_and_covers_requested_domains() -> None:
    output = StringIO()

    call_command("load_sample_fixture", allow_non_debug=True, stdout=output)
    first_counts = sample_counts()
    call_command("load_sample_fixture", allow_non_debug=True)

    assert sample_counts() == first_counts
    assert Organization.objects.filter(pk=SAMPLE_ORGANIZATION_ID).exists()
    assert count_for_ids(get_user_model(), SAMPLE_USER_IDS) == 5
    assert count_for_ids(Membership, SAMPLE_MEMBERSHIP_IDS) == 5
    assert reference_count("SAMPLE-CASE-") == 5
    assert reference_count("SAMPLE-CON-") == 5
    assert reference_count("SAMPLE-NOT-") == 5
    assert count_for_ids(LegalCase, SAMPLE_CASE_MATTER_IDS) == 5
    assert count_for_ids(CaseParty, SAMPLE_CASE_PARTY_IDS) == 5
    assert count_for_ids(Contract, SAMPLE_CONTRACT_MATTER_IDS) == 5
    assert count_for_ids(Deadline, SAMPLE_DEADLINE_IDS) == 5
    assert count_for_ids(LegalNotice, SAMPLE_NOTICE_MATTER_IDS) == 5
    assert count_for_ids(Document, SAMPLE_DOCUMENT_IDS) == 5
    assert count_for_ids(MatterAccess, SAMPLE_MATTER_ACCESS_IDS) == 5
    assert count_for_ids(MatterRelation, SAMPLE_MATTER_RELATION_IDS) == 5
    assert count_for_ids(Task, SAMPLE_TASK_IDS) == 5
    assert Deadline.objects.filter(pk=SAMPLE_DEADLINE_ID, title="مهلت پاسخ به اخطار").exists()
    assert Task.objects.filter(pk=SAMPLE_TASK_ID, title="آماده‌سازی پیش‌نویس پاسخ").exists()
    assert Document.objects.filter(
        pk=SAMPLE_DOCUMENT_ID,
        original_filename="صورتجلسه-پرونده-مطالبه.pdf",
        status="available",
    ).exists()
    assert_persian_sample_content()
    assert "password" not in output.getvalue().lower()


def test_load_sample_fixture_repairs_missing_rows() -> None:
    call_command("load_sample_fixture", allow_non_debug=True)
    Document.objects.get(pk=SAMPLE_DOCUMENT_ID).delete()

    call_command("load_sample_fixture", allow_non_debug=True)

    assert Document.objects.filter(pk=SAMPLE_DOCUMENT_ID).exists()


def test_load_sample_fixture_refuses_non_debug_without_explicit_flag() -> None:
    with pytest.raises(CommandError, match="DEBUG"):
        call_command("load_sample_fixture")


def sample_counts() -> dict[str, int]:
    models = [
        get_user_model(),
        Organization,
        Membership,
        Matter,
        MatterAccess,
        MatterRelation,
        LegalCase,
        CaseParty,
        Contract,
        Deadline,
        LegalNotice,
        Task,
        Document,
    ]
    return {model.__name__: model.objects.count() for model in models}


def count_for_ids(model, primary_keys: tuple[str, ...]) -> int:
    return model.objects.filter(pk__in=primary_keys).count()


def reference_count(prefix: str) -> int:
    return Matter.objects.filter(reference_code__startswith=prefix).count()


def assert_persian_sample_content() -> None:
    organization = Organization.objects.get(pk=SAMPLE_ORGANIZATION_ID)
    sample_user = get_user_model().objects.get(pk=SAMPLE_USER_ADMIN_ID)
    case_matter = Matter.objects.get(pk=SAMPLE_CASE_MATTER_ID)

    assert organization.name == "واحد حقوقی نمونه پارس"
    assert organization.timezone == "Asia/Tehran"
    assert organization.default_language == "fa"
    assert sample_user.preferred_language == "fa"
    assert sample_user.first_name == "آرمان"
    assert case_matter.title == "پرونده مطالبه وجه قرارداد تامین"
