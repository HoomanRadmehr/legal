"""Load deterministic sample data from a Django fixture."""

from __future__ import annotations

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.core.management.base import BaseCommand, CommandError

from apps.cases.models import CaseParty, LegalCase
from apps.contracts.models import Contract
from apps.deadlines.models import Deadline
from apps.documents.models import Document
from apps.matters.models import Matter, MatterAccess, MatterRelation
from apps.notices.models import LegalNotice
from apps.organizations.models import Membership, Organization
from apps.tasks.models import Task

SAMPLE_FIXTURE = "sample_data"
SAMPLE_USER_ADMIN_ID = "10000000-0000-0000-0000-000000000001"
SAMPLE_USER_COUNSEL_ID = "10000000-0000-0000-0000-000000000002"
SAMPLE_USER_MANAGER_ID = "10000000-0000-0000-0000-000000000003"
SAMPLE_USER_VIEWER_ID = "10000000-0000-0000-0000-000000000004"
SAMPLE_USER_PARALEGAL_ID = "10000000-0000-0000-0000-000000000005"
SAMPLE_ORGANIZATION_ID = "20000000-0000-0000-0000-000000000001"
SAMPLE_MEMBERSHIP_ADMIN_ID = "30000000-0000-0000-0000-000000000001"
SAMPLE_MEMBERSHIP_COUNSEL_ID = "30000000-0000-0000-0000-000000000002"
SAMPLE_MEMBERSHIP_MANAGER_ID = "30000000-0000-0000-0000-000000000003"
SAMPLE_MEMBERSHIP_VIEWER_ID = "30000000-0000-0000-0000-000000000004"
SAMPLE_MEMBERSHIP_PARALEGAL_ID = "30000000-0000-0000-0000-000000000005"
SAMPLE_CASE_MATTER_ID = "40000000-0000-0000-0000-000000000001"
SAMPLE_CONTRACT_MATTER_ID = "40000000-0000-0000-0000-000000000002"
SAMPLE_NOTICE_MATTER_ID = "40000000-0000-0000-0000-000000000003"
SAMPLE_CASE_PARTY_ID = "41000000-0000-0000-0000-000000000001"
SAMPLE_MATTER_ACCESS_ID = "42000000-0000-0000-0000-000000000001"
SAMPLE_MATTER_RELATION_ID = "43000000-0000-0000-0000-000000000001"
SAMPLE_DEADLINE_ID = "50000000-0000-0000-0000-000000000001"
SAMPLE_TASK_ID = "60000000-0000-0000-0000-000000000001"
SAMPLE_DOCUMENT_ID = "70000000-0000-0000-0000-000000000001"

SAMPLE_USER_IDS = (
    SAMPLE_USER_ADMIN_ID,
    SAMPLE_USER_COUNSEL_ID,
    SAMPLE_USER_MANAGER_ID,
    SAMPLE_USER_VIEWER_ID,
    SAMPLE_USER_PARALEGAL_ID,
)
SAMPLE_MEMBERSHIP_IDS = (
    SAMPLE_MEMBERSHIP_ADMIN_ID,
    SAMPLE_MEMBERSHIP_COUNSEL_ID,
    SAMPLE_MEMBERSHIP_MANAGER_ID,
    SAMPLE_MEMBERSHIP_VIEWER_ID,
    SAMPLE_MEMBERSHIP_PARALEGAL_ID,
)
SAMPLE_CASE_MATTER_IDS = (
    SAMPLE_CASE_MATTER_ID,
    "40000000-0000-0000-0000-000000000004",
    "40000000-0000-0000-0000-000000000005",
    "40000000-0000-0000-0000-000000000006",
    "40000000-0000-0000-0000-000000000007",
)
SAMPLE_CONTRACT_MATTER_IDS = (
    SAMPLE_CONTRACT_MATTER_ID,
    "40000000-0000-0000-0000-000000000008",
    "40000000-0000-0000-0000-000000000009",
    "40000000-0000-0000-0000-000000000010",
    "40000000-0000-0000-0000-000000000011",
)
SAMPLE_NOTICE_MATTER_IDS = (
    SAMPLE_NOTICE_MATTER_ID,
    "40000000-0000-0000-0000-000000000012",
    "40000000-0000-0000-0000-000000000013",
    "40000000-0000-0000-0000-000000000014",
    "40000000-0000-0000-0000-000000000015",
)
SAMPLE_CASE_PARTY_IDS = (
    SAMPLE_CASE_PARTY_ID,
    "41000000-0000-0000-0000-000000000002",
    "41000000-0000-0000-0000-000000000003",
    "41000000-0000-0000-0000-000000000004",
    "41000000-0000-0000-0000-000000000005",
)
SAMPLE_MATTER_ACCESS_IDS = (
    SAMPLE_MATTER_ACCESS_ID,
    "42000000-0000-0000-0000-000000000002",
    "42000000-0000-0000-0000-000000000003",
    "42000000-0000-0000-0000-000000000004",
    "42000000-0000-0000-0000-000000000005",
)
SAMPLE_MATTER_RELATION_IDS = (
    SAMPLE_MATTER_RELATION_ID,
    "43000000-0000-0000-0000-000000000002",
    "43000000-0000-0000-0000-000000000003",
    "43000000-0000-0000-0000-000000000004",
    "43000000-0000-0000-0000-000000000005",
)
SAMPLE_DEADLINE_IDS = (
    SAMPLE_DEADLINE_ID,
    "50000000-0000-0000-0000-000000000002",
    "50000000-0000-0000-0000-000000000003",
    "50000000-0000-0000-0000-000000000004",
    "50000000-0000-0000-0000-000000000005",
)
SAMPLE_TASK_IDS = (
    SAMPLE_TASK_ID,
    "60000000-0000-0000-0000-000000000002",
    "60000000-0000-0000-0000-000000000003",
    "60000000-0000-0000-0000-000000000004",
    "60000000-0000-0000-0000-000000000005",
)
SAMPLE_DOCUMENT_IDS = (
    SAMPLE_DOCUMENT_ID,
    "70000000-0000-0000-0000-000000000002",
    "70000000-0000-0000-0000-000000000003",
    "70000000-0000-0000-0000-000000000004",
    "70000000-0000-0000-0000-000000000005",
)


class Command(BaseCommand):
    help = "Load deterministic local sample data when fixture rows are missing."

    def add_arguments(self, parser) -> None:
        parser.add_argument(
            "--allow-non-debug",
            action="store_true",
            help="Allow loading in non-DEBUG settings for isolated test databases only.",
        )

    def handle(self, *args, **options) -> None:
        if not settings.DEBUG and not options["allow_non_debug"]:
            raise CommandError("Refusing to load sample data when DEBUG is false.")

        missing = missing_sample_rows()
        if not missing:
            self.stdout.write(self.style.SUCCESS("Sample fixture already loaded."))
            return

        call_command("loaddata", SAMPLE_FIXTURE, verbosity=0)
        self.stdout.write(
            self.style.SUCCESS(f"Loaded sample fixture and repaired {len(missing)} rows.")
        )


def missing_sample_rows() -> list[str]:
    missing = []
    for model, primary_key in sample_rows():
        if not model.objects.filter(pk=primary_key).exists():
            missing.append(f"{model._meta.label}:{primary_key}")
    return missing


def sample_rows() -> tuple[tuple[object, str], ...]:
    user_model = get_user_model()
    return (
        *sample_model_rows(user_model, SAMPLE_USER_IDS),
        (Organization, SAMPLE_ORGANIZATION_ID),
        *sample_model_rows(Membership, SAMPLE_MEMBERSHIP_IDS),
        *sample_model_rows(Matter, SAMPLE_CASE_MATTER_IDS),
        *sample_model_rows(Matter, SAMPLE_CONTRACT_MATTER_IDS),
        *sample_model_rows(Matter, SAMPLE_NOTICE_MATTER_IDS),
        *sample_model_rows(MatterAccess, SAMPLE_MATTER_ACCESS_IDS),
        *sample_model_rows(MatterRelation, SAMPLE_MATTER_RELATION_IDS),
        *sample_model_rows(LegalCase, SAMPLE_CASE_MATTER_IDS),
        *sample_model_rows(CaseParty, SAMPLE_CASE_PARTY_IDS),
        *sample_model_rows(Contract, SAMPLE_CONTRACT_MATTER_IDS),
        *sample_model_rows(Deadline, SAMPLE_DEADLINE_IDS),
        *sample_model_rows(LegalNotice, SAMPLE_NOTICE_MATTER_IDS),
        *sample_model_rows(Task, SAMPLE_TASK_IDS),
        *sample_model_rows(Document, SAMPLE_DOCUMENT_IDS),
    )


def sample_model_rows(model, primary_keys: tuple[str, ...]) -> tuple[tuple[object, str], ...]:
    return tuple((model, primary_key) for primary_key in primary_keys)
