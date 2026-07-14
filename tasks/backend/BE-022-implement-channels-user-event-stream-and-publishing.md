# BE-022: Implement Channels user event stream and publishing

Status: DONE
Priority: P0
Area: Backend
Related specs: BE-009, BE-007
Depends on: BE-010, BE-019, BE-021

## Goal

Create one secure user-scoped WebSocket consumer and status publishing path.

## Allowed scope

- `backend/common/realtime/`
- `backend/config/asgi.py`
- `backend/config/routing.py`
- `backend/common/realtime/tests/`
- `docs/tech/asyncapi.yaml`

## Required reading

- `AGENTS.md`
- `backend/AGENTS.md` 
- `specs/backend/BE-009-notifications-realtime.md`, `specs/backend/BE-007-documents-uploads.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Implement `CommonJsonConsumer` with one direct framework base.
2. Implement `UserEventsConsumer` that atomically consumes one-time ticket and joins only user group.
3. Validate origin, ensure ticket values are not logged, and limit incoming messages to ping behavior.
4. Implement small publisher function called by outbox/task processing.
5. Emit versioned upload status events with safe payload.
6. Add ticket reuse, expiry, cross-user, origin, and schema tests.

## Acceptance criteria

- [x] Client cannot select group names.
- [x] Ticket is deleted on first use.
- [x] No JWT/presigned URL appears in event or logs.
- [x] REST polling remains possible.
- [x] Consumer has no multiple inheritance.

## Verification commands

```bash
cd backend && python -m pytest common/realtime/tests -q
python scripts/check_simplicity.py backend
```

## Out of scope

- Browser reconnect implementation.

## Codex execution log

- Started: 2026-07-14
- Completed: 2026-07-14 21:37:45 +0330
- Files changed:
  - `backend/common/realtime/__init__.py`
  - `backend/common/realtime/consumers.py`
  - `backend/common/realtime/publisher.py`
  - `backend/common/realtime/routing.py`
  - `backend/common/realtime/tests/__init__.py`
  - `backend/common/realtime/tests/test_user_events.py`
  - `backend/config/asgi.py`
  - `backend/config/routing.py`
  - `docs/tech/asyncapi.yaml`
  - `AI_USAGE.md`
  - `tasks/backend/BE-022-implement-channels-user-event-stream-and-publishing.md`
- Commands run:
  - `cd backend && python -m pytest common/realtime/tests -q` (failed before pytest because `.python-version` points to uninstalled `3.12`)
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be022-venv uv run --python /usr/bin/python3.12 python -m pytest common/realtime/tests -q`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be022-venv uv run --python /usr/bin/python3.12 ruff format common/realtime config/asgi.py config/routing.py`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be022-venv uv run --python /usr/bin/python3.12 ruff check common/realtime config/asgi.py config/routing.py`
  - `python scripts/check_simplicity.py backend` (failed before script startup because `.python-version` points to uninstalled `3.12`)
  - `/usr/bin/python3.12 scripts/check_simplicity.py backend`
  - `python3 scripts/check_simplicity.py backend`
  - `python3 scripts/validate_docs.py`
- Result: DONE; implemented the `/ws/v1/events/` ASGI route, one-time-ticket `CommonJsonConsumer`, user-only `UserEventsConsumer`, safe versioned event builders, upload-status publishing helpers, AsyncAPI contract updates, and focused realtime tests for ticket consumption, ticket reuse/expiry, origin rejection, user-group isolation, ping-only client messages, and payload redaction.
- Deviations/questions: The task asks for a publisher "called by outbox/task processing," but its allowed scope excludes `backend/common/services/outbox.py` and document task/service files. This implementation provides the callable realtime publisher and payload adapter in `backend/common/realtime/`; wiring the existing outbox dispatcher stub should be done by a task that allows editing `common/services/outbox.py`.
