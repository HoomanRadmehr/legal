"""Small environment parsing helpers for Django settings."""

from __future__ import annotations

import os
from collections.abc import Iterable
from urllib.parse import unquote, urlparse

from django.core.exceptions import ImproperlyConfigured

TRUE_VALUES = {"1", "true", "yes", "on"}
FALSE_VALUES = {"0", "false", "no", "off"}


def value(name: str, *, default: str = "") -> str:
    raw_value = os.environ.get(name)
    if raw_value is None:
        return default
    return raw_value.strip()


def required_value(name: str) -> str:
    raw_value = value(name)
    if raw_value:
        return raw_value
    raise ImproperlyConfigured(f"Missing required environment variable: {name}")


def csv(name: str, *, default: Iterable[str] = ()) -> list[str]:
    raw_value = os.environ.get(name)
    if raw_value is None:
        return list(default)
    return [part.strip() for part in raw_value.split(",") if part.strip()]


def required_csv(name: str) -> list[str]:
    values = csv(name)
    if values:
        return values
    raise ImproperlyConfigured(f"Missing required environment variable: {name}")


def boolean(name: str, *, default: bool) -> bool:
    raw_value = value(name)
    if not raw_value:
        return default
    normalized = raw_value.lower()
    if normalized in TRUE_VALUES:
        return True
    if normalized in FALSE_VALUES:
        return False
    raise ImproperlyConfigured(f"{name} must be a boolean value")


def integer(name: str, *, default: int, minimum: int = 0) -> int:
    raw_value = value(name)
    if not raw_value:
        return default
    try:
        parsed_value = int(raw_value)
    except ValueError as exc:
        raise ImproperlyConfigured(f"{name} must be an integer") from exc
    if parsed_value < minimum:
        raise ImproperlyConfigured(f"{name} must be at least {minimum}")
    return parsed_value


def required_secret_key(name: str) -> str:
    secret_key = required_value(name)
    if len(secret_key) < 50 or secret_key.startswith("django-insecure-"):
        raise ImproperlyConfigured(f"{name} is not safe for production")
    return secret_key


def reject_wildcard_hosts(name: str, hosts: Iterable[str]) -> None:
    if any(host == "*" for host in hosts):
        raise ImproperlyConfigured(f"{name} cannot contain wildcard hosts")


def require_https_origins(name: str, origins: Iterable[str]) -> None:
    unsafe_origins = [origin for origin in origins if not origin.startswith("https://")]
    if unsafe_origins:
        raise ImproperlyConfigured(f"{name} must contain only https origins")


def postgres_database_from_url(name: str, database_url: str) -> dict[str, str]:
    parsed_url = urlparse(database_url)
    if parsed_url.scheme not in {"postgres", "postgresql"}:
        raise ImproperlyConfigured(f"{name} must use the postgresql scheme")
    if not parsed_url.hostname or not parsed_url.path.strip("/"):
        raise ImproperlyConfigured(f"{name} must include host and database name")

    return {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": unquote(parsed_url.path.lstrip("/")),
        "USER": unquote(parsed_url.username or ""),
        "PASSWORD": unquote(parsed_url.password or ""),
        "HOST": parsed_url.hostname,
        "PORT": str(_url_port(name, parsed_url, 5432)),
    }


def redis_cache(redis_url: str) -> dict[str, str]:
    return {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": redis_url,
    }


def _url_port(name: str, parsed_url, default: int) -> int:
    try:
        return parsed_url.port or default
    except ValueError as exc:
        raise ImproperlyConfigured(f"{name} has an invalid port") from exc
