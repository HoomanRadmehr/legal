"""Celery application placeholder for later background-job tasks."""

from __future__ import annotations

import os

from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")

app = Celery("legal_backend")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()

app.conf.beat_schedule = {
    "deadline-reminder-scan": {
        "task": "deadlines.scan_reminders",
        "schedule": 300.0,
    },
}
