"""Test factories for document upload models."""

from __future__ import annotations

import uuid
from datetime import timedelta

import factory
from django.utils import timezone

from apps.documents.models import (
    DOCUMENT_STATUS_AVAILABLE,
    UPLOAD_STATUS_INITIATED,
    Document,
    UploadSession,
)
from apps.matters.tests.factories import MatterFactory


class UploadSessionFactory(factory.django.DjangoModelFactory):
    id = factory.LazyFunction(uuid.uuid4)
    organization = factory.SelfAttribute("matter.organization")
    matter = factory.SubFactory(MatterFactory)
    requested_by = factory.SelfAttribute("matter.owner")
    object_key = factory.LazyAttribute(
        lambda session: (
            f"organizations/{session.organization.id}/matters/"
            f"{session.matter.id}/uploads/{session.id}.pdf"
        )
    )
    original_filename = "notice.pdf"
    expected_size = 1024
    expected_content_type = "application/pdf"
    expected_checksum = ""
    description = ""
    status = UPLOAD_STATUS_INITIATED
    expires_at = factory.LazyFunction(lambda: timezone.now() + timedelta(minutes=15))

    class Meta:
        model = UploadSession


class DocumentFactory(factory.django.DjangoModelFactory):
    organization = factory.SelfAttribute("upload_session.organization")
    matter = factory.SelfAttribute("upload_session.matter")
    upload_session = factory.SubFactory(UploadSessionFactory)
    object_key = factory.SelfAttribute("upload_session.object_key")
    original_filename = factory.SelfAttribute("upload_session.original_filename")
    content_type = factory.SelfAttribute("upload_session.expected_content_type")
    size = factory.SelfAttribute("upload_session.expected_size")
    checksum = factory.SelfAttribute("upload_session.expected_checksum")
    status = DOCUMENT_STATUS_AVAILABLE
    description = factory.SelfAttribute("upload_session.description")
    uploaded_by = factory.SelfAttribute("upload_session.requested_by")
    available_at = factory.LazyFunction(timezone.now)

    class Meta:
        model = Document
