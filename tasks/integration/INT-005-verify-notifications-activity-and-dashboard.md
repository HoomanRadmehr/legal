# INT-005: Verify notifications, activity, and dashboard

Status: BLOCKED
Priority: P0
Area: Integration
Related specs: BE-008, BE-009, BE-010, FE-008, FE-009
Depends on: BE-025, FE-016

## Goal

Verify preference-respecting notifications, activity visibility, and dashboard count parity.

## Allowed scope

- `backend/tests/integration/`
- `frontend/src/test/integration/`

## Required reading

- `AGENTS.md`
- `backend/AGENTS.md`
- `frontend/AGENTS.md`
- `specs/backend/BE-008-activity-outbox.md`
- `specs/backend/BE-009-notifications-realtime.md`
- `specs/backend/BE-010-dashboard.md`
- `specs/frontend/FE-008-dashboard.md`
- `specs/frontend/FE-009-notifications-activity-realtime.md`
- `docs/traceability/definition-of-done.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Trigger deadline/record events.
2. Verify in-app and email development delivery, disabled channel behavior, and no fake SMS/push success.
3. Verify activity timeline/global visibility.
4. Compare dashboard counts with list APIs per role.

## Acceptance criteria

- [ ] No duplicate delivery.
- [ ] Dashboard leaks no hidden counts.
- [ ] Activity is read-only and redacted.

## Verification commands

```bash
docker compose run --rm api python -m pytest tests/integration/test_dashboard_notifications.py -q
```

## Out of scope

- Production provider delivery.

## Codex execution log

- Started: 2026-07-15 16:12 +0330
- Completed: 2026-07-15 16:20 +0330
- Files changed:
  - `backend/tests/integration/test_dashboard_notifications.py`
  - `tasks/integration/INT-005-verify-notifications-activity-and-dashboard.md`
  - `AI_USAGE.md`
- Commands run:
  - `python3 -m py_compile backend/tests/integration/test_dashboard_notifications.py` - passed.
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-int005-venv uv run --python /usr/bin/python3.12 ruff check tests/integration/test_dashboard_notifications.py` - initially failed on import usage and formatting.
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-int005-venv uv run --python /usr/bin/python3.12 ruff check --fix tests/integration/test_dashboard_notifications.py` - passed.
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-int005-venv uv run --python /usr/bin/python3.12 ruff format tests/integration/test_dashboard_notifications.py` - passed.
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-int005-venv uv run --python /usr/bin/python3.12 ruff check tests/integration/test_dashboard_notifications.py` - passed.
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-int005-venv uv run --python /usr/bin/python3.12 ruff format --check tests/integration/test_dashboard_notifications.py` - passed.
  - `docker compose up -d --build api mailpit` - passed and started the real local API stack with dependencies.
  - `docker compose run --rm api python -m pytest tests/integration/test_dashboard_notifications.py -q` - failed before test collection with `/opt/venv/bin/python: No module named pytest`.
  - `python3 scripts/check_simplicity.py` - initially failed on long functions in the new integration test; passed after refactor, scanned 502 source files.
  - `docker compose build api` - passed.
  - `docker compose run --rm api python -m pytest tests/integration/test_dashboard_notifications.py -q` - failed again before test collection with `/opt/venv/bin/python: No module named pytest`.
  - `python3 scripts/validate_docs.py` - failed on pre-existing invalid task heading IDs in decimal task files outside INT-005 scope.
- Result: BLOCKED. Dependencies `BE-025` and `FE-016` are `DONE`, required reading was completed, and allowed-scope integration coverage was added for notification preferences/delivery/WebSocket, activity visibility/redaction/read-only behavior, dashboard count parity, and private MinIO bucket behavior. The task cannot be marked `DONE` because its required Compose verification command exits before pytest collection.
- Deviations/questions: Product code outside INT-005's allowed scope was not patched. Blocking finding is owned by Docker/test infrastructure from `BE-005`/`BE-006`: reproduce with `docker compose run --rm api python -m pytest tests/integration/test_dashboard_notifications.py -q`; the `legal-backend:dev` runtime image exits with `/opt/venv/bin/python: No module named pytest` because pytest is not installed in the runtime environment. Documentation validation is also blocked by existing invalid task heading IDs in `BE-038`, `BE-036`, `BE-037`, `FE-022`, `FE-023`, and `FE-024`.
