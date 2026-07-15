# Backend Evidence Summary

This summary points reviewers to the durable evidence for backend setup, security decisions, limitations, and AI usage.

## Setup Evidence

- Backend startup, environment keys, migrations, seed data, test, lint, OpenAPI, Celery, development Compose, and production Compose commands are documented in [../../backend/README.md](../../backend/README.md).
- The production backend image is documented as a non-root ASGI runtime reused by API, worker, Beat, and migration services.
- Seed data is documented as development-only, synthetic, and idempotent.

## Architecture Evidence

- The backend is a modular monolith.
- Domain writes follow explicit service functions and database transactions.
- Domain reads begin from organization- and permission-scoped selectors.
- `Matter` is the shared permission and linkage boundary for cases, contracts, notices, deadlines, tasks, documents, activity, and access grants.
- Activity logs and outbox rows are the durable audit/event handoff for critical writes.

## Security Evidence

- JWT access tokens are kept in memory; refresh tokens are rotated in HttpOnly cookies.
- Login, refresh, and logout require CSRF.
- MinIO buckets remain private; the backend issues short-lived upload/download URLs only after permission checks.
- WebSocket access uses one-time Redis tickets and server-selected user groups.
- Sensitive values such as passwords, JWTs, refresh cookies, presigned URLs, MinIO credentials, and document contents must not be logged.

## AI Evidence

- [../../AI_USAGE.md](../../AI_USAGE.md) records tools used, task workflow, prompts, mistakes/corrections, personal decisions, and command results.
- Known command deviations are recorded there instead of being hidden. Examples include the local pyenv `3.12` issue, Compose image/runtime limitations, and documentation validator failures caused by decimal task IDs.

## Known Limitations

- No malware scanner.
- No legal hold workflow.
- No OCR, semantic search, or vector search.
- No production SMS or push provider configuration.
- No enterprise SSO or multi-organization switcher.
- The production Compose overlay is an assignment deployment artifact, not a complete cloud hardening package.
