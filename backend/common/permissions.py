"""Small shared permission base for domain permission classes."""

from __future__ import annotations

from django.utils.translation import gettext_lazy as _
from rest_framework.exceptions import NotFound
from rest_framework.permissions import BasePermission


class CommonPermission(BasePermission):
    message = _("You do not have permission to perform this action.")

    def authenticated_user(self, request):
        user = getattr(request, "user", None)
        if user and user.is_authenticated:
            return user
        return None

    def deny_not_visible(self) -> None:
        raise NotFound(_("Not found."))
