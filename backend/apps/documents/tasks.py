"""Celery tasks for direct document upload cleanup."""

from __future__ import annotations

from apps.documents.services import expire_pending_document_uploads
from config.celery import app


@app.task(name="documents.expire_pending_document_uploads")
def expire_pending_document_uploads_task() -> int:
    return expire_pending_document_uploads()
