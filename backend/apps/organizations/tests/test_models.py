"""Tests for organization and membership models."""

from __future__ import annotations

import uuid

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError, models, transaction

from apps.accounts.tests.factories import UserFactory
from apps.organizations.models import (
    DEFAULT_LANGUAGE_CHOICES,
    LANGUAGE_ENGLISH,
    LANGUAGE_PERSIAN,
    MEMBERSHIP_ROLE_CHOICES,
    MEMBERSHIP_STATUS_CHOICES,
    ROLE_LEGAL_ADMIN,
    ROLE_LEGAL_COUNSEL,
    ROLE_LEGAL_MANAGER,
    ROLE_VIEWER,
    STATUS_ACTIVE,
    STATUS_OFFBOARDED,
    STATUS_SUSPENDED,
    Membership,
    Organization,
)
from apps.organizations.tests.factories import MembershipFactory, OrganizationFactory
from common.models import CommonModel

pytestmark = pytest.mark.django_db


def test_organization_inherits_only_common_model() -> None:
    assert Organization.__bases__ == (CommonModel,)


def test_membership_inherits_only_common_model() -> None:
    assert Membership.__bases__ == (CommonModel,)


def test_organization_fields_and_choices_are_canonical() -> None:
    organization = OrganizationFactory()
    invalid_language = OrganizationFactory.build(default_language="de")
    invalid_timezone = OrganizationFactory.build(timezone="Mars/Phobos")

    assert isinstance(organization.id, uuid.UUID)
    assert organization.timezone == "UTC"
    assert organization.default_language == LANGUAGE_ENGLISH
    assert set(dict(DEFAULT_LANGUAGE_CHOICES)) == {LANGUAGE_ENGLISH, LANGUAGE_PERSIAN}

    with pytest.raises(ValidationError):
        invalid_language.full_clean()
    with pytest.raises(ValidationError):
        invalid_timezone.full_clean()


def test_membership_role_and_status_choices_are_canonical() -> None:
    membership = MembershipFactory()
    invalid_role = MembershipFactory.build(role="owner")
    invalid_status = MembershipFactory.build(status="disabled")

    assert membership.status == STATUS_ACTIVE
    assert set(dict(MEMBERSHIP_ROLE_CHOICES)) == {
        ROLE_LEGAL_ADMIN,
        ROLE_LEGAL_MANAGER,
        ROLE_LEGAL_COUNSEL,
        ROLE_VIEWER,
    }
    assert set(dict(MEMBERSHIP_STATUS_CHOICES)) == {
        STATUS_ACTIVE,
        STATUS_SUSPENDED,
        STATUS_OFFBOARDED,
    }

    with pytest.raises(ValidationError):
        invalid_role.full_clean()
    with pytest.raises(ValidationError):
        invalid_status.full_clean()


def test_membership_has_organization_user_database_uniqueness() -> None:
    organization = OrganizationFactory()
    user = UserFactory()
    MembershipFactory(organization=organization, user=user)

    with pytest.raises(IntegrityError), transaction.atomic():
        MembershipFactory(organization=organization, user=user)


def test_inactive_membership_is_distinct_from_inactive_user() -> None:
    inactive_user = UserFactory(is_active=False)
    suspended_membership = MembershipFactory(status=STATUS_SUSPENDED)
    inactive_user_membership = MembershipFactory(user=inactive_user, status=STATUS_ACTIVE)
    offboarded_membership = MembershipFactory(status=STATUS_OFFBOARDED)

    assert suspended_membership.status == STATUS_SUSPENDED
    assert suspended_membership.user.is_active is True
    assert inactive_user_membership.status == STATUS_ACTIVE
    assert inactive_user_membership.user.is_active is False
    assert offboarded_membership.offboarded_at is None


def test_membership_foreign_keys_protect_tenant_records() -> None:
    organization_field = Membership._meta.get_field("organization")
    user_field = Membership._meta.get_field("user")

    assert organization_field.remote_field.on_delete is models.PROTECT
    assert user_field.remote_field.on_delete is models.PROTECT
