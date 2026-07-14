"""Shared Django settings for the backend project."""

from __future__ import annotations

from datetime import timedelta
from pathlib import Path

from django.utils.translation import gettext_lazy as _

from config import env

BASE_DIR = Path(__file__).resolve().parents[2]

SECRET_KEY = env.value("DJANGO_SECRET_KEY", default="insecure-development-key-for-local-use-only")
DEBUG = False
ALLOWED_HOSTS = env.csv("DJANGO_ALLOWED_HOSTS", default=("localhost", "127.0.0.1"))
CSRF_TRUSTED_ORIGINS = env.csv("DJANGO_CSRF_TRUSTED_ORIGINS")
CORS_ALLOWED_ORIGINS = env.csv("DJANGO_CORS_ALLOWED_ORIGINS")
CORS_ALLOW_CREDENTIALS = True

INSTALLED_APPS = [
    "apps.accounts.apps.AccountsConfig",
    "apps.organizations.apps.OrganizationsConfig",
    "apps.matters.apps.MattersConfig",
    "apps.activity.apps.ActivityConfig",
    "apps.cases.apps.CasesConfig",
    "apps.contracts.apps.ContractsConfig",
    "apps.deadlines.apps.DeadlinesConfig",
    "apps.notices.apps.NoticesConfig",
    "apps.tasks.apps.TasksConfig",
    "apps.documents.apps.DocumentsConfig",
    "apps.notifications.apps.NotificationsConfig",
    "channels",
    "corsheaders",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "rest_framework_simplejwt.token_blacklist",
    "django_filters",
    "drf_spectacular",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.locale.LocaleMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

AUTH_USER_MODEL = "accounts.User"
ROOT_URLCONF = "config.urls"
ASGI_APPLICATION = "config.asgi.application"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

DATABASE_URL = env.value(
    "DATABASE_URL",
    default="postgresql://legal_management:legal_management@localhost:5432/legal_management",
)
DATABASES = {"default": env.postgres_database_from_url("DATABASE_URL", DATABASE_URL)}

REDIS_URL = env.value("REDIS_URL", default="redis://localhost:6379/0")
CACHES = {"default": env.redis_cache(REDIS_URL)}

CHANNEL_LAYER_REDIS_URL = env.value(
    "CHANNEL_LAYER_REDIS_URL",
    default="redis://localhost:6379/1",
)
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {"hosts": [CHANNEL_LAYER_REDIS_URL]},
    },
}

CELERY_BROKER_URL = env.value(
    "CELERY_BROKER_URL",
    default="amqp://guest:guest@localhost:5672//",
)
CELERY_RESULT_BACKEND = env.value("CELERY_RESULT_BACKEND", default="redis://localhost:6379/2")
CELERY_TIMEZONE = "UTC"

LANGUAGE_CODE = env.value("DJANGO_LANGUAGE_CODE", default="en")
TIME_ZONE = env.value("DJANGO_TIME_ZONE", default="UTC")
LANGUAGES = [
    ("en", _("English")),
    ("fa", _("Persian")),
]
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
    ],
    "EXCEPTION_HANDLER": "common.api.exception_handler.exception_handler",
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
}

SPECTACULAR_SETTINGS = {
    "TITLE": "Legal Management API",
    "VERSION": "0.1.0",
}

MINIO_ENDPOINT = env.value("MINIO_ENDPOINT", default="localhost:9000")
MINIO_PUBLIC_ENDPOINT = env.value("MINIO_PUBLIC_ENDPOINT", default="http://localhost:9000")
MINIO_ACCESS_KEY = env.value("MINIO_ACCESS_KEY", default="minioadmin")
MINIO_SECRET_KEY = env.value("MINIO_SECRET_KEY", default="minioadmin")
MINIO_BUCKET_DOCUMENTS = env.value("MINIO_BUCKET_DOCUMENTS", default="legal-documents")
MINIO_USE_SSL = env.boolean("MINIO_USE_SSL", default=False)
MINIO_PRESIGNED_UPLOAD_TTL_SECONDS = env.integer(
    "MINIO_PRESIGNED_UPLOAD_TTL_SECONDS",
    default=900,
    minimum=60,
)
MINIO_PRESIGNED_DOWNLOAD_TTL_SECONDS = env.integer(
    "MINIO_PRESIGNED_DOWNLOAD_TTL_SECONDS",
    default=300,
    minimum=60,
)
MAX_UPLOAD_SIZE_BYTES = env.integer("MAX_UPLOAD_SIZE_BYTES", default=26_214_400, minimum=1)

JWT_ACCESS_MINUTES = env.integer("JWT_ACCESS_MINUTES", default=10, minimum=1)
JWT_REFRESH_DAYS = env.integer("JWT_REFRESH_DAYS", default=7, minimum=1)
JWT_REFRESH_COOKIE_NAME = env.value("JWT_REFRESH_COOKIE_NAME", default="legal_refresh")
JWT_REFRESH_COOKIE_PATH = env.value("JWT_REFRESH_COOKIE_PATH", default="/api/v1/auth/")
JWT_COOKIE_DOMAIN = env.value("JWT_COOKIE_DOMAIN")
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=JWT_ACCESS_MINUTES),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=JWT_REFRESH_DAYS),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
}

EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = env.value("EMAIL_HOST", default="localhost")
EMAIL_PORT = env.integer("EMAIL_PORT", default=1025, minimum=1)
EMAIL_HOST_USER = env.value("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = env.value("EMAIL_HOST_PASSWORD")
EMAIL_USE_TLS = env.boolean("EMAIL_USE_TLS", default=False)
DEFAULT_FROM_EMAIL = env.value("DEFAULT_FROM_EMAIL", default="legal-management@example.test")

SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = False
SESSION_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_SAMESITE = "Lax"
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"
