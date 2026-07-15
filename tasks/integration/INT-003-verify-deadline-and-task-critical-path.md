# INT-003: Verify deadline and task critical path

Status: BLOCKED
Priority: P0
Area: Integration
Related specs: BE-006, FE-006
Depends on: BE-017, FE-011

## Goal

Verify today/upcoming/overdue/assigned views, completion, assignment, and organization timezone.

## Allowed scope

- `backend/tests/integration/`
- `frontend/src/test/integration/`

## Required reading

- `AGENTS.md`
- `backend/AGENTS.md`
- `frontend/AGENTS.md`
- `specs/backend/BE-006-deadlines-tasks.md`
- `specs/frontend/FE-006-deadlines-tasks.md`
- `docs/traceability/definition-of-done.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Freeze or seed deterministic times.
2. Check four deadline views for multiple roles.
3. Complete/cancel and verify dashboard/list updates.
4. Test cross-org/inactive assignee.
5. Verify task flows.

## Acceptance criteria

- [ ] Required views agree between API and UI.
- [ ] Timezone boundary is documented and correct.
- [ ] Completion is idempotent.

## Verification commands

```bash
docker compose run --rm api python -m pytest tests/integration/test_deadlines_tasks.py -q
```

## Out of scope

- Provider reminder delivery.

## Codex execution log

- Started: 2026-07-14
- Completed: 2026-07-14
- Files changed:
  - `tasks/integration/INT-003-verify-deadline-and-task-critical-path.md`
  - `AI_USAGE.md`
- Commands run:
  - `docker compose run --rm api python -m pytest tests/integration/test_deadlines_tasks.py -q` - failed before test startup while Compose recreated dependencies because host PostgreSQL already bound `127.0.0.1:5432`.
  - `pgrep -a postgres`, `systemctl --user status postgresql --no-pager`, and `sudo -n systemctl stop postgresql` - identified a non-Docker host PostgreSQL process on port `5432`; stopping it requires sudo credentials.
  - `docker compose -f compose.yaml run --rm api python -m pytest tests/integration/test_deadlines_tasks.py -q` - avoided host port publishing and failed before test collection with `/opt/venv/bin/python: No module named pytest`.
  - `python3 scripts/check_simplicity.py` - passed, scanned 342 source files.
  - `python3 scripts/validate_docs.py` - passed, 27 specs, 63 tasks, 172 Markdown files.
- Result: BLOCKED. Dependencies `BE-017` and `FE-011` are `DONE`, and the required reading was completed, but the required Compose verification command cannot run to test collection. The local override first conflicts with host PostgreSQL on `5432`; with host port publishing removed, the `legal-backend:dev` runtime image still lacks pytest.
- Deviations/questions: No integration test was added because the required Docker verification runner fails before test collection. Blocking finding is owned by Docker/test infrastructure from `BE-005`/`BE-006`: reproduce the exact local command with `docker compose run --rm api python -m pytest tests/integration/test_deadlines_tasks.py -q`; after avoiding port publishing, reproduce the image defect with `docker compose -f compose.yaml run --rm api python -m pytest tests/integration/test_deadlines_tasks.py -q`, which exits with `/opt/venv/bin/python: No module named pytest`. Product code outside INT-003's allowed scope was not patched.

## Codex execution log - rerun 2026-07-15

- Started: 2026-07-15 18:36 +0330
- Completed: 2026-07-15 18:36 +0330
- Files changed:
  - `tasks/integration/INT-003-verify-deadline-and-task-critical-path.md`
  - `AI_USAGE.md`
- Dependency check:
  - `BE-017` status confirmed `DONE`.
  - `FE-011` status confirmed `DONE`.
- Commands run:
  - `docker compose run --rm api python -m pytest tests/integration/test_deadlines_tasks.py -q` - failed before test collection with `/opt/venv/bin/python: No module named pytest`; Compose dependencies were running or healthy, including PostgreSQL, Redis, RabbitMQ, MinIO, and `minio-init`.
  - `python3 scripts/check_simplicity.py` - passed, scanned 519 source files.
  - `python3 scripts/validate_docs.py` - failed on pre-existing task heading IDs: `tasks/backend/BE-038-implement-membership-role-management.md`, `tasks/backend/BE-036-implement-admin-user-invitation-api.md`, `tasks/backend/BE-037-implement-user-invitation-acceptance.md`, `tasks/frontend/FE-022-implement-admin-user-creation-form.md`, `tasks/frontend/FE-023-implement-user-invitation-acceptance-page.md`, and `tasks/frontend/FE-024-implement-user-role-management-page.md`.
- Result: BLOCKED. The required API integration test runner still cannot reach collection because the Compose API runtime image does not include `pytest`; therefore the deadline/task critical path, REST/JWT/cookie/CSRF/WebSocket/MinIO/error contracts, and acceptance criteria cannot be truthfully marked verified in this task.
- Deviations/questions: No product code or integration test code was patched outside INT-003's allowed scope. Blocking finding is owned by backend Docker/test infrastructure from `BE-005`/`BE-006`; reproduce with `docker compose run --rm api python -m pytest tests/integration/test_deadlines_tasks.py -q`.
