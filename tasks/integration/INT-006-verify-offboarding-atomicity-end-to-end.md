# INT-006: Verify offboarding atomicity end to end

Status: BLOCKED
Priority: P0
Area: Integration
Related specs: BE-011, FE-010
Depends on: BE-027, FE-017

## Goal

Verify Admin preview/execute, stale preview, retry idempotency, and final reassignment.

## Allowed scope

- `backend/tests/integration/`
- `frontend/src/test/integration/`

## Required reading

- `AGENTS.md`
- `backend/AGENTS.md`
- `frontend/AGENTS.md`
- `specs/backend/BE-011-offboarding.md`
- `specs/frontend/FE-010-offboarding.md`
- `docs/traceability/definition-of-done.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Preview seeded departing member.
2. Verify no mutation.
3. Execute with idempotency and verify affected records.
4. Retry same request.
5. Trigger stale preview/failure and verify rollback.
6. Verify non-Admin denial.

## Acceptance criteria

- [ ] No orphaned active work.
- [ ] Duplicate execution is one logical run.
- [ ] Rollback is complete.
- [ ] UI communicates stale preview.

## Verification commands

```bash
docker compose run --rm api python -m pytest tests/integration/test_offboarding.py -q
```

## Out of scope

- External HR systems.

## Codex execution log

- Started: 2026-07-15 16:20 +0330
- Completed: 2026-07-15 16:29 +0330
- Files changed:
  - `backend/tests/integration/test_offboarding.py`
  - `tasks/integration/INT-006-verify-offboarding-atomicity-end-to-end.md`
  - `AI_USAGE.md`
- Commands run:
  - `python3 -m py_compile backend/tests/integration/test_offboarding.py` - passed.
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-int006-venv uv run --python /usr/bin/python3.12 ruff check tests/integration/test_offboarding.py` - initially failed on long lines and an implicit `locals()` dependency map; passed after fixes.
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-int006-venv uv run --python /usr/bin/python3.12 ruff format --check tests/integration/test_offboarding.py` - initially reported formatting changes needed.
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-int006-venv uv run --python /usr/bin/python3.12 ruff format tests/integration/test_offboarding.py` - passed.
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-int006-venv uv run --python /usr/bin/python3.12 ruff format --check tests/integration/test_offboarding.py` - passed.
  - `python3 scripts/check_simplicity.py` - passed, scanned 503 source files.
  - `docker compose run --rm api python -m pytest tests/integration/test_offboarding.py -q` - failed before test collection with `/opt/venv/bin/python: No module named pytest`.
  - `python3 scripts/validate_docs.py` - failed on pre-existing invalid task heading IDs in decimal task files outside INT-006 scope.
- Result: BLOCKED. Dependencies `BE-027` and `FE-017` are `DONE`, required reading was completed, and allowed-scope integration coverage was added for Admin preview read-only behavior, atomic final reassignment state, idempotent replay, stale-preview rollback/conflict, non-Admin denial, cross-organization run hiding, WebSocket ticket handshake, and private MinIO bucket behavior. The task cannot be marked `DONE` because its required Compose verification command exits before pytest collection.
- Deviations/questions: Product code outside INT-006's allowed scope was not patched. Blocking finding is owned by Docker/test infrastructure from `BE-005`/`BE-006`: reproduce with `docker compose run --rm api python -m pytest tests/integration/test_offboarding.py -q`; the `legal-backend:dev` runtime image exits with `/opt/venv/bin/python: No module named pytest` because pytest is not installed in the runtime environment. Documentation validation is also blocked by existing invalid task heading IDs in `BE-038`, `BE-036`, `BE-037`, `FE-022`, `FE-023`, and `FE-024`.
