"""Management command for idempotent local demonstration data."""

from __future__ import annotations

from django.core.management.base import BaseCommand

from apps.organizations.management.commands._seed_demo_data import seed_demo_data


class Command(BaseCommand):
    help = "Create idempotent synthetic demo data for local development."

    def handle(self, *args, **options):
        result = seed_demo_data()
        self.stdout.write(
            self.style.SUCCESS(
                "Seeded demo data for "
                f"{result['organizations']} organizations and {result['memberships']} "
                "memberships. Credentials are development-only and documented in "
                "backend/README.md."
            )
        )
