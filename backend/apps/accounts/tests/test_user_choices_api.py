"""API tests for permission-scoped user choices."""

from __future__ import annotations

import pytest
from django.core.cache import cache
from django.urls import reverse
from rest_framework.test import APIClient

from apps.organizations.models import (
    ROLE_LEGAL_ADMIN,
    ROLE_LEGAL_COUNSEL,
    ROLE_LEGAL_MANAGER,
    ROLE_VIEWER,
    STATUS_SUSPENDED,
)
from apps.organizations.tests.factories import MembershipFactory, OrganizationFactory
from common.api.throttles import UserChoicesThrottle

pytestmark = pytest.mark.django_db


def test_user_choices_return_safe_same_organization_user_ids() -> None:
    organization = OrganizationFactory()
    admin = MembershipFactory(organization=organization, role=ROLE_LEGAL_ADMIN)
    counsel = MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL)
    MembershipFactory(role=ROLE_LEGAL_COUNSEL)

    response = authenticated_client(member=admin).get(
        reverse("users-choices"), {"purpose": "owner"}
    )
    data = response.json()

    assert response.status_code == 200
    assert {item["id"] for item in data["results"]} == {
        str(admin.user_id),
        str(counsel.user_id),
    }
    assert all(set(item) == {"id", "label", "secondary_label", "role"} for item in data["results"])


def test_user_choices_exclude_inactive_user_and_membership() -> None:
    organization = OrganizationFactory()
    admin = MembershipFactory(organization=organization, role=ROLE_LEGAL_ADMIN)
    inactive_user = MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL)
    inactive_user.user.is_active = False
    inactive_user.user.save(update_fields=["is_active"])
    suspended = MembershipFactory(
        organization=organization,
        role=ROLE_LEGAL_COUNSEL,
        status=STATUS_SUSPENDED,
    )

    response = authenticated_client(member=admin).get(
        reverse("users-choices"), {"purpose": "assignee"}
    )

    assert response.status_code == 200
    assert str(inactive_user.user_id) not in choice_ids(response)
    assert str(suspended.user_id) not in choice_ids(response)


def test_user_choice_purposes_apply_role_rules() -> None:
    organization = OrganizationFactory()
    admin = MembershipFactory(organization=organization, role=ROLE_LEGAL_ADMIN)
    manager = MembershipFactory(organization=organization, role=ROLE_LEGAL_MANAGER)
    counsel = MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL)
    viewer = MembershipFactory(organization=organization, role=ROLE_VIEWER)

    owner_response = authenticated_client(member=admin).get(
        reverse("users-choices"), {"purpose": "owner"}
    )
    participant_response = authenticated_client(member=admin).get(
        reverse("users-choices"), {"purpose": "participant"}
    )

    assert choice_ids(owner_response) == {
        str(admin.user_id),
        str(manager.user_id),
        str(counsel.user_id),
    }
    assert str(viewer.user_id) not in choice_ids(owner_response)
    assert str(viewer.user_id) in choice_ids(participant_response)


def test_user_choice_offboarding_replacement_excludes_departing_user() -> None:
    organization = OrganizationFactory()
    admin = MembershipFactory(organization=organization, role=ROLE_LEGAL_ADMIN)
    departing = MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL)

    response = authenticated_client(member=admin).get(
        reverse("users-choices"),
        {
            "purpose": "offboarding_replacement",
            "exclude_user_id": str(departing.user_id),
        },
    )

    assert response.status_code == 200
    assert str(departing.user_id) not in choice_ids(response)
    assert str(admin.user_id) in choice_ids(response)


def test_user_choices_search_name_and_email_only() -> None:
    organization = OrganizationFactory()
    admin = MembershipFactory(organization=organization, role=ROLE_LEGAL_ADMIN)
    target = MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL)
    target.user.first_name = "Sara"
    target.user.last_name = "Ahmadi"
    target.user.email = "sara.choices@example.test"
    target.user.save(update_fields=["first_name", "last_name", "email"])
    hidden = MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL)

    name_response = authenticated_client(member=admin).get(
        reverse("users-choices"), {"purpose": "participant", "q": " ahmadi "}
    )
    email_response = authenticated_client(member=admin).get(
        reverse("users-choices"), {"purpose": "participant", "q": "sara.choices"}
    )

    assert choice_ids(name_response) == {str(target.user_id)}
    assert choice_ids(email_response) == {str(target.user_id)}
    assert str(hidden.user_id) not in choice_ids(name_response)


def test_user_choices_cursor_pagination_and_max_page_size() -> None:
    organization = OrganizationFactory()
    admin = MembershipFactory(organization=organization, role=ROLE_LEGAL_ADMIN)
    for _ in range(55):
        MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL)

    client = authenticated_client(member=admin)
    first_response = client.get(
        reverse("users-choices"), {"purpose": "participant", "page_size": 2}
    )
    second_response = client.get(
        reverse("users-choices"),
        {"purpose": "participant", "page_size": 2, "cursor": first_response.json()["next_cursor"]},
    )
    capped_response = client.get(
        reverse("users-choices"), {"purpose": "participant", "page_size": 99}
    )

    assert first_response.status_code == 200
    assert first_response.json()["has_more"] is True
    assert len(first_response.json()["results"]) == 2
    assert choice_ids(first_response).isdisjoint(choice_ids(second_response))
    assert len(capped_response.json()["results"]) == 50


def test_user_choices_rate_limit_returns_retry_after(monkeypatch) -> None:
    cache.clear()
    monkeypatch.setattr(UserChoicesThrottle, "rate", "1/hour")
    admin = MembershipFactory(role=ROLE_LEGAL_ADMIN)
    client = authenticated_client(member=admin)

    first_response = client.get(reverse("users-choices"), {"purpose": "owner"})
    second_response = client.get(reverse("users-choices"), {"purpose": "owner"})

    assert first_response.status_code == 200
    assert second_response.status_code == 429
    assert second_response.json()["code"] == "rate_limit_exceeded"
    assert int(second_response["Retry-After"]) > 0


def test_user_choice_validation_errors_are_localized() -> None:
    member = MembershipFactory(role=ROLE_LEGAL_ADMIN)
    client = authenticated_client(member=member)

    english_response = client.get(
        reverse("users-choices"), {"purpose": "invalid"}, HTTP_ACCEPT_LANGUAGE="en"
    )
    persian_response = client.get(
        reverse("users-choices"), {"purpose": "invalid"}, HTTP_ACCEPT_LANGUAGE="fa"
    )

    assert english_response.status_code == 400
    assert english_response.json()["code"] == "invalid_input"
    assert english_response.json()["message"] == "Invalid request."
    assert persian_response.json()["message"] == "درخواست نامعتبر است."


def test_user_choice_invalid_cursor_returns_invalid_input() -> None:
    member = MembershipFactory(role=ROLE_LEGAL_ADMIN)

    response = authenticated_client(member=member).get(
        reverse("users-choices"), {"purpose": "owner", "cursor": "not-a-cursor"}
    )

    assert response.status_code == 400
    assert response.json()["code"] == "invalid_input"


def test_user_choice_openapi_operation_is_registered() -> None:
    from drf_spectacular.generators import SchemaGenerator

    schema = SchemaGenerator().get_schema(request=None, public=True)

    assert schema["paths"]["/api/v1/users/choices/"]["get"]["operationId"] == "users_choices"


def test_user_choices_avoid_n_plus_one_queries(django_assert_num_queries) -> None:
    organization = OrganizationFactory()
    admin = MembershipFactory(organization=organization, role=ROLE_LEGAL_ADMIN)
    for _ in range(5):
        MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL)

    with django_assert_num_queries(3):
        response = authenticated_client(member=admin).get(
            reverse("users-choices"), {"purpose": "participant"}
        )

    assert response.status_code == 200


def authenticated_client(*, member) -> APIClient:
    client = APIClient()
    client.force_authenticate(user=member.user)
    return client


def choice_ids(response) -> set[str]:
    return {item["id"] for item in response.json()["results"]}
