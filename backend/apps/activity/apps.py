"""Activity application configuration."""

from __future__ import annotations

from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _


class ActivityConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.activity"
    label = "activity"
    verbose_name = _("Activity")
