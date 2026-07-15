# BE-041: Repair ASGI WebSocket routing

Status: DONE
Priority: P0
Area: Backend
Related specs: BE-009, BE-013
Depends on: BE-022, BE-035

## Goal

Make the canonical realtime endpoint upgrade through the existing ASGI application:

```text
/ws/v1/events/?ticket=<one-time-ticket>
```

The fix must address the real cause of the HTTP 404 without adding a second WebSocket server
or a second authentication implementation.

## Allowed scope

- Backend ASGI runtime and Docker/Compose startup configuration.
- Reverse-proxy WebSocket routing when required.
- Existing realtime consumer, ticket, channel-layer, and outbox dispatch glue.
- Locked backend dependencies required by the ASGI runtime.
- Focused backend tests for WebSocket/outbox behavior.
- Task metadata, INT-004 dependency tracking, traceability references, and AI usage evidence.

## Required reading

- `AGENTS.md`
- `backend/AGENTS.md`
- `infra/AGENTS.md`
- `CODEX_START_HERE.md`
- `tasks/integration/INT-004-verify-document-upload-and-realtime-recovery.md`
- `specs/backend/BE-009-notifications-realtime.md`
- `specs/backend/BE-013-security-deployment.md`
- `docs/guardrails/02-security.md`
- `docs/guardrails/06-realtime-and-upload.md`
- `docs/tech/07-realtime.md`
- `docs/tech/12-docker.md`
- `docs/tech/asyncapi.yaml`

## Implementation steps

1. Confirm the route is registered once as `/ws/v1/events/`.
2. Run development and production API containers through `config.asgi:application`.
3. Pin the ASGI server through the backend dependency lock rather than a manual image install.
4. Ensure the reverse proxy routes `/ws/` to the API with upgrade headers, HTTP/1.1, and safe timeouts.
5. Preserve one-time ticket validation, allowed origin checks, Redis channel layer use, and server-selected user groups.
6. Dispatch safe document upload status outbox events to the existing user-scoped realtime publisher.

## Acceptance criteria

- [x] Valid ticket produces `101 Switching Protocols`.
- [x] Invalid, expired, reused, and wrong-origin tickets are rejected safely.
- [x] The endpoint is no longer handled as an ordinary HTTP 404.
- [x] Document upload status events reach the authorized user.
- [x] Another user cannot subscribe to the document event.
- [x] REST endpoints continue working.
- [x] Development and production API containers use ASGI.
- [x] WebSocket tickets, JWTs, and presigned URLs are absent from logs and events.

## Verification commands

```bash
docker compose config
docker compose build api api-test
docker compose up -d postgres redis rabbitmq minio minio-init api
docker compose ps
docker compose run --rm api-test python -m pytest tests/integration/test_documents.py -q
python3 scripts/check_simplicity.py
python3 scripts/validate_docs.py
```

## Out of scope

- A second WebSocket service.
- Client-selected subscriptions or arbitrary group names.
- Long-lived JWTs in WebSocket URLs.
- Replacing the existing consumer/ticket implementation.

## Codex execution log

- Started: 2026-07-15 21:13 +0330
- Completed: 2026-07-15 21:22 +0330
- Files changed:
  - `backend/pyproject.toml`
  - `backend/uv.lock`
  - `docker/backend/Dockerfile`
  - `compose.yaml`
  - `compose.production.yaml`
  - `docker/nginx/templates/default.conf.template`
  - `backend/common/services/outbox.py`
  - `backend/apps/documents/services.py`
  - `backend/apps/activity/tests/test_outbox_dispatcher.py`
  - `backend/tests/integration/test_documents.py`
  - `docs/tech/07-realtime.md`
  - `docs/tech/12-docker.md`
  - `specs/backend/BE-009-notifications-realtime.md`
  - `docs/traceability/matrix.md`
  - `tasks/INDEX.md`
  - `tasks/ORDER.md`
  - `tasks/integration/INT-004-verify-document-upload-and-realtime-recovery.md`
  - `AI_USAGE.md`
- Commands run:
  - `cd backend && uv lock` - passed; moved Daphne into the locked runtime dependency graph.
  - `cd backend && uv run --group test python -m pytest tests/test_settings.py apps/activity/tests/test_outbox_dispatcher.py common/realtime/tests/test_user_events.py -q` - passed, 19 tests.
  - `cd backend && uv run --group dev ruff check common/storage/minio.py common/services/outbox.py apps/documents/services.py tests/test_settings.py apps/activity/tests/test_outbox_dispatcher.py` - passed.
  - `docker compose config` - passed; API command renders as `daphne -b 0.0.0.0 -p 8000 config.asgi:application`.
  - `docker compose build api api-test` - passed.
  - `docker compose up -d postgres redis rabbitmq minio minio-init api` - passed.
  - `docker compose ps` - passed; API became healthy under Daphne.
  - `docker compose run --rm api-test python -m pytest tests/integration/test_documents.py -q` - passed after fixing allowed-scope integration harness mistakes; 2 tests.
  - `docker compose run --rm api-test python -m pytest common/realtime/tests/test_user_events.py -q` - passed, 7 tests.
  - Live WebSocket smoke through `api-test` - passed; valid ticket returned `101`, reused ticket returned `403`, invalid ticket returned `403`.
  - `docker compose run --rm api python -c "import pytest"` - failed with expected `ModuleNotFoundError: No module named 'pytest'`, confirming test dependencies remain out of the normal API runtime image.
  - `docker compose -f compose.yaml -f compose.production.yaml config` - passed.
  - `python3 scripts/check_simplicity.py` - passed, scanned 530 source files.
  - `python3 scripts/validate_docs.py` - passed, validated 27 specs, 74 tasks, and 184 Markdown files.
- Result: DONE. Development and production API commands use `config.asgi:application`; the registered route remains the single explicit `/ws/v1/events/` route; the reverse proxy now routes the `/ws/` prefix with WebSocket upgrade headers; safe document upload status outbox payloads dispatch to the existing user-scoped realtime publisher after transaction commit.
- Deviations/questions: The first INT-004 reruns exposed integration harness bugs after the product blockers were fixed. Corrections were limited to passing the stored HTTP session to helper calls, marking the module for pytest-django DB access, and deleting only the seed users created by each run.
