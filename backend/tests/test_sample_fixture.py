"""Tests for deterministic sample fixture loading."""

from __future__ import annotations

from io import StringIO

import pytest
from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.core.management.base import CommandError

from apps.cases.models import CaseParty, LegalCase
from apps.contracts.models import Contract
from apps.documents.models import Document, UploadSession
from apps.matters.models import Matter
from apps.notices.models import LegalNotice
from apps.organizations.management.commands.load_sample_fixture import (
    SAMPLE_CASE_MATTER_ID,
    SAMPLE_CONTRACT_MATTER_ID,
    SAMPLE_DOCUMENT_ID,
    SAMPLE_NOTICE_MATTER_ID,
    SAMPLE_ORGANIZATION_ID,
)
from apps.organizations.models import Membership, Organization

pytestmark = pytest.mark.django_db


def test_load_sample_fixture_is_repeatable_and_covers_requested_domains() -> None:
    output = StringIO()

    call_command("load_sample_fixture", allow_non_debug=True, stdout=output)
    first_counts = sample_counts()
    call_command("load_sample_fixture", allow_non_debug=True)

    assert sample_counts() == first_counts
    assert Organization.objects.filter(pk=SAMPLE_ORGANIZATION_ID).exists()
    assert sorted(sample_references()) == [
        "SAMPLE-CASE-001",
        "SAMPLE-CON-001",
        "SAMPLE-NOT-001",
    ]
    assert LegalCase.objects.filter(pk=SAMPLE_CASE_MATTER_ID).exists()
    assert Contract.objects.filter(pk=SAMPLE_CONTRACT_MATTER_ID).exists()
    assert LegalNotice.objects.filter(pk=SAMPLE_NOTICE_MATTER_ID).exists()
    assert Document.objects.filter(pk=SAMPLE_DOCUMENT_ID, status="available").exists()
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
        LegalCase,
        CaseParty,
        Contract,
        LegalNotice,
        UploadSession,
        Document,
    ]
    return {model.__name__: model.objects.count() for model in models}


def sample_references() -> set[str]:
    return set(
        Matter.objects.filter(reference_code__startswith="SAMPLE-").values_list(
            "reference_code",
            flat=True,
        )
    )
