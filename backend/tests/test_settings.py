from __future__ import annotations

import importlib
import sys

import pytest
from django.core.exceptions import ImproperlyConfigured

PRODUCTION_MODULE = "config.settings.production"
VALID_PRODUCTION_ENV = {
    "DJANGO_SECRET_KEY": "production-secret-key-with-enough-entropy-1234567890abcdef",
    "DJANGO_ALLOWED_HOSTS": "legal.example.com",
    "DJANGO_CORS_ALLOWED_ORIGINS": "https://legal.example.com",
    "DJANGO_CSRF_TRUSTED_ORIGINS": "https://legal.example.com",
    "DATABASE_URL": "postgresql://legal:secret-db-password@postgres:5432/legal",
    "REDIS_URL": "redis://redis:6379/0",
    "CHANNEL_LAYER_REDIS_URL": "redis://redis:6379/1",
    "CELERY_BROKER_URL": "amqp://legal:secret-broker-password@rabbitmq:5672//",
    "CELERY_RESULT_BACKEND": "redis://redis:6379/2",
    "MINIO_ENDPOINT": "minio:9000",
    "MINIO_ACCESS_KEY": "secret-access-key",
    "MINIO_SECRET_KEY": "secret-minio-key",
    "MINIO_BUCKET_DOCUMENTS": "legal-documents",
}


def import_fresh(module_name: str):
    sys.modules.pop(module_name, None)
    return importlib.import_module(module_name)


def set_valid_production_env(monkeypatch: pytest.MonkeyPatch) -> None:
    for name, setting_value in VALID_PRODUCTION_ENV.items():
        monkeypatch.setenv(name, setting_value)


def clear_production_env(monkeypatch: pytest.MonkeyPatch) -> None:
    for name in VALID_PRODUCTION_ENV:
        monkeypatch.delenv(name, raising=False)


def test_production_settings_require_explicit_environment(monkeypatch: pytest.MonkeyPatch) -> None:
    clear_production_env(monkeypatch)

    with pytest.raises(ImproperlyConfigured, match="DJANGO_SECRET_KEY"):
        import_fresh(PRODUCTION_MODULE)


def test_production_rejects_wildcard_hosts_without_leaking_secret(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    set_valid_production_env(monkeypatch)
    secret_value = VALID_PRODUCTION_ENV["DJANGO_SECRET_KEY"]
    monkeypatch.setenv("DJANGO_ALLOWED_HOSTS", "legal.example.com,*")

    with pytest.raises(ImproperlyConfigured) as exc_info:
        import_fresh(PRODUCTION_MODULE)

    assert "wildcard" in str(exc_info.value)
    assert secret_value not in str(exc_info.value)


def test_production_security_settings_are_not_optional_booleans(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    set_valid_production_env(monkeypatch)
    monkeypatch.setenv("DJANGO_DEBUG", "true")
    monkeypatch.setenv("DJANGO_SESSION_COOKIE_SECURE", "false")

    production = import_fresh(PRODUCTION_MODULE)

    assert production.DEBUG is False
    assert production.SECURE_SSL_REDIRECT is True
    assert production.SESSION_COOKIE_SECURE is True
    assert production.CSRF_COOKIE_SECURE is True
    assert production.SECURE_HSTS_SECONDS == 31_536_000
    assert production.SECURE_HSTS_INCLUDE_SUBDOMAINS is True
    assert production.SECURE_HSTS_PRELOAD is True
    assert production.X_FRAME_OPTIONS == "DENY"


def test_development_settings_are_local_and_relaxed() -> None:
    development = import_fresh("config.settings.development")

    assert development.DEBUG is True
    assert "localhost" in development.ALLOWED_HOSTS
    assert development.SECURE_SSL_REDIRECT is False
    assert development.SESSION_COOKIE_SECURE is False
    assert development.EMAIL_BACKEND == "django.core.mail.backends.console.EmailBackend"
