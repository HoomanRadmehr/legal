"""Celery tasks for activity and outbox processing."""

from __future__ import annotations

from common.services.outbox import dispatch_next_outbox_event, dispatch_outbox_event
from config.celery import app


@app.task(name="activity.dispatch_outbox_event")
def dispatch_outbox_event_task(event_id: str) -> str:
    return dispatch_outbox_event(event_id=event_id)


@app.task(name="activity.dispatch_next_outbox_event")
def dispatch_next_outbox_event_task() -> str:
    return dispatch_next_outbox_event()
