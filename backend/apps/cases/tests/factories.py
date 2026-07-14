"""Test factories for legal case models."""

from __future__ import annotations

import factory

from apps.cases.models import (
    CASE_TYPE_LITIGATION,
    PARTY_ROLE_CLIENT,
    CaseParty,
    LegalCase,
)
from apps.matters.models import KIND_CASE
from apps.matters.tests.factories import MatterFactory


class LegalCaseFactory(factory.django.DjangoModelFactory):
    matter = factory.SubFactory(MatterFactory, kind=KIND_CASE)
    case_type = CASE_TYPE_LITIGATION
    court_or_authority = "District Court"

    class Meta:
        model = LegalCase


class CasePartyFactory(factory.django.DjangoModelFactory):
    organization = factory.SelfAttribute("case.matter.organization")
    case = factory.SubFactory(LegalCaseFactory)
    name = factory.Sequence(lambda number: f"Party {number}")
    role = PARTY_ROLE_CLIENT
    contact_summary = ""

    class Meta:
        model = CaseParty
