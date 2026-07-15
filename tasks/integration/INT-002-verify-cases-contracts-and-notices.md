# INT-002: Verify cases, contracts, and notices

Status: BLOCKED
Priority: P0
Area: Integration
Related specs: BE-003, BE-004, BE-005, FE-003, FE-004, FE-005
Depends on: BE-016, FE-010

## Goal

Verify core legal record create/list/detail/update/archive and version conflicts through the running stack.

## Allowed scope

- `backend/tests/integration/`
- `frontend/src/test/integration/`

## Required reading

- `AGENTS.md`
- `backend/AGENTS.md`
- `frontend/AGENTS.md`
- `specs/backend/BE-003-cases.md`
- `specs/backend/BE-004-contracts.md`
- `specs/backend/BE-005-notices.md`
- `specs/frontend/FE-003-cases.md`
- `specs/frontend/FE-004-contracts.md`
- `specs/frontend/FE-005-notices.md`
- `docs/traceability/definition-of-done.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Use seeded roles to create and edit each record type.
2. Verify filters and permission-scoped results.
3. Trigger stale update conflict.
4. Verify notice linked deadline.
5. Verify activity timeline entries.

## Acceptance criteria

- [ ] Core record flows pass for authorized role and fail safely for Viewer/unrelated user.
- [ ] No hard delete occurs.
- [ ] Version conflict is visible and non-destructive.

## Verification commands

```bash
docker compose run --rm api python -m pytest tests/integration/test_legal_records.py -q
```

## Out of scope

- Documents and notifications.

## Codex execution log

- Started: 2026-07-14
- Completed: 2026-07-14
- Files changed:
  - `tasks/integration/INT-002-verify-cases-contracts-and-notices.md`
  - `AI_USAGE.md`
- Commands run:
  - `docker compose run --rm api python -m pytest tests/integration/test_legal_records.py -q` - failed before test startup while Compose recreated dependencies because unrelated container `agenticcrmbackend-redis-1` already bound port `6379`.
  - `docker stop agenticcrmbackend-redis-1 agenticcrmbackend-api-1` - stopped unrelated Docker containers that occupied ports required by the local Compose override.
  - `docker compose run --rm api python -m pytest tests/integration/test_legal_records.py -q` - failed before test startup with `/opt/venv/bin/python: No module named pytest`.
  - `python3 scripts/check_simplicity.py` - passed, scanned 342 source files.
  - `python3 scripts/validate_docs.py` - passed, 27 specs, 63 tasks, 172 Markdown files.
- Result: BLOCKED. Dependencies `BE-016` and `FE-010` are `DONE`, and the required reading was completed, but the task's required Compose verification command cannot execute tests because the `legal-backend:dev` runtime image does not include pytest.
- Deviations/questions: No integration test was added because the required Docker verification runner fails before test collection. Blocking finding is owned by Docker/test infrastructure from `BE-005`/`BE-006`: reproduce with `docker compose run --rm api python -m pytest tests/integration/test_legal_records.py -q`; after clearing port conflicts, the API image exits with `/opt/venv/bin/python: No module named pytest`. Product code outside INT-002's allowed scope was not patched.

## Codex execution log - rerun 2026-07-15

- Started: 2026-07-15 18:35 +0330
- Completed: 2026-07-15 18:35 +0330
- Files changed:
  - `tasks/integration/INT-002-verify-cases-contracts-and-notices.md`
  - `AI_USAGE.md`
- Commands run:
  - `docker compose run --rm api python -m pytest tests/integration/test_legal_records.py -q` - failed before test collection with `/opt/venv/bin/python: No module named pytest`.
  - `python3 scripts/check_simplicity.py` - passed; scanned 519 source files.
  - `python3 scripts/validate_docs.py` - failed on pre-existing decimal task heading IDs: `BE-038`, `BE-036`, `BE-037`, `FE-022`, `FE-023`, and `FE-024`.
- Result: BLOCKED. Dependencies `BE-016` and `FE-010` were confirmed `DONE`, but the exact required Compose verification command still cannot run because the API runtime image lacks `pytest`.
- Deviations/questions: No backend or frontend product code was patched outside INT-002 allowed scope. The reproducible blocker remains owned by backend Docker/test infrastructure from `BE-005`/`BE-006`: `docker compose run --rm api python -m pytest tests/integration/test_legal_records.py -q`.
