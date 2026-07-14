# Docker and Compose design

## Files

Target layout:

```text
docker/backend/Dockerfile
docker/frontend/Dockerfile
docker/nginx/nginx.conf.template
compose.yaml
compose.override.yaml
compose.production.yaml
```

## Backend image

- Multi-stage build.
- Build dependencies only in builder stage.
- Locked Python dependencies.
- Minimal runtime image.
- Dedicated non-root user.
- Copy application with correct ownership.
- Exec-form command.
- ASGI server appropriate for Django Channels.
- One image reused by API, Celery worker, Celery Beat, migration, and management jobs.

## Frontend image

- Node builder with locked dependencies and reproducible install.
- Vite production build.
- Minimal static runtime served behind the reverse proxy or dedicated unprivileged web server.
- No development server in production.

## Compose services

Common/development services:

```text
api
frontend
worker
beat
postgres
redis
rabbitmq
minio
minio-init
mailpit
```

Production adds/replaces:

```text
reverse-proxy
frontend-static
migration (one-off)
```

## Operational rules

- One Beat replica.
- Migrations are explicit and not run by every API process.
- Health checks for PostgreSQL, Redis, RabbitMQ, MinIO, API readiness, and reverse proxy.
- Named volumes for state in local development.
- Private networks for infrastructure.
- Only expected public ports exposed.
- Reverse-proxy WebSocket access logging uses a redacted URI format that does not store the ticket query value.
- Do not expose PostgreSQL, Redis, RabbitMQ management, or MinIO console in production.
- Set sensible stop grace periods for worker tasks.
- Never place secrets in Dockerfile `ARG` or image layers.

## Development override

The override may use bind mounts, Django autoreload, Vite dev server, local ports, and Mailpit.
Production compose must not inherit bind mounts or debug ports.
