"""Test factories for deadline models."""

from __future__ import annotations

import datetime as dt

import factory
from django.utils import timezone

from apps.deadlines.models import PRIORITY_NORMAL, STATUS_OPEN, Deadline
from apps.matters.tests.factories import MatterFactory
from apps.organizations.tests.factories import MembershipFactory


def default_due_at():
    return timezone.make_aware(dt.datetime(2026, 7, 15, 12, 0, 0), dt.UTC)


class DeadlineFactory(factory.django.DjangoModelFactory):
    matter = factory.SubFactory(MatterFactory)
    organization = factory.SelfAttribute("matter.organization")
    title = factory.Sequence(lambda number: f"Deadline {number}")
    description = ""
    due_at = factory.LazyFunction(default_due_at)
    assignee = factory.SubFactory(
        MembershipFactory,
        organization=factory.SelfAttribute("..organization"),
    )
    status = STATUS_OPEN
    priority = PRIORITY_NORMAL
    reminder_enabled = True

    class Meta:
        model = Deadline
