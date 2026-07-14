"""Test factories for matter models."""

from __future__ import annotations

import factory

from apps.matters.models import (
    ACCESS_LEVEL_VIEW,
    KIND_CASE,
    PRIORITY_NORMAL,
    RELATION_RELATED,
    STATUS_OPEN,
    Matter,
    MatterAccess,
    MatterRelation,
)
from apps.organizations.tests.factories import MembershipFactory, OrganizationFactory


class MatterFactory(factory.django.DjangoModelFactory):
    organization = factory.SubFactory(OrganizationFactory)
    kind = KIND_CASE
    title = factory.Sequence(lambda number: f"Matter {number}")
    reference_code = factory.Sequence(lambda number: f"MAT-{number:04d}")
    status = STATUS_OPEN
    priority = PRIORITY_NORMAL
    owner = factory.SubFactory(
        MembershipFactory, organization=factory.SelfAttribute("..organization")
    )
    created_by = factory.SelfAttribute("owner")

    class Meta:
        model = Matter


class MatterAccessFactory(factory.django.DjangoModelFactory):
    organization = factory.SelfAttribute("matter.organization")
    matter = factory.SubFactory(MatterFactory)
    membership = factory.SubFactory(
        MembershipFactory,
        organization=factory.SelfAttribute("..organization"),
    )
    level = ACCESS_LEVEL_VIEW
    granted_by = factory.SubFactory(
        MembershipFactory,
        organization=factory.SelfAttribute("..organization"),
    )

    class Meta:
        model = MatterAccess


class MatterRelationFactory(factory.django.DjangoModelFactory):
    organization = factory.SubFactory(OrganizationFactory)
    source = factory.SubFactory(MatterFactory, organization=factory.SelfAttribute("..organization"))
    target = factory.SubFactory(MatterFactory, organization=factory.SelfAttribute("..organization"))
    relation_type = RELATION_RELATED

    class Meta:
        model = MatterRelation
