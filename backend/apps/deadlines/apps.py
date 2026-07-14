"""Deadline app configuration."""

from __future__ import annotations

from django.apps import AppConfig


class DeadlinesConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.deadlines"
    label = "deadlines"
