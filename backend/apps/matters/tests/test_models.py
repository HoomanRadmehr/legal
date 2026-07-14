"""Tests for concrete matter models."""

from __future__ import annotations

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError, models, transaction
from django.utils import timezone

from apps.matters.models import (
    ACCESS_LEVEL_EDIT,
    KIND_CASE,
    KIND_CONTRACT,
    KIND_NOTICE,
    MATTER_KIND_CHOICES,
    PRIORITY_CHOICES,
    Matter,
    MatterAccess,
    MatterRelation,
)
from apps.matters.tests.factories import (
    MatterAccessFactory,
    MatterFactory,
    MatterRelationFactory,
)
from apps.organizations.tests.factories import MembershipFactory, OrganizationFactory
from common.models import CommonModel

pytestmark = pytest.mark.django_db


def test_matter_models_inherit_only_common_model() -> None:
    assert Matter.__bases__ == (CommonModel,)
    assert MatterAccess.__bases__ == (CommonModel,)
    assert MatterRelation.__bases__ == (CommonModel,)


def test_matter_fields_and_choices_are_canonical() -> None:
    matter = MatterFactory()

    assert matter.kind == KIND_CASE
    assert set(dict(MATTER_KIND_CHOICES)) == {KIND_CASE, KIND_CONTRACT, KIND_NOTICE}
    assert set(dict(PRIORITY_CHOICES)) == {"low", "normal", "high", "critical"}
    assert matter.version == 1
    assert matter.archived_at is None
    assert matter.archived_by is None


def test_matter_reference_is_unique_per_organization() -> None:
    organization = OrganizationFactory()
    MatterFactory(organization=organization, reference_code="REF-1")
    MatterFactory(reference_code="REF-1")

    with pytest.raises(IntegrityError), transaction.atomic():
        MatterFactory(organization=organization, reference_code="REF-1")


def test_matter_rejects_cross_organization_memberships() -> None:
    organization = OrganizationFactory()
    other_organization = OrganizationFactory()
    owner = MembershipFactory(organization=other_organization)
    creator = MembershipFactory(organization=organization)
    matter = MatterFactory.build(organization=organization, owner=owner, created_by=creator)

    with pytest.raises(ValidationError) as error:
        matter.full_clean()

    assert "owner" in error.value.message_dict


def test_active_matter_access_is_unique_per_matter_and_membership() -> None:
    grant = MatterAccessFactory(level=ACCESS_LEVEL_EDIT)
    MatterAccessFactory(matter=grant.matter, membership=grant.membership, revoked_at=timezone.now())

    with pytest.raises(IntegrityError), transaction.atomic():
        MatterAccessFactory(matter=grant.matter, membership=grant.membership)


def test_matter_access_rejects_cross_organization_membership() -> None:
    matter = MatterFactory()
    other_membership = MembershipFactory()
    grant = MatterAccessFactory.build(matter=matter, membership=other_membership)

    with pytest.raises(ValidationError) as error:
        grant.full_clean()

    assert "membership" in error.value.message_dict


def test_matter_relation_rejects_self_relation_and_cross_organization_target() -> None:
    matter = MatterFactory()
    self_relation = MatterRelationFactory.build(
        organization=matter.organization,
        source=matter,
        target=matter,
    )
    cross_relation = MatterRelationFactory.build(
        organization=matter.organization,
        source=matter,
        target=MatterFactory(),
    )

    with pytest.raises(ValidationError) as self_error:
        self_relation.full_clean()
    with pytest.raises(ValidationError) as cross_error:
        cross_relation.full_clean()

    assert "target" in self_error.value.message_dict
    assert "target" in cross_error.value.message_dict


def test_matter_foreign_keys_protect_shared_boundary() -> None:
    matter_owner_field = Matter._meta.get_field("owner")
    access_matter_field = MatterAccess._meta.get_field("matter")
    relation_source_field = MatterRelation._meta.get_field("source")

    assert matter_owner_field.remote_field.on_delete is models.PROTECT
    assert access_matter_field.remote_field.on_delete is models.PROTECT
    assert relation_source_field.remote_field.on_delete is models.PROTECT
