"""Development settings."""

from __future__ import annotations

from config import env

from .base import *  # noqa: F403

DEBUG = True
ALLOWED_HOSTS = env.csv("DJANGO_ALLOWED_HOSTS", default=("localhost", "127.0.0.1"))
LOCAL_FRONTEND_ORIGINS = ("http://localhost:5173", "http://127.0.0.1:5173")
CORS_ALLOWED_ORIGINS = env.csv("DJANGO_CORS_ALLOWED_ORIGINS", default=LOCAL_FRONTEND_ORIGINS)
CSRF_TRUSTED_ORIGINS = env.csv(
    "DJANGO_CSRF_TRUSTED_ORIGINS",
    default=LOCAL_FRONTEND_ORIGINS,
)

SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
SECURE_HSTS_SECONDS = 0

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
