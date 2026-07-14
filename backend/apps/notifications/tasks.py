"""Celery task wrappers for notification delivery."""

from __future__ import annotations

from apps.notifications.services import send_delivery_by_id
from config.celery import app


@app.task(name="notifications.send_delivery")
def send_delivery_task(delivery_id: str) -> str:
    return send_delivery_by_id(delivery_id=delivery_id)
