"""Test factories for contract models."""

from __future__ import annotations

import datetime as dt

import factory

from apps.contracts.models import CONTRACT_TYPE_VENDOR, Contract
from apps.matters.models import KIND_CONTRACT
from apps.matters.tests.factories import MatterFactory


class ContractFactory(factory.django.DjangoModelFactory):
    matter = factory.SubFactory(MatterFactory, kind=KIND_CONTRACT)
    contract_type = CONTRACT_TYPE_VENDOR
    counterparty = factory.Sequence(lambda number: f"Counterparty {number}")
    effective_date = dt.date(2026, 7, 14)
    expiration_date = dt.date(2027, 7, 14)
    renewal_date = dt.date(2027, 6, 14)
    key_terms = factory.LazyFunction(dict)

    class Meta:
        model = Contract
