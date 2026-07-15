"""Production settings."""

from __future__ import annotations

from config import env

from .base import *  # noqa: F403

DEBUG = False
SECRET_KEY = env.required_secret_key("DJANGO_SECRET_KEY")

ALLOWED_HOSTS = env.required_csv("DJANGO_ALLOWED_HOSTS")
env.reject_wildcard_hosts("DJANGO_ALLOWED_HOSTS", ALLOWED_HOSTS)

CORS_ALLOWED_ORIGINS = env.required_csv("DJANGO_CORS_ALLOWED_ORIGINS")
env.require_https_origins("DJANGO_CORS_ALLOWED_ORIGINS", CORS_ALLOWED_ORIGINS)

CSRF_TRUSTED_ORIGINS = env.required_csv("DJANGO_CSRF_TRUSTED_ORIGINS")
env.require_https_origins("DJANGO_CSRF_TRUSTED_ORIGINS", CSRF_TRUSTED_ORIGINS)

DATABASE_URL = env.required_value("DATABASE_URL")
DATABASES = {"default": env.postgres_database_from_url("DATABASE_URL", DATABASE_URL)}

REDIS_URL = env.required_value("REDIS_URL")
CACHES = {"default": env.redis_cache(REDIS_URL)}

CHANNEL_LAYER_REDIS_URL = env.required_value("CHANNEL_LAYER_REDIS_URL")
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {"hosts": [CHANNEL_LAYER_REDIS_URL]},
    },
}

CELERY_BROKER_URL = env.required_value("CELERY_BROKER_URL")
CELERY_RESULT_BACKEND = env.required_value("CELERY_RESULT_BACKEND")

MINIO_ENDPOINT = env.required_value("MINIO_ENDPOINT")
MINIO_PUBLIC_ENDPOINT = env.required_value("MINIO_PUBLIC_ENDPOINT")
env.require_https_origins("MINIO_PUBLIC_ENDPOINT", [MINIO_PUBLIC_ENDPOINT])
MINIO_ACCESS_KEY = env.required_value("MINIO_ACCESS_KEY")
MINIO_SECRET_KEY = env.required_value("MINIO_SECRET_KEY")
MINIO_BUCKET_DOCUMENTS = env.required_value("MINIO_BUCKET_DOCUMENTS")

SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
JWT_REFRESH_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_SAMESITE = "Lax"
SECURE_HSTS_SECONDS = 31_536_000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "same-origin"
X_FRAME_OPTIONS = "DENY"
