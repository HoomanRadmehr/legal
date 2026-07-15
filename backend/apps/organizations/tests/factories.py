"""Test factories for organization tenancy models."""

from __future__ import annotations

import factory
from django.utils import timezone

from apps.accounts.tests.factories import UserFactory
from apps.organizations.models import (
    INVITATION_STATUS_PENDING,
    LANGUAGE_ENGLISH,
    ROLE_LEGAL_ADMIN,
    STATUS_ACTIVE,
    Membership,
    Organization,
    UserInvitation,
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


class UserInvitationFactory(factory.django.DjangoModelFactory):
    organization = factory.SelfAttribute("membership.organization")
    user = factory.SelfAttribute("membership.user")
    membership = factory.SubFactory(MembershipFactory)
    invited_by = factory.SubFactory(
        MembershipFactory,
        organization=factory.SelfAttribute("..organization"),
    )
    token_hash = factory.Faker("sha256")
    status = INVITATION_STATUS_PENDING
    expires_at = factory.LazyFunction(timezone.now)

    class Meta:
        model = UserInvitation
