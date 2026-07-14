from __future__ import annotations

import pytest

pytestmark = pytest.mark.django_db


def test_liveness_response_is_safe(client) -> None:
    response = client.get("/health/live/")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_readiness_response_is_safe(client) -> None:
    response = client.get("/health/ready/")
    payload = response.json()

    assert response.status_code == 200
    assert payload["status"] == "ready"
    assert payload["checks"] == {"database": "ok", "cache": "ok"}
    assert "postgres" not in str(payload).lower()
    assert "redis://" not in str(payload).lower()
    assert "password" not in str(payload).lower()


def test_readiness_returns_503_without_topology_on_failed_dependency(client, monkeypatch) -> None:
    monkeypatch.setattr("common.health.views.database_ready", lambda: False)

    response = client.get("/health/ready/")
    payload = response.json()

    assert response.status_code == 503
    assert payload["status"] == "unavailable"
    assert payload["checks"]["database"] == "unavailable"
    assert "postgres" not in str(payload).lower()
