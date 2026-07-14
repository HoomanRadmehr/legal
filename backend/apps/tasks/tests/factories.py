"""Test factories for task models."""

from __future__ import annotations

import datetime as dt

import factory
from django.utils import timezone

from apps.matters.tests.factories import MatterFactory
from apps.organizations.tests.factories import MembershipFactory
from apps.tasks.models import STATUS_TODO, Task


def default_due_at():
    return timezone.make_aware(dt.datetime(2027, 7, 15, 12, 0, 0), dt.UTC)


class TaskFactory(factory.django.DjangoModelFactory):
    matter = factory.SubFactory(MatterFactory)
    organization = factory.SelfAttribute("matter.organization")
    title = factory.Sequence(lambda number: f"Task {number}")
    description = ""
    assignee = factory.SubFactory(
        MembershipFactory,
        organization=factory.SelfAttribute("..organization"),
    )
    due_at = factory.LazyFunction(default_due_at)
    status = STATUS_TODO

    class Meta:
        model = Task
