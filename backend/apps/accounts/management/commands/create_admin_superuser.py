"""Create or repair the local admin superuser."""

from __future__ import annotations

import os

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError

DEFAULT_ADMIN_EMAIL = "admin@example.com"
DEFAULT_ADMIN_PASSWORD = "admin"
DEFAULT_ADMIN_USERNAME = "admin"


class Command(BaseCommand):
    help = "Create or repair an idempotent admin superuser."

    def add_arguments(self, parser) -> None:
        parser.add_argument(
            "--username",
            default=os.environ.get("DJANGO_SUPERUSER_USERNAME", DEFAULT_ADMIN_USERNAME),
            help="Admin username. Defaults to DJANGO_SUPERUSER_USERNAME or admin.",
        )
        parser.add_argument(
            "--email",
            default=os.environ.get("DJANGO_SUPERUSER_EMAIL", DEFAULT_ADMIN_EMAIL),
            help="Admin email. Defaults to DJANGO_SUPERUSER_EMAIL or admin@example.com.",
        )
        parser.add_argument(
            "--password",
            default=os.environ.get("DJANGO_SUPERUSER_PASSWORD"),
            help="Admin password. Required outside DEBUG unless DJANGO_SUPERUSER_PASSWORD is set.",
        )

    def handle(self, *args, **options) -> None:
        username = clean_required_text(options["username"], "username")
        email = clean_required_text(options["email"], "email")
        password = admin_password(password=options["password"])
        user, created = create_or_update_admin_user(
            username=username,
            email=email,
            password=password,
        )
        action = "Created" if created else "Updated"
        self.stdout.write(self.style.SUCCESS(f"{action} admin superuser '{user.username}'."))


def clean_required_text(value: str | None, label: str) -> str:
    if value is None or not value.strip():
        raise CommandError(f"Admin {label} must not be blank.")
    return value.strip()


def admin_password(*, password: str | None) -> str:
    if password:
        return password
    if settings.DEBUG:
        return DEFAULT_ADMIN_PASSWORD
    raise CommandError("Set DJANGO_SUPERUSER_PASSWORD or pass --password outside DEBUG.")


def create_or_update_admin_user(*, username: str, email: str, password: str):
    user_model = get_user_model()
    user, created = user_model.objects.get_or_create(
        username=username,
        defaults={
            "email": email,
            "is_active": True,
            "is_staff": True,
            "is_superuser": True,
        },
    )
    user.email = email
    user.is_active = True
    user.is_staff = True
    user.is_superuser = True
    user.set_password(password)
    user.save(update_fields=["email", "is_active", "is_staff", "is_superuser", "password"])
    return user, created
