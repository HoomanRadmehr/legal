"""Mutation services for contracts."""

from __future__ import annotations

import json

from django.db import transaction
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from rest_framework.exceptions import APIException, PermissionDenied

from apps.accounts.selectors import get_current_membership
from apps.activity.models import (
    ACTION_CONTRACT_CREATED,
    ACTION_CONTRACT_UPDATED,
    ACTION_MATTER_ARCHIVED,
)
from apps.contracts.models import MAX_KEY_TERMS_BYTES, Contract
from apps.matters.models import KIND_CONTRACT, STATUS_ACTIVE, STATUS_ARCHIVED, Matter
from apps.matters.permissions import require_matter_edit
from apps.matters.services import ensure_edit_grant
from apps.organizations.models import STATUS_ACTIVE as MEMBERSHIP_STATUS_ACTIVE
from apps.organizations.models import Membership
from apps.organizations.permissions import is_admin_or_manager, is_counsel
from common.api.errors import ConflictError, DomainRuleError
from common.services.activity import record_activity
from common.services.outbox import create_outbox_event
from common.services.versioning import require_version

CONTRACT_UPDATE_FIELDS = {
    "title",
    "reference_code",
    "status",
    "priority",
    "description",
    "opened_on",
    "closed_on",
}


class ContractDateRuleError(APIException):
    status_code = 422
    default_detail = _("Contract date order is invalid.")
    default_code = "contract_date_invalid"


def contract_create(*, actor, data: dict) -> Contract:
    actor_membership = require_contract_actor(actor=actor)
    require_contract_create_permission(actor_membership=actor_membership)
    owner = resolve_contract_owner(actor_membership=actor_membership, owner_id=data.get("owner_id"))
    validate_contract_dates(data=contract_date_values(data=data))
    validate_key_terms(key_terms=data.get("key_terms", {}))

    with transaction.atomic():
        require_reference_available(
            organization=actor_membership.organization,
            reference_code=data["reference_code"],
        )
        matter = Matter.objects.create(
            organization=actor_membership.organization,
            kind=KIND_CONTRACT,
            title=data["title"],
            reference_code=data["reference_code"],
            status=data.get("status") or STATUS_ACTIVE,
            priority=data["priority"],
            owner=owner,
            description=data.get("description", ""),
            opened_on=data.get("opened_on"),
            closed_on=data.get("closed_on"),
            created_by=actor_membership,
        )
        contract = Contract.objects.create(matter=matter, **contract_detail_values(data=data))
        ensure_edit_grant(actor_membership=actor_membership, matter=matter, membership=owner)
        record_contract_created(actor_membership=actor_membership, contract=contract)
        create_contract_outbox(event_type=ACTION_CONTRACT_CREATED, contract=contract)
        return contract


def contract_update(*, actor, contract: Contract, data: dict, expected_version: int) -> Contract:
    actor_membership = require_contract_actor(actor=actor)
    with transaction.atomic():
        matter = Matter.objects.select_for_update().get(id=contract.matter_id)
        locked_contract = Contract.objects.select_for_update().get(matter=matter)
        require_matter_edit(membership=actor_membership, matter=matter)
        require_version(
            current_version=matter.version,
            expected_version=expected_version,
            conflict_code="contract_version_conflict",
        )
        apply_contract_update(
            actor_membership=actor_membership,
            contract=locked_contract,
            data=data,
        )
        record_contract_updated(actor_membership=actor_membership, contract=locked_contract)
        create_contract_outbox(event_type=ACTION_CONTRACT_UPDATED, contract=locked_contract)
        return locked_contract


def contract_archive(*, actor, contract: Contract, expected_version: int) -> Contract:
    actor_membership = require_contract_actor(actor=actor)
    with transaction.atomic():
        matter = Matter.objects.select_for_update().get(id=contract.matter_id)
        locked_contract = Contract.objects.select_for_update().get(matter=matter)
        require_matter_edit(membership=actor_membership, matter=matter)
        require_version(
            current_version=matter.version,
            expected_version=expected_version,
            conflict_code="contract_version_conflict",
        )
        matter.status = STATUS_ARCHIVED
        matter.archived_at = timezone.now()
        matter.archived_by = actor_membership
        matter.version += 1
        matter.save(update_fields=["status", "archived_at", "archived_by", "version", "updated_at"])
        record_contract_archived(actor_membership=actor_membership, contract=locked_contract)
        create_contract_outbox(event_type=ACTION_MATTER_ARCHIVED, contract=locked_contract)
        return locked_contract


def require_contract_actor(*, actor):
    membership = get_current_membership(user=actor)
    if membership is None:
        raise PermissionDenied(_("An active organization membership is required."))
    return membership


def require_contract_create_permission(*, actor_membership) -> None:
    if not (
        is_admin_or_manager(membership=actor_membership) or is_counsel(membership=actor_membership)
    ):
        raise PermissionDenied(_("You do not have permission to create contracts."))


def resolve_contract_owner(*, actor_membership, owner_id):
    if owner_id is None or str(owner_id) == str(actor_membership.id):
        return actor_membership
    if not is_admin_or_manager(membership=actor_membership):
        raise PermissionDenied(_("Only administrators or managers may assign another owner."))
    owner = active_membership_by_id(
        organization=actor_membership.organization, membership_id=owner_id
    )
    if owner is None:
        raise DomainRuleError(_("Owner must be active in the organization."), code="owner_invalid")
    return owner


def active_membership_by_id(*, organization, membership_id):
    return Membership.objects.filter(
        id=membership_id,
        organization=organization,
        status=MEMBERSHIP_STATUS_ACTIVE,
        user__is_active=True,
    ).first()


def require_reference_available(*, organization, reference_code: str, matter_id=None) -> None:
    queryset = Matter.objects.filter(organization=organization, reference_code=reference_code)
    if matter_id is not None:
        queryset = queryset.exclude(id=matter_id)
    if queryset.exists():
        raise ConflictError(_("Reference code already exists."), code="contract_reference_conflict")


def contract_detail_values(*, data: dict) -> dict:
    return {
        "contract_type": data["contract_type"],
        "counterparty": data["counterparty"],
        "effective_date": data["effective_date"],
        "expiration_date": data.get("expiration_date"),
        "renewal_date": data.get("renewal_date"),
        "key_terms": data.get("key_terms", {}),
    }


def contract_date_values(*, data: dict) -> dict:
    return {
        "effective_date": data["effective_date"],
        "expiration_date": data.get("expiration_date"),
        "renewal_date": data.get("renewal_date"),
    }


def validate_contract_dates(*, data: dict) -> None:
    effective_date = data["effective_date"]
    expiration_date = data.get("expiration_date")
    renewal_date = data.get("renewal_date")
    if expiration_date is not None and expiration_date < effective_date:
        raise ContractDateRuleError(_("Expiration date cannot precede effective date."))
    if renewal_date is not None and renewal_date < effective_date:
        raise ContractDateRuleError(_("Renewal date cannot precede effective date."))
    if renewal_date is not None and expiration_date is not None and renewal_date > expiration_date:
        raise ContractDateRuleError(_("Renewal date cannot be after expiration date."))


def validate_key_terms(*, key_terms: dict) -> None:
    if not isinstance(key_terms, dict):
        raise DomainRuleError(
            _("Key terms must be a JSON object."), code="contract_key_terms_invalid"
        )
    encoded = json.dumps(key_terms, sort_keys=True, separators=(",", ":"), default=str)
    if len(encoded.encode("utf-8")) > MAX_KEY_TERMS_BYTES:
        raise DomainRuleError(_("Key terms are too large."), code="contract_key_terms_too_large")


def apply_contract_update(*, actor_membership, contract: Contract, data: dict) -> None:
    matter = contract.matter
    if "reference_code" in data:
        require_reference_available(
            organization=matter.organization,
            reference_code=data["reference_code"],
            matter_id=matter.id,
        )
    if "owner_id" in data:
        matter.owner = resolve_contract_owner(
            actor_membership=actor_membership, owner_id=data["owner_id"]
        )
        ensure_edit_grant(actor_membership=actor_membership, matter=matter, membership=matter.owner)
    update_contract_fields(contract=contract, data=data)
    update_matter_fields(matter=matter, data=data)


def update_contract_fields(*, contract: Contract, data: dict) -> None:
    detail_data = {**contract_detail_current(contract), **data}
    validate_contract_dates(data=contract_date_values(data=detail_data))
    validate_key_terms(key_terms=detail_data.get("key_terms", {}))
    for field, value in contract_detail_values(data=detail_data).items():
        setattr(contract, field, value)
    contract.save(
        update_fields=[
            "contract_type",
            "counterparty",
            "effective_date",
            "expiration_date",
            "renewal_date",
            "key_terms",
        ]
    )


def update_matter_fields(*, matter, data: dict) -> None:
    for field in CONTRACT_UPDATE_FIELDS:
        if field in data:
            setattr(matter, field, data[field])
    matter.version += 1
    matter.save(update_fields=[*CONTRACT_UPDATE_FIELDS, "owner", "version", "updated_at"])


def contract_detail_current(contract: Contract) -> dict:
    return {
        "contract_type": contract.contract_type,
        "counterparty": contract.counterparty,
        "effective_date": contract.effective_date,
        "expiration_date": contract.expiration_date,
        "renewal_date": contract.renewal_date,
        "key_terms": contract.key_terms,
    }


def record_contract_created(*, actor_membership, contract: Contract) -> None:
    record_contract_activity(
        actor_membership=actor_membership,
        contract=contract,
        action=ACTION_CONTRACT_CREATED,
    )


def record_contract_updated(*, actor_membership, contract: Contract) -> None:
    record_contract_activity(
        actor_membership=actor_membership,
        contract=contract,
        action=ACTION_CONTRACT_UPDATED,
    )


def record_contract_archived(*, actor_membership, contract: Contract) -> None:
    record_contract_activity(
        actor_membership=actor_membership,
        contract=contract,
        action=ACTION_MATTER_ARCHIVED,
    )


def record_contract_activity(*, actor_membership, contract: Contract, action: str) -> None:
    matter = contract.matter
    record_activity(
        organization=matter.organization,
        matter=matter,
        actor_membership=actor_membership,
        actor_user=actor_membership.user,
        action=action,
        target_type="matter",
        target_id=matter.id,
        after_values={
            "matter_id": str(matter.id),
            "organization_id": str(matter.organization_id),
            "status": matter.status,
            "priority": matter.priority,
            "version": matter.version,
        },
    )


def create_contract_outbox(*, event_type: str, contract: Contract) -> None:
    matter = contract.matter
    create_outbox_event(
        organization=matter.organization,
        event_type=event_type,
        aggregate_type="matter",
        aggregate_id=matter.id,
        payload={
            "action": event_type,
            "matter_id": str(matter.id),
            "organization_id": str(matter.organization_id),
            "aggregate_id": str(matter.id),
            "aggregate_type": "matter",
        },
    )
