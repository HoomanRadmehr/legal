"""Celery tasks for document upload processing."""

from __future__ import annotations

from apps.documents.services import expire_abandoned_upload_sessions, process_upload_session
from config.celery import app


@app.task(name="documents.process_upload_session")
def process_upload_session_task(upload_id: str) -> str:
    return process_upload_session(upload_id=upload_id)


@app.task(name="documents.expire_abandoned_upload_sessions")
def expire_abandoned_upload_sessions_task() -> int:
    return expire_abandoned_upload_sessions()
