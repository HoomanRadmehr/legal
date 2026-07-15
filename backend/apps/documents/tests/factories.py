"""Test factories for document models."""

from __future__ import annotations

import uuid
from datetime import timedelta

import factory
from django.utils import timezone

from apps.documents.models import DOCUMENT_STATUS_AVAILABLE, Document
from apps.matters.tests.factories import MatterFactory


class DocumentFactory(factory.django.DjangoModelFactory):
    id = factory.LazyFunction(uuid.uuid4)
    organization = factory.SelfAttribute("matter.organization")
    matter = factory.SubFactory(MatterFactory)
    object_key = factory.LazyAttribute(
        lambda document: (
            f"organizations/{document.organization.id}/matters/"
            f"{document.matter.id}/documents/{document.id}"
        )
    )
    original_filename = "notice.pdf"
    content_type = "application/pdf"
    expected_size = 1024
    actual_size = 1024
    expected_checksum = ""
    actual_checksum = ""
    etag = ""
    status = DOCUMENT_STATUS_AVAILABLE
    description = ""
    uploaded_by = factory.SelfAttribute("matter.owner")
    upload_expires_at = factory.LazyFunction(lambda: timezone.now() + timedelta(minutes=15))
    uploaded_at = factory.LazyFunction(timezone.now)
    failure_code = ""

    class Meta:
        model = Document
