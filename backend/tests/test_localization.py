from __future__ import annotations

from django.test import Client
from django.utils import translation

from apps.deadlines.models import DEADLINE_STATUS_CHOICES, STATUS_OPEN
from apps.organizations.models import MEMBERSHIP_ROLE_CHOICES, ROLE_LEGAL_ADMIN


def test_accept_language_localizes_error_message() -> None:
    response = Client(HTTP_ACCEPT_LANGUAGE="fa").get("/api/v1/auth/me/")

    assert response.status_code == 401
    assert response.json()["code"] == "authentication_required"
    assert response.json()["message"] == "اعتبارنامه احراز هویت ارائه نشده است."


def test_persian_labels_do_not_translate_canonical_values() -> None:
    with translation.override("fa"):
        deadline_labels = dict(DEADLINE_STATUS_CHOICES)
        role_labels = dict(MEMBERSHIP_ROLE_CHOICES)

        assert deadline_labels[STATUS_OPEN] == "باز"
        assert role_labels[ROLE_LEGAL_ADMIN] == "مدیر حقوقی"

    assert STATUS_OPEN == "open"
    assert ROLE_LEGAL_ADMIN == "legal_admin"
