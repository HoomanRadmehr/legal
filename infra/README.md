# Infrastructure implementation target

The production shape is a reverse proxy in front of separate frontend and Django ASGI containers, plus Celery worker, Celery Beat, PostgreSQL, Redis, RabbitMQ, and MinIO.

Use one backend image for API, worker, Beat, and one-off migrations; only the command changes.
Use one frontend build image and a minimal static runtime image.
Only the reverse proxy exposes public ports in production.

Implementation is driven by `tasks/backend/BE-P0-foundation.md` and `tasks/backend/BE-P6-hardening-delivery.md`.

## Production Compose overlay

`compose.production.yaml` is an infrastructure shape, not a cloud-specific manifest.
It keeps PostgreSQL, Redis, RabbitMQ, MinIO, the API, and the frontend static
container on private Docker networks. The reverse proxy is the only service with a
published port.

Run migrations explicitly before starting or rolling API replicas:

```bash
docker compose -f compose.yaml -f compose.production.yaml --profile migrations run --rm migration
```

The API, worker, Beat, and migration services reuse `legal-backend:prod`. They run
as the non-root `app` user from the image. Beat is a single service; do not scale it
past one replica.

## TLS and HSTS assumptions

The reverse proxy listens on plain HTTP inside the deployment boundary. Production
assumes TLS is terminated by an upstream load balancer or ingress that forwards only
trusted traffic to the proxy and sets `X-Forwarded-Proto: https`. The proxy also
sets that forwarded proto to `https` by default for local assignment verification.

`config.settings.production` enables secure cookies, HTTPS redirect, frame denial,
content-type sniffing protection, and HSTS with preload. Enable the public HSTS
preload submission only after every production hostname, including the MinIO public
hostname, is permanently HTTPS-ready.

Use a dedicated MinIO public host such as `files.example.com` routed through the
same reverse proxy. Do not expose the MinIO console. Presigned URL access logs use a
redacted proxy log format based on `$uri`, not `$request_uri`, so WebSocket tickets
and S3 query signatures are not written to proxy logs.
