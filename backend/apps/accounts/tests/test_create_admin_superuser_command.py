"""Tests for the admin superuser management command."""

from __future__ import annotations

from io import StringIO

import pytest
from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import override_settings

pytestmark = pytest.mark.django_db


@override_settings(DEBUG=True)
def test_create_admin_superuser_uses_local_defaults_without_printing_password(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    clear_superuser_environment(monkeypatch)
    output = StringIO()

    call_command("create_admin_superuser", stdout=output)

    user = get_user_model().objects.get(username="admin")
    assert user.email == "admin@example.com"
    assert user.is_active is True
    assert user.is_staff is True
    assert user.is_superuser is True
    assert user.check_password("admin")
    assert "admin superuser 'admin'" in output.getvalue()
    assert "password" not in output.getvalue().lower()


@override_settings(DEBUG=True)
def test_create_admin_superuser_repairs_existing_user(monkeypatch: pytest.MonkeyPatch) -> None:
    clear_superuser_environment(monkeypatch)
    user_model = get_user_model()
    user = user_model.objects.create_user(
        username="admin",
        email="old@example.com",
        password="old-password",
        is_active=False,
        is_staff=False,
        is_superuser=False,
    )

    call_command("create_admin_superuser", email="admin@example.com")

    user.refresh_from_db()
    assert user.email == "admin@example.com"
    assert user.is_active is True
    assert user.is_staff is True
    assert user.is_superuser is True
    assert user.check_password("admin")


@override_settings(DEBUG=False)
def test_create_admin_superuser_requires_password_outside_debug(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    clear_superuser_environment(monkeypatch)
    with pytest.raises(CommandError, match="DJANGO_SUPERUSER_PASSWORD"):
        call_command("create_admin_superuser")


@override_settings(DEBUG=False)
def test_create_admin_superuser_accepts_explicit_production_password() -> None:
    call_command(
        "create_admin_superuser",
        username="admin",
        email="admin@example.com",
        password="not-the-local-default",
    )

    user = get_user_model().objects.get(username="admin")
    assert user.is_staff is True
    assert user.is_superuser is True
    assert user.check_password("not-the-local-default")


def clear_superuser_environment(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("DJANGO_SUPERUSER_USERNAME", raising=False)
    monkeypatch.delenv("DJANGO_SUPERUSER_EMAIL", raising=False)
    monkeypatch.delenv("DJANGO_SUPERUSER_PASSWORD", raising=False)
