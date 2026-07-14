"""Celery task wrappers for deadline background work."""

from __future__ import annotations

from apps.deadlines.services import scan_deadline_reminders
from config.celery import app


@app.task(name="deadlines.scan_reminders")
def scan_deadline_reminders_task() -> int:
    return scan_deadline_reminders()
