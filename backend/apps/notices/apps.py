"""Legal notice app configuration."""

from __future__ import annotations

from django.apps import AppConfig


class NoticesConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.notices"
    label = "notices"
