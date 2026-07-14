"""Test factories for legal notices."""

from __future__ import annotations

import datetime as dt

import factory

from apps.deadlines.tests.factories import DeadlineFactory
from apps.matters.models import KIND_NOTICE
from apps.matters.tests.factories import MatterFactory
from apps.notices.models import RESPONSE_STATUS_PENDING, LegalNotice


class LegalNoticeFactory(factory.django.DjangoModelFactory):
    matter = factory.SubFactory(MatterFactory, kind=KIND_NOTICE)
    linked_deadline = factory.SubFactory(
        DeadlineFactory,
        matter=factory.SelfAttribute("..matter"),
        organization=factory.SelfAttribute("..matter.organization"),
        assignee=factory.SelfAttribute("..matter.owner"),
    )
    sender = "City Authority"
    received_date = dt.date(2026, 7, 14)
    response_deadline = dt.datetime(2027, 7, 21, 12, 0, tzinfo=dt.UTC)
    response_status = RESPONSE_STATUS_PENDING

    class Meta:
        model = LegalNotice
