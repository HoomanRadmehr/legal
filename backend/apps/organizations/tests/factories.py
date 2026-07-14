"""Test factories for organization tenancy models."""

from __future__ import annotations

import factory

from apps.accounts.tests.factories import UserFactory
from apps.organizations.models import (
    LANGUAGE_ENGLISH,
    ROLE_LEGAL_ADMIN,
    STATUS_ACTIVE,
    Membership,
    Organization,
)


class OrganizationFactory(factory.django.DjangoModelFactory):
    name = factory.Sequence(lambda number: f"Organization {number}")
    timezone = "UTC"
    default_language = LANGUAGE_ENGLISH
    is_active = True

    class Meta:
        model = Organization


class MembershipFactory(factory.django.DjangoModelFactory):
    organization = factory.SubFactory(OrganizationFactory)
    user = factory.SubFactory(UserFactory)
    role = ROLE_LEGAL_ADMIN
    status = STATUS_ACTIVE

    class Meta:
        model = Membership
