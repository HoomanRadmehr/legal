"""Load deterministic sample data from a Django fixture."""

from __future__ import annotations

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.core.management.base import BaseCommand, CommandError

from apps.cases.models import CaseParty, LegalCase
from apps.contracts.models import Contract
from apps.deadlines.models import Deadline
from apps.documents.models import Document, UploadSession
from apps.matters.models import Matter
from apps.notices.models import LegalNotice
from apps.organizations.models import Membership, Organization

SAMPLE_FIXTURE = "sample_data"
SAMPLE_USER_ADMIN_ID = "10000000-0000-0000-0000-000000000001"
SAMPLE_USER_COUNSEL_ID = "10000000-0000-0000-0000-000000000002"
SAMPLE_ORGANIZATION_ID = "20000000-0000-0000-0000-000000000001"
SAMPLE_MEMBERSHIP_ADMIN_ID = "30000000-0000-0000-0000-000000000001"
SAMPLE_MEMBERSHIP_COUNSEL_ID = "30000000-0000-0000-0000-000000000002"
SAMPLE_CASE_MATTER_ID = "40000000-0000-0000-0000-000000000001"
SAMPLE_CONTRACT_MATTER_ID = "40000000-0000-0000-0000-000000000002"
SAMPLE_NOTICE_MATTER_ID = "40000000-0000-0000-0000-000000000003"
SAMPLE_CASE_PARTY_ID = "41000000-0000-0000-0000-000000000001"
SAMPLE_DEADLINE_ID = "50000000-0000-0000-0000-000000000001"
SAMPLE_UPLOAD_SESSION_ID = "60000000-0000-0000-0000-000000000001"
SAMPLE_DOCUMENT_ID = "70000000-0000-0000-0000-000000000001"


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
        (user_model, SAMPLE_USER_ADMIN_ID),
        (user_model, SAMPLE_USER_COUNSEL_ID),
        (Organization, SAMPLE_ORGANIZATION_ID),
        (Membership, SAMPLE_MEMBERSHIP_ADMIN_ID),
        (Membership, SAMPLE_MEMBERSHIP_COUNSEL_ID),
        (Matter, SAMPLE_CASE_MATTER_ID),
        (Matter, SAMPLE_CONTRACT_MATTER_ID),
        (Matter, SAMPLE_NOTICE_MATTER_ID),
        (LegalCase, SAMPLE_CASE_MATTER_ID),
        (CaseParty, SAMPLE_CASE_PARTY_ID),
        (Contract, SAMPLE_CONTRACT_MATTER_ID),
        (Deadline, SAMPLE_DEADLINE_ID),
        (LegalNotice, SAMPLE_NOTICE_MATTER_ID),
        (UploadSession, SAMPLE_UPLOAD_SESSION_ID),
        (Document, SAMPLE_DOCUMENT_ID),
    )
