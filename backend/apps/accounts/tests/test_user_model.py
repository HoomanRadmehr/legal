"""Tests for the custom user model."""

from __future__ import annotations

import uuid

import pytest
from django.conf import settings
from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.db import models

from apps.accounts.admin import UserAdmin
from apps.accounts.models import (
    LANGUAGE_ENGLISH,
    LANGUAGE_PERSIAN,
    PREFERRED_LANGUAGE_CHOICES,
    User,
)
from apps.accounts.tests.factories import UserFactory

pytestmark = pytest.mark.django_db


def test_user_inherits_only_abstract_user() -> None:
    assert User.__bases__ == (AbstractUser,)


def test_auth_user_model_points_to_accounts_user() -> None:
    assert settings.AUTH_USER_MODEL == "accounts.User"
    assert get_user_model() is User


def test_user_primary_key_is_uuid() -> None:
    field = User._meta.get_field("id")
    user = UserFactory()

    assert isinstance(field, models.UUIDField)
    assert field.primary_key is True
    assert field.editable is False
    assert isinstance(user.id, uuid.UUID)


def test_preferred_language_uses_canonical_choices() -> None:
    field = User._meta.get_field("preferred_language")
    user = UserFactory()
    invalid_user = UserFactory.build(preferred_language="de")

    assert set(dict(PREFERRED_LANGUAGE_CHOICES)) == {LANGUAGE_ENGLISH, LANGUAGE_PERSIAN}
    assert field.max_length == 2
    assert user.preferred_language == LANGUAGE_ENGLISH

    with pytest.raises(ValidationError):
        invalid_user.full_clean()


def test_user_admin_does_not_expose_stored_password_hash() -> None:
    registered_admin = admin.site._registry[User]
    fieldset_fields = []
    for _, options in registered_admin.fieldsets:
        fieldset_fields.extend(options["fields"])

    assert isinstance(registered_admin, UserAdmin)
    assert "password" not in registered_admin.list_display
    assert "password" not in fieldset_fields
