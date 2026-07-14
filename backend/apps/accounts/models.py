"""Accounts models."""

from __future__ import annotations

import uuid

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _

LANGUAGE_ENGLISH = "en"
LANGUAGE_PERSIAN = "fa"
PREFERRED_LANGUAGE_CHOICES = (
    (LANGUAGE_ENGLISH, _("English")),
    (LANGUAGE_PERSIAN, _("Persian")),
)


class User(AbstractUser):
    id = models.UUIDField(_("ID"), primary_key=True, default=uuid.uuid4, editable=False)
    preferred_language = models.CharField(
        _("preferred language"),
        max_length=2,
        choices=PREFERRED_LANGUAGE_CHOICES,
        default=LANGUAGE_ENGLISH,
    )
    updated_at = models.DateTimeField(_("updated at"), auto_now=True)

    class Meta:
        verbose_name = _("user")
        verbose_name_plural = _("users")
