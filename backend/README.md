# Legal Management Backend

This backend is a Django, Django REST Framework, Channels, and Celery modular monolith for the Legal Management Module. PostgreSQL is the source of truth, MinIO stores private document bytes, Redis supports throttling/cache/WebSocket tickets/Channels, and RabbitMQ carries Celery work.

Read [../AGENTS.md](../AGENTS.md) and [AGENTS.md](AGENTS.md) before changing backend code.

## Prerequisites

- Docker and Docker Compose v2.
- Python 3.12 if running commands on the host.
- `uv` for locked Python dependency installation.
- Node is only needed for frontend work; the backend can run through Compose without host Node.

This checkout has a `.python-version` value of `3.12`. If pyenv does not have that exact version installed, host commands using plain `python` fail before Django starts. Use an installed Python 3.12 directly, for example:

```bash
cd backend
UV_PROJECT_ENVIRONMENT=/tmp/legal-backend-venv uv run --python /usr/bin/python3.12 python manage.py check
```

## Environment

Create a local env file from the committed example:

```bash
cp .env.example .env
```

Do not commit `.env` or real secrets. The example lists required keys without production secret values. Important groups are:

| Group | Keys |
|---|---|
| Django | `DJANGO_SETTINGS_MODULE`, `DJANGO_SECRET_KEY`, `DJANGO_ALLOWED_HOSTS`, `DJANGO_CORS_ALLOWED_ORIGINS`, `DJANGO_CSRF_TRUSTED_ORIGINS`, `DJANGO_LANGUAGE_CODE`, `DJANGO_TIME_ZONE` |
| PostgreSQL | `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `DATABASE_URL` |
| Redis | `REDIS_URL`, `CHANNEL_LAYER_REDIS_URL` |
| RabbitMQ and Celery | `RABBITMQ_DEFAULT_USER`, `RABBITMQ_DEFAULT_PASS`, `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND` |
| MinIO | `MINIO_INTERNAL_ENDPOINT`, `MINIO_ENDPOINT` compatibility alias, `MINIO_PUBLIC_ENDPOINT`, `MINIO_REGION`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET_DOCUMENTS`, `MINIO_USE_SSL`, upload/download TTLs, `MAX_UPLOAD_SIZE_BYTES` |
| JWT and cookies | `JWT_ACCESS_MINUTES`, `JWT_REFRESH_DAYS`, `JWT_REFRESH_COOKIE_NAME`, `JWT_COOKIE_DOMAIN` |
| Email/providers | `EMAIL_HOST`, `EMAIL_PORT`, `DEFAULT_FROM_EMAIL`, optional SMS/push provider keys |

Production must replace every secret and public origin/host with deployment-safe values. Production settings hardcode secure behavior such as `DEBUG=False`, secure cookies, HTTPS redirect, HSTS, content-type sniffing protection, and frame denial.

## Development Stack

Start the local stack:

```bash
docker compose up -d --build
```

Run migrations explicitly:

```bash
docker compose --profile tools run --rm migration
```

Seed synthetic demo data:

```bash
docker compose run --rm api python manage.py seed_demo
```

Useful local URLs:

| Service | URL |
|---|---|
| API | `http://localhost:8000/api/v1/` |
| Health live | `http://localhost:8000/health/live/` |
| Health ready | `http://localhost:8000/health/ready/` |
| Frontend dev server | `http://localhost:5173/` |
| MinIO API | `http://localhost:9000/` |
| MinIO console | `http://localhost:9001/` |
| Mailpit | `http://localhost:8025/` |
| RabbitMQ management | `http://localhost:15672/` |

Stop the stack:

```bash
docker compose down
```

Remove local volumes only when you want to delete PostgreSQL, Redis, RabbitMQ, and MinIO state:

```bash
docker compose down -v
```

## Production Compose Overlay

Render production configuration:

```bash
docker compose -f compose.yaml -f compose.production.yaml config
```

Build production images:

```bash
docker build -f docker/backend/Dockerfile -t legal-backend:prod .
docker build -f docker/frontend/Dockerfile -t legal-frontend:prod .
docker build -f docker/nginx/Dockerfile -t legal-reverse-proxy:prod .
docker build -f docker/minio-init/Dockerfile -t legal-minio-init:prod .
```

Run the one-off migration profile:

```bash
docker compose -f compose.yaml -f compose.production.yaml --profile migrations run --rm migration
```

Start production services:

```bash
docker compose -f compose.yaml -f compose.production.yaml up -d
```

Production overlay notes:

- API, worker, Beat, and migration reuse the same non-root backend image.
- The API command uses Daphne for ASGI and Channels.
- The frontend is a static Nginx image; the Vite dev server is hidden behind a `development` profile.
- The reverse proxy handles HTTP routing, WebSocket upgrade, request size limits, coarse rate limits, and query-redacted logs.
- Production networks are internal except for the reverse proxy public network.
- Migrations are explicit and are not run by every API process.
- Run exactly one Beat instance.

## Backend Commands

Host commands assume an installed Python 3.12 and the locked uv environment:

```bash
cd backend
UV_PROJECT_ENVIRONMENT=/tmp/legal-backend-venv uv sync --locked --all-groups --python /usr/bin/python3.12
```

Common commands:

```bash
# Django checks
uv run python manage.py check
DJANGO_SETTINGS_MODULE=config.settings.production uv run python manage.py check --deploy

# Migrations
uv run python manage.py makemigrations --check --dry-run
uv run python manage.py migrate

# Seed
uv run python manage.py seed_demo

# Tests
uv run python -m pytest -q
uv run python -m pytest tests/security -q

# Lint and format
uv run ruff check .
uv run ruff format --check .

# OpenAPI
uv run python manage.py spectacular --file ../build/openapi.yaml --validate

# Documentation and simplicity from repo root
python3 scripts/validate_docs.py
python3 scripts/check_simplicity.py backend
```

Celery commands when not using Compose:

```bash
cd backend
uv run celery -A config.celery:app worker --loglevel=INFO --concurrency=2
uv run celery -A config.celery:app beat --loglevel=INFO --schedule=/tmp/celerybeat-schedule
```

## Development-Only Demo Users

`seed_demo` is idempotent and creates only fake `.example.test` users, synthetic legal records, private document metadata, notification preferences, and cross-organization isolation fixtures. These credentials are development-only and must not be used in production.

```text
Password for every seeded user: demo-password-123

Primary organization:
- demo-primary-admin
- demo-primary-manager
- demo-primary-counsel
- demo-primary-viewer

Isolation organization:
- demo-isolation-admin
- demo-isolation-manager
- demo-isolation-counsel
- demo-isolation-viewer
```

The seed data includes visible and hidden matters, cases, contracts, notices, deadlines for today/upcoming/overdue views, tasks, document metadata, notification preferences, notification rows, activity, and outbox records.

## Architecture Summary

The backend uses explicit domain apps:

```text
accounts
organizations
matters
cases
contracts
notices
deadlines
tasks
documents
activity
notifications
dashboard
offboarding
```

`common` contains transport and infrastructure primitives only. It is not a domain layer.

Read flow:

```text
ViewSet -> selector function -> permission-scoped QuerySet -> serializer
```

Write flow:

```text
ViewSet -> ModelSerializer validation -> service function -> database transaction
        -> activity log + outbox event -> output serializer
```

Key decisions:

- `Matter` is the shared permission and linkage boundary.
- `LegalCase`, `Contract`, and `LegalNotice` use explicit one-to-one composition with `Matter`.
- Deadlines, tasks, documents, activity logs, and access grants point to `Matter`.
- Services and selectors are plain module-level functions.
- Domain writes do not use Django signals.
- Authorization is enforced on backend selectors/services; frontend checks are only user experience hints.

## Security Decisions

- JWT access tokens are returned in JSON and held in frontend memory.
- Refresh tokens are rotated and stored in an HttpOnly cookie.
- Login, refresh, and logout require CSRF.
- Organization-owned queries are organization-scoped.
- Matter retrieval applies visibility before object lookup; hidden confidential records normally appear as not found.
- Refresh tokens are not stored in browser local storage.
- MinIO buckets are private. Upload and download URLs are short-lived and issued only after permission checks.
- Django uses `MINIO_INTERNAL_ENDPOINT` for object checks/deletes and signs URLs for `MINIO_PUBLIC_ENDPOINT`; do not rewrite presigned hosts after signing.
- Upload completion verifies the object at the expected key with expected metadata before creating available document metadata.
- WebSocket access uses short-lived one-time tickets over `/ws/v1/events/?ticket=...`; clients cannot subscribe to arbitrary groups.
- Activity logs and outbox rows are written with critical business changes.
- Logs must not include passwords, JWTs, refresh cookies, presigned URLs, MinIO credentials, document contents, or full sensitive request bodies.
- Rate limits exist at DRF and reverse-proxy layers.

## Troubleshooting

### `pyenv: version '3.12' is not installed`

Install that pyenv version or run through an installed interpreter:

```bash
cd backend
UV_PROJECT_ENVIRONMENT=/tmp/legal-backend-venv uv run --python /usr/bin/python3.12 python manage.py check
```

### PostgreSQL password authentication fails from host commands

Compose services use the password in `.env` or the Compose development default. Host commands must use a matching `DATABASE_URL`, for example:

```bash
DATABASE_URL=postgresql://legal_management:legal_management_dev_password@127.0.0.1:5432/legal_management \
UV_PROJECT_ENVIRONMENT=/tmp/legal-backend-venv \
uv run --python /usr/bin/python3.12 python manage.py check
```

### Missing tables in the local database

Run migrations against the same database URL used by the app:

```bash
docker compose --profile tools run --rm migration
```

### CORS or CSRF errors in the browser

Check that `DJANGO_CORS_ALLOWED_ORIGINS`, `DJANGO_CSRF_TRUSTED_ORIGINS`, `VITE_API_BASE_URL`, and `VITE_WS_BASE_URL` match the actual browser origin.

### MinIO upload errors

Confirm `minio` and `minio-init` are healthy, the bucket is private, `MINIO_INTERNAL_ENDPOINT` is reachable from the API container, `MINIO_PUBLIC_ENDPOINT` is reachable by the current client, and MinIO CORS allows the frontend origin. Do not make the bucket public.

## Known Limitations

- No malware or antivirus scanner is integrated.
- No legal hold workflow is implemented.
- No OCR, semantic search, or vector search is implemented.
- No production SMS or push provider is configured; unconfigured channels are skipped with safe status codes.
- No enterprise SSO or multi-organization switcher is implemented.
- The production Compose overlay is an assignment deployment artifact, not a complete cloud hardening package.
- `python3 scripts/validate_docs.py` currently fails on pre-existing decimal task heading IDs outside backend runtime behavior unless those task filenames/headings are normalized.
