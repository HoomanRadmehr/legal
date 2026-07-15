"""Mutation services for organization user invitations."""

from __future__ import annotations

import hashlib
import hmac
import uuid
from datetime import timedelta

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core import signing
from django.db import IntegrityError, transaction
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from rest_framework.exceptions import APIException, PermissionDenied

from apps.accounts.selectors import get_current_membership
from apps.organizations.models import (
    INVITATION_STATUS_ACCEPTED,
    INVITATION_STATUS_PENDING,
    ROLE_LEGAL_ADMIN,
    STATUS_ACTIVE,
    Membership,
    UserInvitation,
)
from apps.organizations.permissions import require_admin
from apps.organizations.selectors import membership_get_for_admin
from common.api.errors import ConflictError
from common.services.activity import record_activity
from common.services.idempotency import (
    begin_idempotency_record,
    complete_idempotency_record,
    replay_response_for_record,
    request_hash_for_payload,
)
from common.services.outbox import create_outbox_event

ACTION_MEMBERSHIP_INVITED = "membership.invited"
ACTION_MEMBERSHIP_INVITATION_ACCEPTED = "membership.invitation_accepted"
ACTION_MEMBERSHIP_ROLE_CHANGED = "membership.role_changed"
EVENT_INVITATION_EMAIL_REQUESTED = "membership.invitation_email_requested"
EVENT_INVITATION_ACCEPTED = "membership.invitation_accepted"
EVENT_MEMBERSHIP_ROLE_CHANGED = "membership.role_changed"
IDEMPOTENCY_SCOPE_MEMBERSHIP_INVITE = "memberships.invite"
INVITATION_TTL_DAYS = 7


class InvitationAcceptError(APIException):
    status_code = 400
    default_detail = _("Invitation is invalid or expired.")
    default_code = "invitation_invalid"


def create_membership_invitation(
    *, actor, data: dict, idempotency_key: str, request_id: str = ""
) -> tuple[int, dict]:
    actor_membership = require_invitation_admin(actor=actor)
    request_hash = request_hash_for_payload(payload=invitation_request_payload(data=data))
    record = begin_idempotency_record(
        organization=actor_membership.organization,
        actor_membership=actor_membership,
        scope=IDEMPOTENCY_SCOPE_MEMBERSHIP_INVITE,
        key=idempotency_key,
        request_hash=request_hash,
    )
    replay = replay_response_for_record(record=record)
    if replay is not None:
        return replay

    with transaction.atomic():
        invitation = create_invitation_records(
            actor_membership=actor_membership,
            data=data,
            request_id=request_id,
        )
        response_body = invitation_response_body(invitation=invitation)
        complete_idempotency_record(record=record, response_status=201, response_body=response_body)
    return 201, response_body


def require_invitation_admin(*, actor):
    membership = get_current_membership(user=actor)
    if membership is None:
        raise PermissionDenied(_("An active organization membership is required."))
    require_admin(membership=membership)
    return membership


def create_invitation_records(*, actor_membership, data: dict, request_id: str):
    email = normalized_email(email=data["email"])
    require_email_available(email=email)
    invitation_id = uuid.uuid4()
    try:
        user = create_inactive_user(email=email, data=data)
        membership = Membership.objects.create(
            organization=actor_membership.organization,
            user=user,
            role=data["role"],
            status=STATUS_ACTIVE,
        )
    except IntegrityError as error:
        raise duplicate_email_error() from error
    invitation = create_user_invitation(
        invitation_id=invitation_id,
        actor_membership=actor_membership,
        membership=membership,
        user=user,
    )
    record_invitation_activity(
        actor_membership=actor_membership,
        membership=membership,
        request_id=request_id,
    )
    create_invitation_outbox(invitation=invitation, actor_membership=actor_membership)
    return invitation


def normalized_email(*, email: str) -> str:
    return get_user_model().objects.normalize_email(email.strip()).lower()


def require_email_available(*, email: str) -> None:
    if get_user_model().objects.filter(username=email).exists():
        raise duplicate_email_error()


def duplicate_email_error() -> ConflictError:
    return ConflictError(_("A user with this email already exists."), code="user_email_conflict")


def create_inactive_user(*, email: str, data: dict):
    user = get_user_model()(
        username=email,
        email=email,
        first_name=data.get("first_name", ""),
        last_name=data.get("last_name", ""),
        preferred_language=data["preferred_language"],
        is_active=False,
    )
    user.set_unusable_password()
    user.save()
    return user


def create_user_invitation(*, invitation_id, actor_membership, membership, user):
    return UserInvitation.objects.create(
        id=invitation_id,
        organization=actor_membership.organization,
        user=user,
        membership=membership,
        invited_by=actor_membership,
        token_hash=hash_invitation_token(invitation_id=invitation_id),
        status=INVITATION_STATUS_PENDING,
        expires_at=timezone.now() + timedelta(days=INVITATION_TTL_DAYS),
    )


def invitation_token_for_id(*, invitation_id) -> str:
    return invitation_signer().sign(str(invitation_id))


def hash_invitation_token(*, invitation_id) -> str:
    token = invitation_token_for_id(invitation_id=invitation_id)
    return hash_invitation_token_value(token=token)


def hash_invitation_token_value(*, token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def invitation_signer():
    return signing.Signer(salt=settings.INVITATION_SIGNING_SALT)


def accept_user_invitation(*, data: dict, request_id: str = "") -> dict:
    invitation_id = invitation_id_from_token(token=data["token"])
    token_hash = hash_invitation_token_value(token=data["token"])
    with transaction.atomic():
        invitation = locked_invitation(invitation_id=invitation_id)
        require_invitation_acceptable(invitation=invitation, token_hash=token_hash)
        activate_invited_user(invitation=invitation, password=data["password"])
        record_invitation_accepted(invitation=invitation, request_id=request_id)
        create_invitation_accepted_outbox(invitation=invitation)
    return {"status": "accepted"}


def change_membership_role(*, actor, membership_id, role: str, request_id: str = ""):
    target = membership_get_for_admin(actor=actor, membership_id=membership_id)
    actor_membership = require_invitation_admin(actor=actor)
    with transaction.atomic():
        locked = locked_membership(membership_id=target.id)
        if locked.role == role:
            return locked
        old_role = locked.role
        require_not_last_admin(target=locked, new_role=role)
        locked.role = role
        locked.save(update_fields=["role", "updated_at"])
        record_role_change(
            actor_membership=actor_membership,
            membership=locked,
            old_role=old_role,
            request_id=request_id,
        )
        create_role_change_outbox(membership=locked, actor_membership=actor_membership)
    return locked


def require_not_last_admin(*, target, new_role: str) -> None:
    if target.role != ROLE_LEGAL_ADMIN or new_role == ROLE_LEGAL_ADMIN:
        return
    remaining = Membership.objects.filter(
        organization=target.organization,
        role=ROLE_LEGAL_ADMIN,
        status=STATUS_ACTIVE,
        user__is_active=True,
    ).exclude(id=target.id)
    if not remaining.exists():
        raise ConflictError(
            _("At least one active Legal Admin is required."),
            code="last_admin_required",
        )


def locked_membership(*, membership_id):
    return (
        Membership.objects.select_for_update()
        .select_related("organization", "user")
        .get(id=membership_id)
    )


def invitation_id_from_token(*, token: str) -> str:
    try:
        invitation_id = invitation_signer().unsign(token)
        return str(uuid.UUID(invitation_id))
    except (signing.BadSignature, ValueError) as error:
        raise invalid_invitation_error() from error


def locked_invitation(*, invitation_id):
    invitation = (
        UserInvitation.objects.select_for_update()
        .select_related("organization", "membership", "membership__user", "user")
        .filter(id=invitation_id)
        .first()
    )
    if invitation is None:
        raise invalid_invitation_error()
    return invitation


def require_invitation_acceptable(*, invitation, token_hash: str) -> None:
    checks = (
        hmac.compare_digest(invitation.token_hash, token_hash),
        invitation.status == INVITATION_STATUS_PENDING,
        invitation.expires_at > timezone.now(),
        invitation.user_id == invitation.membership.user_id,
        invitation.user.is_active is False,
        invitation.membership.status == STATUS_ACTIVE,
    )
    if not all(checks):
        raise invalid_invitation_error()


def invalid_invitation_error() -> InvitationAcceptError:
    return InvitationAcceptError()


def activate_invited_user(*, invitation, password: str) -> None:
    invitation.user.set_password(password)
    invitation.user.is_active = True
    invitation.user.save(update_fields=["password", "is_active", "updated_at"])
    invitation.status = INVITATION_STATUS_ACCEPTED
    invitation.accepted_at = timezone.now()
    invitation.save(update_fields=["status", "accepted_at", "updated_at"])


def record_invitation_activity(*, actor_membership, membership, request_id: str) -> None:
    record_activity(
        organization=actor_membership.organization,
        actor_membership=actor_membership,
        actor_user=actor_membership.user,
        action=ACTION_MEMBERSHIP_INVITED,
        target_type="membership",
        target_id=membership.id,
        after_values={
            "id": str(membership.id),
            "organization_id": str(actor_membership.organization_id),
        },
        request_id=request_id,
    )


def record_invitation_accepted(*, invitation, request_id: str) -> None:
    record_activity(
        organization=invitation.organization,
        actor_membership=invitation.membership,
        actor_user=invitation.user,
        action=ACTION_MEMBERSHIP_INVITATION_ACCEPTED,
        target_type="membership",
        target_id=invitation.membership_id,
        after_values={
            "id": str(invitation.membership_id),
            "organization_id": str(invitation.organization_id),
            "status": INVITATION_STATUS_ACCEPTED,
        },
        request_id=request_id,
    )


def record_role_change(*, actor_membership, membership, old_role: str, request_id: str) -> None:
    record_activity(
        organization=membership.organization,
        actor_membership=actor_membership,
        actor_user=actor_membership.user,
        action=ACTION_MEMBERSHIP_ROLE_CHANGED,
        target_type="membership",
        target_id=membership.id,
        before_values={"id": str(membership.id), "role": old_role},
        after_values={"id": str(membership.id), "role": membership.role},
        request_id=request_id,
    )


def create_invitation_outbox(*, invitation, actor_membership) -> None:
    create_outbox_event(
        organization=actor_membership.organization,
        event_type=EVENT_INVITATION_EMAIL_REQUESTED,
        aggregate_type="user_invitation",
        aggregate_id=invitation.id,
        payload={
            "id": str(invitation.id),
            "organization_id": str(actor_membership.organization_id),
            "actor_id": str(actor_membership.id),
            "target_id": str(invitation.membership_id),
            "target_type": "membership",
            "action": EVENT_INVITATION_EMAIL_REQUESTED,
        },
    )


def create_role_change_outbox(*, membership, actor_membership) -> None:
    create_outbox_event(
        organization=membership.organization,
        event_type=EVENT_MEMBERSHIP_ROLE_CHANGED,
        aggregate_type="membership",
        aggregate_id=membership.id,
        payload={
            "id": str(membership.id),
            "organization_id": str(membership.organization_id),
            "actor_id": str(actor_membership.id),
            "target_id": str(membership.id),
            "target_type": "membership",
            "action": EVENT_MEMBERSHIP_ROLE_CHANGED,
            "role": membership.role,
        },
    )


def create_invitation_accepted_outbox(*, invitation) -> None:
    create_outbox_event(
        organization=invitation.organization,
        event_type=EVENT_INVITATION_ACCEPTED,
        aggregate_type="user_invitation",
        aggregate_id=invitation.id,
        payload={
            "id": str(invitation.id),
            "organization_id": str(invitation.organization_id),
            "actor_id": str(invitation.membership_id),
            "target_id": str(invitation.membership_id),
            "target_type": "membership",
            "action": EVENT_INVITATION_ACCEPTED,
        },
    )


def invitation_response_body(*, invitation) -> dict:
    return {
        "id": str(invitation.membership_id),
        "organization_id": str(invitation.organization_id),
        "user_id": str(invitation.user_id),
        "invitation_id": str(invitation.id),
        "role": invitation.membership.role,
        "status": invitation.membership.status,
        "invitation_status": invitation.status,
        "expires_at": invitation.expires_at.isoformat().replace("+00:00", "Z"),
    }


def invitation_request_payload(*, data: dict) -> dict:
    return {
        "email": normalized_email(email=data["email"]),
        "first_name": data.get("first_name", ""),
        "last_name": data.get("last_name", ""),
        "preferred_language": data["preferred_language"],
        "role": data["role"],
    }
