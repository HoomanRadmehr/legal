"""Create idempotent local demonstration data."""

from __future__ import annotations

import datetime as dt
from dataclasses import dataclass

from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.cases.models import LegalCase
from apps.cases.services import case_create
from apps.contracts.models import Contract
from apps.contracts.services import contract_create
from apps.deadlines.models import PRIORITY_HIGH, Deadline
from apps.deadlines.services import deadline_create
from apps.documents.models import (
    DOCUMENT_STATUS_AVAILABLE,
    UPLOAD_STATUS_AVAILABLE,
    Document,
    UploadSession,
)
from apps.matters.models import (
    ACCESS_LEVEL_VIEW,
    STATUS_RESPONSE_DUE,
    Matter,
)
from apps.matters.models import (
    STATUS_ACTIVE as MATTER_STATUS_ACTIVE,
)
from apps.matters.models import (
    STATUS_OPEN as MATTER_STATUS_OPEN,
)
from apps.matters.services import grant_matter_access
from apps.notices.models import LegalNotice
from apps.notices.services import notice_create
from apps.notifications.models import (
    CHANNEL_EMAIL,
    CHANNEL_IN_APP,
    EVENT_NOTIFICATION_CREATED,
    Notification,
    NotificationDelivery,
    NotificationPreference,
)
from apps.organizations.models import (
    LANGUAGE_ENGLISH,
    ROLE_LEGAL_ADMIN,
    ROLE_LEGAL_COUNSEL,
    ROLE_LEGAL_MANAGER,
    ROLE_VIEWER,
    STATUS_ACTIVE,
    Membership,
    Organization,
)
from apps.tasks.models import STATUS_IN_PROGRESS, STATUS_TODO, Task
from apps.tasks.services import task_create

DEMO_PASSWORD = "demo-password-123"
PRIMARY_ORG_NAME = "Demo Legal Organization"
ISOLATION_ORG_NAME = "Demo Isolation Organization"
DEADLINE_REMINDER_EVENT = "deadline.reminder.created"


@dataclass(frozen=True)
class DemoUser:
    username: str
    email: str
    first_name: str
    last_name: str
    role: str


PRIMARY_USERS = (
    DemoUser(
        "demo-primary-admin", "demo-primary-admin@example.test", "Demo", "Admin", ROLE_LEGAL_ADMIN
    ),
    DemoUser(
        "demo-primary-manager",
        "demo-primary-manager@example.test",
        "Demo",
        "Manager",
        ROLE_LEGAL_MANAGER,
    ),
    DemoUser(
        "demo-primary-counsel",
        "demo-primary-counsel@example.test",
        "Demo",
        "Counsel",
        ROLE_LEGAL_COUNSEL,
    ),
    DemoUser(
        "demo-primary-viewer", "demo-primary-viewer@example.test", "Demo", "Viewer", ROLE_VIEWER
    ),
)
ISOLATION_USERS = (
    DemoUser(
        "demo-isolation-admin",
        "demo-isolation-admin@example.test",
        "Isolation",
        "Admin",
        ROLE_LEGAL_ADMIN,
    ),
    DemoUser(
        "demo-isolation-manager",
        "demo-isolation-manager@example.test",
        "Isolation",
        "Manager",
        ROLE_LEGAL_MANAGER,
    ),
    DemoUser(
        "demo-isolation-counsel",
        "demo-isolation-counsel@example.test",
        "Isolation",
        "Counsel",
        ROLE_LEGAL_COUNSEL,
    ),
    DemoUser(
        "demo-isolation-viewer",
        "demo-isolation-viewer@example.test",
        "Isolation",
        "Viewer",
        ROLE_VIEWER,
    ),
)


def seed_demo_data() -> dict:
    primary = ensure_organization(name=PRIMARY_ORG_NAME)
    isolation = ensure_organization(name=ISOLATION_ORG_NAME)
    primary_members = ensure_memberships(organization=primary, users=PRIMARY_USERS)
    isolation_members = ensure_memberships(organization=isolation, users=ISOLATION_USERS)

    primary_case = ensure_primary_case(members=primary_members)
    ensure_primary_contract(members=primary_members)
    ensure_primary_notice(members=primary_members, related_matter=primary_case.matter)
    ensure_deadlines(members=primary_members, matter=primary_case.matter)
    ensure_tasks(members=primary_members, matter=primary_case.matter)
    ensure_demo_document(membership=primary_members[ROLE_LEGAL_COUNSEL], matter=primary_case.matter)
    ensure_notification_preferences(
        members=[*primary_members.values(), *isolation_members.values()]
    )
    ensure_demo_notification(
        membership=primary_members[ROLE_LEGAL_COUNSEL],
        matter=primary_case.matter,
    )
    grant_matter_access(
        actor_membership=primary_members[ROLE_LEGAL_ADMIN],
        matter=primary_case.matter,
        membership=primary_members[ROLE_VIEWER],
        level=ACCESS_LEVEL_VIEW,
    )
    ensure_isolation_records(members=isolation_members)
    return {"organizations": 2, "memberships": len(primary_members) + len(isolation_members)}


def ensure_organization(*, name: str) -> Organization:
    organization = Organization.objects.filter(name=name).order_by("created_at").first()
    if organization is None:
        return Organization.objects.create(
            name=name,
            timezone="UTC",
            default_language=LANGUAGE_ENGLISH,
            is_active=True,
        )
    organization.timezone = "UTC"
    organization.default_language = LANGUAGE_ENGLISH
    organization.is_active = True
    organization.save(update_fields=["timezone", "default_language", "is_active", "updated_at"])
    return organization


def ensure_memberships(
    *, organization: Organization, users: tuple[DemoUser, ...]
) -> dict[str, Membership]:
    return {
        demo_user.role: ensure_membership(organization=organization, demo_user=demo_user)
        for demo_user in users
    }


def ensure_membership(*, organization: Organization, demo_user: DemoUser) -> Membership:
    user = ensure_user(demo_user=demo_user)
    membership, _ = Membership.objects.update_or_create(
        organization=organization,
        user=user,
        defaults={"role": demo_user.role, "status": STATUS_ACTIVE, "offboarded_at": None},
    )
    return membership


def ensure_user(*, demo_user: DemoUser):
    user_model = get_user_model()
    user, _ = user_model.objects.get_or_create(
        username=demo_user.username,
        defaults={
            "email": demo_user.email,
            "first_name": demo_user.first_name,
            "last_name": demo_user.last_name,
            "is_active": True,
        },
    )
    user.email = demo_user.email
    user.first_name = demo_user.first_name
    user.last_name = demo_user.last_name
    user.is_active = True
    if not user.check_password(DEMO_PASSWORD):
        user.set_password(DEMO_PASSWORD)
    user.save(update_fields=["email", "first_name", "last_name", "is_active", "password"])
    return user


def ensure_primary_case(*, members: dict[str, Membership]) -> LegalCase:
    return get_or_create_case(
        actor=members[ROLE_LEGAL_ADMIN].user,
        owner=members[ROLE_LEGAL_COUNSEL],
        reference_code="CASE-DEMO-001",
        title="Synthetic visible case",
    )


def ensure_primary_contract(*, members: dict[str, Membership]) -> Contract:
    return get_or_create_contract(
        actor=members[ROLE_LEGAL_ADMIN].user,
        owner=members[ROLE_LEGAL_MANAGER],
        reference_code="CON-DEMO-001",
        title="Synthetic hidden vendor contract",
    )


def ensure_primary_notice(*, members: dict[str, Membership], related_matter: Matter) -> LegalNotice:
    return get_or_create_notice(
        actor=members[ROLE_LEGAL_ADMIN].user,
        owner=members[ROLE_LEGAL_COUNSEL],
        reference_code="NOT-DEMO-001",
        title="Synthetic response notice",
        related_matter_ids=[related_matter.id],
    )


def get_or_create_case(*, actor, owner: Membership, reference_code: str, title: str) -> LegalCase:
    existing = LegalCase.objects.filter(
        matter__organization=owner.organization,
        matter__reference_code=reference_code,
    ).first()
    if existing is not None:
        return existing
    return case_create(
        actor=actor,
        data=case_payload(owner=owner, reference_code=reference_code, title=title),
    )


def get_or_create_contract(
    *, actor, owner: Membership, reference_code: str, title: str
) -> Contract:
    existing = Contract.objects.filter(
        matter__organization=owner.organization,
        matter__reference_code=reference_code,
    ).first()
    if existing is not None:
        return existing
    return contract_create(
        actor=actor,
        data=contract_payload(owner=owner, reference_code=reference_code, title=title),
    )


def get_or_create_notice(
    *, actor, owner: Membership, reference_code: str, title: str, related_matter_ids: list
) -> LegalNotice:
    existing = LegalNotice.objects.filter(
        matter__organization=owner.organization,
        matter__reference_code=reference_code,
    ).first()
    if existing is not None:
        return existing
    return notice_create(
        actor=actor,
        data=notice_payload(
            owner=owner,
            reference_code=reference_code,
            title=title,
            related_matter_ids=related_matter_ids,
        ),
    )


def case_payload(*, owner: Membership, reference_code: str, title: str) -> dict:
    return {
        "title": title,
        "reference_code": reference_code,
        "status": MATTER_STATUS_OPEN,
        "priority": "normal",
        "description": "Synthetic demonstration case notes.",
        "case_type": "litigation",
        "court_or_authority": "Synthetic Demo Tribunal",
        "parties": [{"name": "Synthetic Demo Client", "role": "client"}],
        "owner_id": owner.id,
    }


def contract_payload(*, owner: Membership, reference_code: str, title: str) -> dict:
    today = timezone.localdate()
    return {
        "title": title,
        "reference_code": reference_code,
        "status": MATTER_STATUS_ACTIVE,
        "priority": "high",
        "description": "Synthetic demonstration contract notes.",
        "contract_type": "vendor",
        "counterparty": "Synthetic Vendor LLC",
        "effective_date": today,
        "expiration_date": today + dt.timedelta(days=365),
        "renewal_date": today + dt.timedelta(days=330),
        "key_terms": {"demo": "development-only"},
        "owner_id": owner.id,
    }


def notice_payload(
    *, owner: Membership, reference_code: str, title: str, related_matter_ids: list
) -> dict:
    today = timezone.localdate()
    return {
        "title": title,
        "reference_code": reference_code,
        "status": STATUS_RESPONSE_DUE,
        "priority": "critical",
        "description": "Synthetic demonstration notice notes.",
        "sender": "Synthetic Demo Agency",
        "received_date": today,
        "response_deadline": aware_noon(days=2),
        "related_matter_ids": related_matter_ids,
        "owner_id": owner.id,
    }


def ensure_deadlines(*, members: dict[str, Membership], matter: Matter) -> None:
    ensure_deadline(
        actor=members[ROLE_LEGAL_ADMIN].user,
        matter=matter,
        assignee=members[ROLE_LEGAL_COUNSEL],
        title="Synthetic deadline due today",
        due_at=aware_noon(days=0),
    )
    ensure_deadline(
        actor=members[ROLE_LEGAL_ADMIN].user,
        matter=matter,
        assignee=members[ROLE_LEGAL_COUNSEL],
        title="Synthetic upcoming deadline",
        due_at=aware_noon(days=3),
    )
    ensure_deadline(
        actor=members[ROLE_LEGAL_ADMIN].user,
        matter=matter,
        assignee=members[ROLE_LEGAL_MANAGER],
        title="Synthetic overdue deadline",
        due_at=aware_noon(days=-2),
    )


def ensure_deadline(*, actor, matter: Matter, assignee: Membership, title: str, due_at) -> Deadline:
    existing = Deadline.objects.filter(
        organization=matter.organization,
        matter=matter,
        title=title,
    ).first()
    if existing is not None:
        return existing
    return deadline_create(
        actor=actor,
        data={
            "matter_id": matter.id,
            "assignee_id": assignee.id,
            "title": title,
            "description": "Synthetic demonstration deadline.",
            "due_at": due_at,
            "priority": PRIORITY_HIGH,
            "reminder_enabled": True,
        },
    )


def ensure_tasks(*, members: dict[str, Membership], matter: Matter) -> None:
    ensure_task(
        actor=members[ROLE_LEGAL_ADMIN].user,
        matter=matter,
        assignee=members[ROLE_LEGAL_COUNSEL],
        title="Synthetic assigned task",
        due_at=aware_noon(days=1),
        status=STATUS_TODO,
    )
    ensure_task(
        actor=members[ROLE_LEGAL_ADMIN].user,
        matter=matter,
        assignee=members[ROLE_LEGAL_MANAGER],
        title="Synthetic in-progress task",
        due_at=aware_noon(days=4),
        status=STATUS_IN_PROGRESS,
    )


def ensure_task(
    *, actor, matter: Matter, assignee: Membership, title: str, due_at, status: str
) -> Task:
    existing = Task.objects.filter(
        organization=matter.organization,
        matter=matter,
        title=title,
    ).first()
    if existing is not None:
        return existing
    return task_create(
        actor=actor,
        data={
            "matter_id": matter.id,
            "assignee_id": assignee.id,
            "title": title,
            "description": "Synthetic demonstration task.",
            "due_at": due_at,
            "status": status,
        },
    )


def ensure_demo_document(*, membership: Membership, matter: Matter) -> Document:
    object_key = f"demo/{matter.organization_id}/{matter.id}/synthetic-case-summary.pdf"
    now = timezone.now()
    upload, _ = UploadSession.objects.update_or_create(
        object_key=object_key,
        defaults={
            "organization": matter.organization,
            "matter": matter,
            "requested_by": membership,
            "original_filename": "synthetic-case-summary.pdf",
            "expected_size": 1024,
            "expected_content_type": "application/pdf",
            "expected_checksum": "",
            "description": "Synthetic document metadata for local demos.",
            "status": UPLOAD_STATUS_AVAILABLE,
            "expires_at": now + dt.timedelta(minutes=15),
            "completed_at": now,
            "failure_code": "",
        },
    )
    document, _ = Document.objects.update_or_create(
        object_key=object_key,
        defaults=document_defaults(upload=upload, membership=membership),
    )
    return document


def document_defaults(*, upload: UploadSession, membership: Membership) -> dict:
    return {
        "organization": upload.organization,
        "matter": upload.matter,
        "upload_session": upload,
        "original_filename": upload.original_filename,
        "content_type": upload.expected_content_type,
        "size": upload.expected_size,
        "checksum": upload.expected_checksum,
        "status": DOCUMENT_STATUS_AVAILABLE,
        "description": upload.description,
        "uploaded_by": membership,
        "available_at": timezone.now(),
        "revoked_at": None,
        "revoked_by": None,
    }


def ensure_notification_preferences(*, members: list[Membership]) -> None:
    for membership in members:
        ensure_preference(
            membership=membership,
            event_type=EVENT_NOTIFICATION_CREATED,
            channel=CHANNEL_IN_APP,
        )
        ensure_preference(
            membership=membership,
            event_type=EVENT_NOTIFICATION_CREATED,
            channel=CHANNEL_EMAIL,
        )
        ensure_preference(
            membership=membership,
            event_type=DEADLINE_REMINDER_EVENT,
            channel=CHANNEL_IN_APP,
        )


def ensure_preference(*, membership: Membership, event_type: str, channel: str) -> None:
    NotificationPreference.objects.update_or_create(
        membership=membership,
        event_type=event_type,
        channel=channel,
        reminder_offset_minutes=0,
        defaults={"enabled": True},
    )


def ensure_demo_notification(*, membership: Membership, matter: Matter) -> None:
    base_key = f"seed-demo:{matter.id}"
    if NotificationDelivery.objects.filter(dedupe_key__startswith=f"{base_key}:").exists():
        return
    notification = Notification.objects.create(
        organization=membership.organization,
        recipient=membership,
        event_type=EVENT_NOTIFICATION_CREATED,
        title="Synthetic demo notification",
        body="Synthetic local demo notification.",
        data={"matter_id": str(matter.id)},
    )
    create_demo_delivery(notification=notification, base_key=base_key, channel=CHANNEL_IN_APP)
    create_demo_delivery(notification=notification, base_key=base_key, channel=CHANNEL_EMAIL)


def create_demo_delivery(*, notification: Notification, base_key: str, channel: str) -> None:
    NotificationDelivery.objects.create(
        notification=notification,
        organization=notification.organization,
        recipient=notification.recipient,
        channel=channel,
        dedupe_key=f"{base_key}:recipient:{notification.recipient_id}:channel:{channel}",
    )


def ensure_isolation_records(*, members: dict[str, Membership]) -> None:
    legal_case = get_or_create_case(
        actor=members[ROLE_LEGAL_ADMIN].user,
        owner=members[ROLE_LEGAL_COUNSEL],
        reference_code="CASE-ISO-001",
        title="Synthetic isolation case",
    )
    get_or_create_contract(
        actor=members[ROLE_LEGAL_ADMIN].user,
        owner=members[ROLE_LEGAL_MANAGER],
        reference_code="CON-ISO-001",
        title="Synthetic isolation contract",
    )
    ensure_deadline(
        actor=members[ROLE_LEGAL_ADMIN].user,
        matter=legal_case.matter,
        assignee=members[ROLE_LEGAL_COUNSEL],
        title="Synthetic isolation deadline",
        due_at=aware_noon(days=2),
    )


def aware_noon(*, days: int):
    target_date = timezone.localdate() + dt.timedelta(days=days)
    return dt.datetime.combine(target_date, dt.time(12, 0), tzinfo=dt.UTC)
