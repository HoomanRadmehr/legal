# BE-010: Add authentication throttles and one-time WebSocket tickets

Status: DONE
Priority: P0
Area: Backend
Related specs: BE-001, BE-009
Depends on: BE-009, BE-004

## Goal

Protect authentication endpoints and issue short-lived one-time WebSocket connection tickets through Redis.

## Allowed scope

- `backend/common/api/throttles.py`
- `backend/common/auth/`
- `backend/apps/accounts/api/v1/`
- `backend/apps/accounts/tests/`

## Required reading

- `AGENTS.md`
- `backend/AGENTS.md` 
- `specs/backend/BE-001-authentication.md`, `specs/backend/BE-009-notifications-realtime.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Implement explicit Redis-backed throttle classes for login, refresh, and WS ticket.
2. Use IP plus normalized identifier for login without exposing account existence.
3. Implement random WS ticket creation bound to user and organization with <=60 second TTL.
4. Store only necessary ticket data and consume through a helper prepared for BE-022.
5. Document 429 and Retry-After in accounts OpenAPI.

## Acceptance criteria

- [x] Limits return standard 429 envelope and Retry-After.
- [x] Ticket expires and has sufficient entropy.
- [x] Ticket is designed for atomic one-time consumption.
- [x] No long-lived JWT is placed in a WS URL.

## Verification commands

```bash
cd backend && python -m pytest apps/accounts/tests -q
```

## Out of scope

- Channels consumer or proxy-level rate limiting.

## Codex execution log

- Started: 2026-07-14
- Completed: 2026-07-14 18:00:04 +0330
- Files changed:
  - `backend/common/api/throttles.py`
  - `backend/common/auth/tickets.py`
  - `backend/apps/accounts/api/v1/openapi.py`
  - `backend/apps/accounts/api/v1/serializers.py`
  - `backend/apps/accounts/api/v1/urls.py`
  - `backend/apps/accounts/api/v1/views.py`
  - `backend/apps/accounts/tests/test_auth_api.py`
  - `AI_USAGE.md`
  - `tasks/backend/BE-010-add-authentication-throttles-and-one-time-websocket-tickets.md`
- Commands run:
  - `cd backend && python -m pytest apps/accounts/tests -q` (failed before pytest: local pyenv points to missing Python 3.12)
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be010-venv uv run --python /usr/bin/python3.12 python -m pytest apps/accounts/tests -q`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be010-venv uv run --python /usr/bin/python3.12 ruff format common/api/throttles.py common/auth/tickets.py apps/accounts/api/v1 apps/accounts/tests/test_auth_api.py`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be010-venv uv run --python /usr/bin/python3.12 ruff check common/api/throttles.py common/auth/tickets.py apps/accounts/api/v1 apps/accounts/tests/test_auth_api.py`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be010-venv uv run --python /usr/bin/python3.12 python manage.py spectacular --file /tmp/legal-be010-schema.yaml --validate`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be010-venv uv run --python /usr/bin/python3.12 python manage.py makemigrations --check --dry-run` (passed with Django warning because local PostgreSQL role `legal_management` does not exist)
  - `/usr/bin/python3.12 scripts/validate_docs.py`
  - `/usr/bin/python3.12 scripts/check_simplicity.py backend`
- Result: Implemented explicit authentication throttles for login, refresh, and WebSocket ticket issuance; added short-lived one-time WebSocket tickets backed by the configured Django cache; documented 429 responses and `Retry-After`; added focused tests for throttle envelopes, hashed login identifiers, ticket entropy/TTL, one-time consumption, and no JWT in ticket URLs.
- Deviations/questions: The task calls these Redis-backed throttles/tickets; implementation uses Django's configured cache API, which is Redis in non-test backend settings and locmem in tests. Channels consumer and proxy-level rate limiting remain out of scope.
