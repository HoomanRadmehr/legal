# Architecture

## Style

Use a modular monolith: one Django deployment and one React application, organized by business domain.
This choice preserves strong database transactions and clear permission checks while fitting the assignment timebox.

```text
Browser
  | HTTPS REST / WebSocket
Reverse proxy
  |-- React static application
  |-- Django ASGI
        |-- PostgreSQL
        |-- MinIO
        |-- Redis
        |-- RabbitMQ -> Celery workers / Celery Beat
```

## System responsibilities

### React

- Presentation, form state, client-side validation, localization, Jalali conversion, local upload progress, and user-facing realtime updates.
- It does not make final authorization decisions.

### Django REST Framework

- Authentication and authorization.
- Domain validation and transactions.
- Presigned URL issuance.
- Query filtering and pagination.
- OpenAPI contract.
- Audit and outbox creation.

### PostgreSQL

- Authoritative business and delivery state.
- Enforces uniqueness, foreign keys, and check constraints.

### MinIO

- Private document object bytes.
- No public bucket.
- No authorization logic beyond short-lived signed requests issued by Django.

### Redis

- DRF throttle cache.
- Channels layer.
- One-time WebSocket tickets.
- Short-lived cache and locks where explicitly required.
- Optional Celery result backend; business state is not stored only here.

### RabbitMQ and Celery

- Notification delivery.
- Upload verification and processing.
- Outbox dispatch.
- Deadline reminder scans.
- Cleanup of expired sessions.

## Domain modules

Backend apps:

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

`common` contains transport and infrastructure primitives only. It must not become a second domain layer.

## Interaction rules

- Domain apps may import `common`.
- Domain apps may import stable model identifiers from another domain when a documented foreign key requires it.
- Cross-domain writes occur through a named service function, not by calling another model's `.save()` from a ViewSet.
- Circular imports are resolved by string model references and local imports inside narrow service boundaries, not by a registry.
- Celery tasks call services using IDs.
- WebSocket publishers send after commit or from outbox processing.

## Future extraction boundary

Notifications, document processing, and realtime delivery could later become services because they already communicate through persisted events and IDs.
No extraction is part of the MVP.
