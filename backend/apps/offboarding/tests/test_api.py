"""API tests for offboarding preview and execute."""

from __future__ import annotations

import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from apps.activity.models import ActivityLog, OutboxEvent
from apps.deadlines.models import STATUS_CANCELLED as DEADLINE_STATUS_CANCELLED
from apps.deadlines.tests.factories import DeadlineFactory
from apps.matters.tests.factories import MatterAccessFactory, MatterFactory
from apps.offboarding.models import OffboardingRun
from apps.organizations.models import (
    ROLE_LEGAL_ADMIN,
    ROLE_LEGAL_COUNSEL,
    ROLE_LEGAL_MANAGER,
    STATUS_ACTIVE,
    STATUS_OFFBOARDED,
)
from apps.organizations.tests.factories import MembershipFactory, OrganizationFactory
from apps.tasks.models import STATUS_DONE
from apps.tasks.tests.factories import TaskFactory

pytestmark = pytest.mark.django_db


def test_admin_previews_offboarding_without_mutation() -> None:
    context = offboarding_context()

    response = authenticated_client(member=context["admin"]).post(
        reverse("offboarding-preview"),
        preview_payload(context=context),
        format="json",
    )

    assert response.status_code == 200
    assert response.json()["counts"] == {
        "owned_matters": 1,
        "open_tasks": 1,
        "open_deadlines": 1,
        "active_access_grants": 1,
    }
    assert OffboardingRun.objects.count() == 0
    assert ActivityLog.objects.count() == 0
    assert OutboxEvent.objects.count() == 0
    assert_departing_state_unchanged(context=context)


def test_non_admin_cannot_preview_or_execute() -> None:
    context = offboarding_context(actor_role=ROLE_LEGAL_MANAGER)
    preview = authenticated_client(member=context["admin"]).post(
        reverse("offboarding-preview"),
        preview_payload(context=context),
        format="json",
    )

    client = authenticated_client(member=context["actor"])
    preview_response = client.post(
        reverse("offboarding-preview"),
        preview_payload(context=context),
        format="json",
    )
    execute_response = client.post(
        reverse("offboarding-execute"),
        execute_payload(context=context, preview=preview.json()),
        format="json",
        HTTP_IDEMPOTENCY_KEY="11111111-1111-1111-1111-111111111111",
    )

    assert preview_response.status_code == 403
    assert execute_response.status_code == 403
    assert_departing_state_unchanged(context=context)


def test_execute_reassigns_work_revokes_access_and_records_evidence() -> None:
    context = offboarding_context()
    preview = preview_for_context(context=context)

    response = authenticated_client(member=context["admin"]).post(
        reverse("offboarding-execute"),
        execute_payload(context=context, preview=preview),
        format="json",
        HTTP_IDEMPOTENCY_KEY="22222222-2222-2222-2222-222222222222",
    )

    assert response.status_code == 200
    assert response.json()["preview"]["fingerprint"] == preview["fingerprint"]
    assert_final_offboarding_state(context=context)
    assert OffboardingRun.objects.count() == 1
    assert ActivityLog.objects.get(action="offboarding.executed")
    assert OutboxEvent.objects.get(event_type="offboarding.executed")


def test_execute_replays_matching_idempotency_key() -> None:
    context = offboarding_context()
    preview = preview_for_context(context=context)
    client = authenticated_client(member=context["admin"])
    payload = execute_payload(context=context, preview=preview)
    header = "33333333-3333-3333-3333-333333333333"

    first = client.post(
        reverse("offboarding-execute"),
        payload,
        format="json",
        HTTP_IDEMPOTENCY_KEY=header,
    )
    second = client.post(
        reverse("offboarding-execute"),
        payload,
        format="json",
        HTTP_IDEMPOTENCY_KEY=header,
    )

    assert first.status_code == 200
    assert second.status_code == 200
    assert second.json() == first.json()
    assert OffboardingRun.objects.count() == 1


def test_execute_conflicting_idempotency_key_returns_409() -> None:
    context = offboarding_context()
    preview = preview_for_context(context=context)
    client = authenticated_client(member=context["admin"])
    header = "44444444-4444-4444-4444-444444444444"

    first = client.post(
        reverse("offboarding-execute"),
        execute_payload(context=context, preview=preview),
        format="json",
        HTTP_IDEMPOTENCY_KEY=header,
    )
    conflict_payload = {
        **execute_payload(context=context, preview=preview),
        "preview_fingerprint": "b" * 64,
    }
    conflict = client.post(
        reverse("offboarding-execute"),
        conflict_payload,
        format="json",
        HTTP_IDEMPOTENCY_KEY=header,
    )

    assert first.status_code == 200
    assert conflict.status_code == 409
    assert conflict.json()["code"] == "idempotency_key_conflict"
    assert OffboardingRun.objects.count() == 1


def test_stale_preview_returns_conflict() -> None:
    context = offboarding_context()
    preview = preview_for_context(context=context)
    TaskFactory(
        organization=context["organization"],
        matter=context["matter"],
        assignee=context["departing"],
    )

    response = authenticated_client(member=context["admin"]).post(
        reverse("offboarding-execute"),
        execute_payload(context=context, preview=preview),
        format="json",
        HTTP_IDEMPOTENCY_KEY="55555555-5555-5555-5555-555555555555",
    )

    assert response.status_code == 409
    assert response.json()["code"] == "offboarding_preview_stale"
    assert_departing_state_unchanged(context=context)


def test_cross_organization_replacement_is_rejected() -> None:
    context = offboarding_context()
    other_replacement = MembershipFactory(role=ROLE_LEGAL_MANAGER)

    response = authenticated_client(member=context["admin"]).post(
        reverse("offboarding-preview"),
        {
            "departing_membership_id": str(context["departing"].id),
            "replacement_membership_id": str(other_replacement.id),
        },
        format="json",
    )

    assert response.status_code == 422
    assert response.json()["code"] == "replacement_membership_invalid"


def test_inactive_replacement_is_rejected() -> None:
    context = offboarding_context()
    context["replacement"].status = STATUS_OFFBOARDED
    context["replacement"].save(update_fields=["status", "updated_at"])

    response = authenticated_client(member=context["admin"]).post(
        reverse("offboarding-preview"),
        preview_payload(context=context),
        format="json",
    )

    assert response.status_code == 422
    assert response.json()["code"] == "replacement_membership_invalid"


def test_last_admin_cannot_be_offboarded_to_non_admin_replacement() -> None:
    organization = OrganizationFactory()
    admin = MembershipFactory(organization=organization, role=ROLE_LEGAL_ADMIN)
    replacement = MembershipFactory(organization=organization, role=ROLE_LEGAL_MANAGER)
    context = offboarding_context(
        organization=organization,
        admin=admin,
        departing=admin,
        replacement=replacement,
    )
    preview = preview_for_context(context=context)

    response = authenticated_client(member=admin).post(
        reverse("offboarding-execute"),
        execute_payload(context=context, preview=preview),
        format="json",
        HTTP_IDEMPOTENCY_KEY="66666666-6666-6666-6666-666666666666",
    )

    assert response.status_code == 409
    assert admin_refresh(admin).status == STATUS_ACTIVE


def test_execute_rolls_back_when_late_stage_fails(monkeypatch) -> None:
    context = offboarding_context()
    preview = preview_for_context(context=context)

    def fail_outbox(*, run, actor_membership):
        raise RuntimeError("forced failure")

    monkeypatch.setattr("apps.offboarding.services.create_offboarding_outbox", fail_outbox)
    with pytest.raises(RuntimeError):
        authenticated_client(member=context["admin"]).post(
            reverse("offboarding-execute"),
            execute_payload(context=context, preview=preview),
            format="json",
            HTTP_IDEMPOTENCY_KEY="77777777-7777-7777-7777-777777777777",
        )

    assert OffboardingRun.objects.count() == 0
    assert ActivityLog.objects.count() == 0
    assert OutboxEvent.objects.count() == 0
    assert_departing_state_unchanged(context=context)


def test_admin_retrieves_run_in_current_organization_only() -> None:
    context = offboarding_context()
    preview = preview_for_context(context=context)
    response = authenticated_client(member=context["admin"]).post(
        reverse("offboarding-execute"),
        execute_payload(context=context, preview=preview),
        format="json",
        HTTP_IDEMPOTENCY_KEY="88888888-8888-8888-8888-888888888888",
    )
    other_admin = MembershipFactory(role=ROLE_LEGAL_ADMIN)

    own_response = authenticated_client(member=context["admin"]).get(
        reverse("offboarding-retrieve", args=[response.json()["id"]])
    )
    other_response = authenticated_client(member=other_admin).get(
        reverse("offboarding-retrieve", args=[response.json()["id"]])
    )

    assert own_response.status_code == 200
    assert other_response.status_code == 404


def offboarding_context(
    *,
    actor_role: str = ROLE_LEGAL_ADMIN,
    organization=None,
    admin=None,
    departing=None,
    replacement=None,
) -> dict:
    organization = organization or OrganizationFactory()
    admin = admin or MembershipFactory(organization=organization, role=ROLE_LEGAL_ADMIN)
    actor = admin
    if actor_role != ROLE_LEGAL_ADMIN:
        actor = MembershipFactory(organization=organization, role=actor_role)
    departing = departing or MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL)
    replacement = replacement or MembershipFactory(
        organization=organization,
        role=ROLE_LEGAL_MANAGER,
    )
    work = offboarding_work(
        organization=organization,
        admin=admin,
        departing=departing,
    )
    return {
        "organization": organization,
        "admin": admin,
        "actor": actor,
        "departing": departing,
        "replacement": replacement,
        **work,
    }


def offboarding_work(*, organization, admin, departing) -> dict:
    matter = MatterFactory(organization=organization, owner=departing, created_by=admin)
    task = TaskFactory(organization=organization, matter=matter, assignee=departing)
    closed_task = TaskFactory(
        organization=organization,
        matter=matter,
        assignee=departing,
        status=STATUS_DONE,
    )
    deadline = DeadlineFactory(organization=organization, matter=matter, assignee=departing)
    closed_deadline = DeadlineFactory(
        organization=organization,
        matter=matter,
        assignee=departing,
        status=DEADLINE_STATUS_CANCELLED,
    )
    grant = MatterAccessFactory(
        organization=organization,
        matter=matter,
        membership=departing,
        granted_by=admin,
    )
    return {
        "matter": matter,
        "task": task,
        "closed_task": closed_task,
        "deadline": deadline,
        "closed_deadline": closed_deadline,
        "grant": grant,
    }


def preview_for_context(*, context: dict) -> dict:
    response = authenticated_client(member=context["admin"]).post(
        reverse("offboarding-preview"),
        preview_payload(context=context),
        format="json",
    )
    assert response.status_code == 200
    return response.json()


def preview_payload(*, context: dict) -> dict:
    return {
        "departing_membership_id": str(context["departing"].id),
        "replacement_membership_id": str(context["replacement"].id),
    }


def execute_payload(*, context: dict, preview: dict) -> dict:
    return {
        **preview_payload(context=context),
        "preview_fingerprint": preview["fingerprint"],
        "confirmation": "OFFBOARD",
    }


def authenticated_client(*, member) -> APIClient:
    client = APIClient()
    client.force_authenticate(user=member.user)
    return client


def assert_departing_state_unchanged(*, context: dict) -> None:
    assert admin_refresh(context["departing"]).status == STATUS_ACTIVE
    assert matter_refresh(context["matter"]).owner == context["departing"]
    assert task_refresh(context["task"]).assignee == context["departing"]
    assert deadline_refresh(context["deadline"]).assignee == context["departing"]
    assert grant_refresh(context["grant"]).revoked_at is None


def assert_final_offboarding_state(*, context: dict) -> None:
    assert admin_refresh(context["departing"]).status == STATUS_OFFBOARDED
    assert matter_refresh(context["matter"]).owner == context["replacement"]
    assert task_refresh(context["task"]).assignee == context["replacement"]
    assert task_refresh(context["closed_task"]).assignee == context["departing"]
    assert deadline_refresh(context["deadline"]).assignee == context["replacement"]
    assert deadline_refresh(context["closed_deadline"]).assignee == context["departing"]
    assert grant_refresh(context["grant"]).revoked_at is not None


def admin_refresh(membership):
    membership.refresh_from_db()
    return membership


def matter_refresh(matter):
    matter.refresh_from_db()
    return matter


def task_refresh(task):
    task.refresh_from_db()
    return task


def deadline_refresh(deadline):
    deadline.refresh_from_db()
    return deadline


def grant_refresh(grant):
    grant.refresh_from_db()
    return grant
