"""API tests for permission-scoped matter choices."""

from __future__ import annotations

import pytest
from django.core.cache import cache
from django.urls import reverse
from rest_framework.test import APIClient

from apps.matters.models import ACCESS_LEVEL_EDIT, ACCESS_LEVEL_VIEW, KIND_CASE, KIND_CONTRACT
from apps.matters.tests.factories import MatterAccessFactory, MatterFactory
from apps.organizations.models import ROLE_LEGAL_ADMIN, ROLE_LEGAL_COUNSEL, ROLE_VIEWER
from apps.organizations.tests.factories import MembershipFactory, OrganizationFactory
from common.api.throttles import MatterChoicesThrottle

pytestmark = pytest.mark.django_db


def test_matter_choices_return_safe_same_organization_matter_ids() -> None:
    organization = OrganizationFactory()
    admin = MembershipFactory(organization=organization, role=ROLE_LEGAL_ADMIN)
    matter = MatterFactory(organization=organization, owner=admin)
    MatterFactory()

    response = authenticated_client(member=admin).get(
        reverse("matters-choices"), {"purpose": "link"}
    )
    data = response.json()

    assert response.status_code == 200
    assert choice_ids(response) == {str(matter.id)}
    assert all(set(item) == {"id", "label", "secondary_label", "kind"} for item in data["results"])


def test_matter_choices_search_title_reference_and_kind() -> None:
    organization = OrganizationFactory()
    admin = MembershipFactory(organization=organization, role=ROLE_LEGAL_ADMIN)
    case = MatterFactory(
        organization=organization,
        owner=admin,
        kind=KIND_CASE,
        title="اختلاف قراردادی شمال",
        reference_code="CASE-CHOICE-001",
    )
    contract = MatterFactory(
        organization=organization,
        owner=admin,
        kind=KIND_CONTRACT,
        title="قرارداد خدمات جنوب",
        reference_code="CON-CHOICE-001",
    )

    title_response = authenticated_client(member=admin).get(
        reverse("matters-choices"), {"purpose": "link", "q": " شمال "}
    )
    reference_response = authenticated_client(member=admin).get(
        reverse("matters-choices"), {"purpose": "link", "q": "CON-CHOICE"}
    )
    kind_response = authenticated_client(member=admin).get(
        reverse("matters-choices"), {"purpose": "link", "kind": KIND_CASE}
    )

    assert choice_ids(title_response) == {str(case.id)}
    assert choice_ids(reference_response) == {str(contract.id)}
    assert str(contract.id) not in choice_ids(kind_response)


def test_matter_choice_purposes_apply_visibility_and_edit_rules() -> None:
    organization = OrganizationFactory()
    owner = MembershipFactory(organization=organization, role=ROLE_LEGAL_ADMIN)
    counsel = MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL)
    viewer = MembershipFactory(organization=organization, role=ROLE_VIEWER)
    visible = MatterFactory(organization=organization, owner=owner)
    editable = MatterFactory(organization=organization, owner=owner)
    hidden = MatterFactory(organization=organization, owner=owner)
    MatterAccessFactory(matter=visible, membership=viewer, level=ACCESS_LEVEL_VIEW)
    MatterAccessFactory(matter=editable, membership=viewer, level=ACCESS_LEVEL_EDIT)
    MatterAccessFactory(matter=visible, membership=counsel, level=ACCESS_LEVEL_VIEW)
    MatterAccessFactory(matter=editable, membership=counsel, level=ACCESS_LEVEL_EDIT)

    viewer_client = authenticated_client(member=viewer)
    counsel_client = authenticated_client(member=counsel)
    link_response = viewer_client.get(reverse("matters-choices"), {"purpose": "link"})
    viewer_upload_response = viewer_client.get(
        reverse("matters-choices"), {"purpose": "document_upload"}
    )
    upload_response = counsel_client.get(reverse("matters-choices"), {"purpose": "document_upload"})
    deadline_response = counsel_client.get(
        reverse("matters-choices"), {"purpose": "deadline_create"}
    )
    task_response = counsel_client.get(reverse("matters-choices"), {"purpose": "task_create"})

    assert choice_ids(link_response) == {str(visible.id), str(editable.id)}
    assert choice_ids(viewer_upload_response) == set()
    assert choice_ids(upload_response) == {str(editable.id)}
    assert choice_ids(deadline_response) == {str(editable.id)}
    assert choice_ids(task_response) == {str(editable.id)}
    assert str(hidden.id) not in choice_ids(link_response)


def test_matter_notice_relation_and_exclusion_are_permission_scoped() -> None:
    organization = OrganizationFactory()
    owner = MembershipFactory(organization=organization, role=ROLE_LEGAL_COUNSEL)
    related = MatterFactory(organization=organization, owner=owner)
    excluded = MatterFactory(organization=organization, owner=owner)
    other_org = MatterFactory()

    response = authenticated_client(member=owner).get(
        reverse("matters-choices"),
        {"purpose": "notice_relation", "exclude_matter_id": str(excluded.id)},
    )

    assert str(related.id) in choice_ids(response)
    assert str(excluded.id) not in choice_ids(response)
    assert str(other_org.id) not in choice_ids(response)


def test_matter_choices_cursor_pagination_and_max_page_size() -> None:
    organization = OrganizationFactory()
    admin = MembershipFactory(organization=organization, role=ROLE_LEGAL_ADMIN)
    for _ in range(55):
        MatterFactory(organization=organization, owner=admin)

    client = authenticated_client(member=admin)
    first_response = client.get(reverse("matters-choices"), {"purpose": "link", "page_size": 2})
    second_response = client.get(
        reverse("matters-choices"),
        {"purpose": "link", "page_size": 2, "cursor": first_response.json()["next_cursor"]},
    )
    capped_response = client.get(reverse("matters-choices"), {"purpose": "link", "page_size": 99})

    assert first_response.status_code == 200
    assert first_response.json()["has_more"] is True
    assert len(first_response.json()["results"]) == 2
    assert choice_ids(first_response).isdisjoint(choice_ids(second_response))
    assert len(capped_response.json()["results"]) == 50


def test_matter_choices_rate_limit_returns_retry_after(monkeypatch) -> None:
    cache.clear()
    monkeypatch.setattr(MatterChoicesThrottle, "rate", "1/hour")
    admin = MembershipFactory(role=ROLE_LEGAL_ADMIN)
    MatterFactory(organization=admin.organization, owner=admin)
    client = authenticated_client(member=admin)

    first_response = client.get(reverse("matters-choices"), {"purpose": "link"})
    second_response = client.get(reverse("matters-choices"), {"purpose": "link"})

    assert first_response.status_code == 200
    assert second_response.status_code == 429
    assert second_response.json()["code"] == "rate_limit_exceeded"
    assert int(second_response["Retry-After"]) > 0


def test_matter_choice_validation_errors_are_localized() -> None:
    member = MembershipFactory(role=ROLE_LEGAL_ADMIN)
    client = authenticated_client(member=member)

    english_response = client.get(
        reverse("matters-choices"), {"purpose": "invalid"}, HTTP_ACCEPT_LANGUAGE="en"
    )
    persian_response = client.get(
        reverse("matters-choices"),
        {"purpose": "link", "organization_id": str(member.organization_id)},
        HTTP_ACCEPT_LANGUAGE="fa",
    )

    assert english_response.status_code == 400
    assert english_response.json()["code"] == "invalid_input"
    assert english_response.json()["message"] == "Invalid request."
    assert persian_response.status_code == 400
    assert persian_response.json()["message"] == "درخواست نامعتبر است."


def test_matter_choice_openapi_operation_is_registered() -> None:
    from drf_spectacular.generators import SchemaGenerator

    schema = SchemaGenerator().get_schema(request=None, public=True)

    assert schema["paths"]["/api/v1/matters/choices/"]["get"]["operationId"] == "matters_choices"


def test_matter_choices_avoid_n_plus_one_queries(django_assert_num_queries) -> None:
    organization = OrganizationFactory()
    admin = MembershipFactory(organization=organization, role=ROLE_LEGAL_ADMIN)
    for _ in range(5):
        MatterFactory(organization=organization, owner=admin)

    with django_assert_num_queries(3):
        response = authenticated_client(member=admin).get(
            reverse("matters-choices"), {"purpose": "link"}
        )

    assert response.status_code == 200


def authenticated_client(*, member) -> APIClient:
    client = APIClient()
    client.force_authenticate(user=member.user)
    return client


def choice_ids(response) -> set[str]:
    return {item["id"] for item in response.json()["results"]}
