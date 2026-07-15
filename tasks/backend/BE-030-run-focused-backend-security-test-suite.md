# BE-030: Run focused backend security test suite

Status: DONE
Priority: P0
Area: Backend
Related specs: BE-013
Depends on: BE-009, BE-011, BE-013, BE-014, BE-016, BE-015, BE-017, BE-021, BE-022, BE-027

## Goal

Add and pass an explicit security suite covering the highest-risk boundaries.

## Allowed scope

- `backend/tests/security/`
- `backend/apps/*/tests/`

## Required reading

- `AGENTS.md`
- `backend/AGENTS.md` 
- `specs/backend/BE-013-security-deployment.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Add cross-organization list/retrieve/update/download tests.
2. Add role mutation matrix.
3. Add JWT rotation/replay/logout/CSRF tests.
4. Add rate-limit tests.
5. Add upload mismatch/expiry/replay/log redaction tests.
6. Add WS ticket reuse/cross-user/origin tests.
7. Add offboarding rollback/idempotency tests.
8. Run full suite and fix confirmed issues only.

## Acceptance criteria

- [x] Every security scenario in docs/guardrails/02-security.md is covered or explicitly documented as deferred.
- [x] No test is weakened to accommodate incorrect behavior.
- [x] Full backend suite passes.

## Verification commands

```bash
cd backend && python -m pytest tests/security apps -q
python scripts/check_simplicity.py backend
```

## Out of scope

- Penetration testing claim or production certification.

## Codex execution log

- Started: 2026-07-15T16:55:20+03:30
- Completed: 2026-07-15T16:55:20+03:30
- Files changed:
  - `backend/tests/security/__init__.py`
  - `backend/tests/security/test_backend_security_suite.py`
  - `backend/apps/notices/tests/test_api.py`
  - `tasks/backend/BE-030-run-focused-backend-security-test-suite.md`
  - `AI_USAGE.md`
- Commands run:
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be030-venv uv run --python /usr/bin/python3.12 python -m pytest tests/security -q` - passed, 10 tests.
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be030-venv uv run --python /usr/bin/python3.12 python -m pytest tests/security apps -q` - passed, 232 tests.
  - `python3 scripts/check_simplicity.py backend` - passed, scanned 266 source files.
  - `cd backend && python -m pytest tests/security apps -q` - failed before pytest startup because `.python-version` points to uninstalled pyenv `3.12`.
  - `python scripts/check_simplicity.py backend` - failed before script startup because `.python-version` points to uninstalled pyenv `3.12`.
- Result: DONE. Added a focused backend security suite covering cross-organization hiding, viewer mutation denial, stale version conflicts, role mutation restrictions, JWT/CSRF/refresh replay/logout, login and upload throttles, upload completion expiry/missing/mismatch/replay misuse, sensitive redaction, WebSocket one-time/origin/user isolation, and offboarding denial/idempotency/rollback.
- Deviations/questions: Exact `python` verification commands are blocked by the repository pyenv shim for uninstalled `3.12`; equivalent `/usr/bin/python3.12` uv-backed pytest and `python3` simplicity commands passed. The existing notice API test fixture used a fixed deadline that became non-upcoming on 2026-07-15, so it was made relative to the test clock without weakening the permission assertion.
