"""Test factories for activity and outbox models."""

from __future__ import annotations

import factory
from django.utils.crypto import get_random_string

from apps.activity.models import ACTION_CASE_CREATED, ActivityLog, OutboxEvent
from apps.matters.tests.factories import MatterFactory
from apps.organizations.tests.factories import MembershipFactory, OrganizationFactory


class ActivityLogFactory(factory.django.DjangoModelFactory):
    organization = factory.SubFactory(OrganizationFactory)
    matter = factory.SubFactory(MatterFactory, organization=factory.SelfAttribute("..organization"))
    actor_membership = factory.SubFactory(
        MembershipFactory,
        organization=factory.SelfAttribute("..organization"),
    )
    action = ACTION_CASE_CREATED
    target_type = "matter"
    target_id = factory.SelfAttribute("matter.id")
    before_values = {}
    after_values = {"status": "open"}
    metadata = {}
    request_id = "request-1"

    class Meta:
        model = ActivityLog


class OutboxEventFactory(factory.django.DjangoModelFactory):
    organization = factory.SubFactory(OrganizationFactory)
    event_type = "case.created"
    aggregate_type = "matter"
    aggregate_id = factory.Faker("uuid4")
    payload = factory.LazyFunction(lambda: {"matter_id": get_random_string(12)})

    class Meta:
        model = OutboxEvent
