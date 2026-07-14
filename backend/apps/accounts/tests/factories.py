"""Test factories for the accounts app."""

from __future__ import annotations

import factory
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password

from apps.accounts.models import LANGUAGE_ENGLISH


class UserFactory(factory.django.DjangoModelFactory):
    username = factory.Sequence(lambda number: f"user{number}@example.test")
    email = factory.LazyAttribute(lambda user: user.username)
    first_name = "Test"
    last_name = "User"
    preferred_language = LANGUAGE_ENGLISH
    password = factory.LazyFunction(lambda: make_password("test-password"))

    class Meta:
        model = get_user_model()
