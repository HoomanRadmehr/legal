# INT-001: Verify authentication and role contract

Status: BLOCKED
Priority: P0
Area: Integration
Related specs: BE-001, BE-002, FE-001, FE-002
Depends on: BE-011, FE-005

## Goal

Verify backend/frontend authentication, membership, role navigation, CSRF, and 401/404 behavior end to end.

## Allowed scope

- `backend/tests/integration/`
- `frontend/src/test/integration/`
- `docs/traceability/matrix.md`

## Required reading

- `AGENTS.md`
- `backend/AGENTS.md`
- `frontend/AGENTS.md`
- `specs/backend/BE-001-authentication.md`
- `specs/backend/BE-002-organizations-permissions.md`
- `specs/frontend/FE-001-authentication.md`
- `specs/frontend/FE-002-app-shell-permissions.md`
- `docs/traceability/definition-of-done.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Start stack with seed data.
2. Exercise login, bootstrap refresh, role navigation, logout, and expired token.
3. Verify Viewer/Counsel/Admin boundaries through API and UI.
4. Record contract mismatches and fix only in owning task/area.

## Acceptance criteria

- [ ] All four roles authenticate and see expected navigation.
- [ ] Refresh/cookie/CSRF flow works through proxy.
- [ ] Cross-org direct URL reveals no record.

## Verification commands

```bash
docker compose up -d --build
docker compose run --rm api python -m pytest tests/integration/test_auth.py -q
```

## Out of scope

- Other domain workflows.

## Codex execution log

- Started: 2026-07-14 18:48 +0330
- Completed: 2026-07-14 18:48 +0330
- Files changed: `backend/tests/integration/__init__.py`, `backend/tests/integration/test_auth.py`, `tasks/integration/INT-001-verify-authentication-and-role-contract.md`, `AI_USAGE.md`.
- Commands run:
  - `cd backend && uv run --python /usr/bin/python3.12 ruff format tests/integration/test_auth.py`
  - `cd backend && uv run --python /usr/bin/python3.12 ruff check tests/integration/test_auth.py`
  - `docker compose up -d --build` (failed before stack startup)
  - `docker compose run --rm api python -m pytest tests/integration/test_auth.py -q` (failed before pytest startup for the same Compose image issue)
  - `python3 scripts/check_simplicity.py` (passed; scanned 149 source files)
  - `python3 scripts/validate_docs.py` (initially failed because generated `frontend/node_modules` Markdown was present; after removing `frontend/node_modules`, passed with 27 specs, 63 tasks, and 171 Markdown files)
- Result: Added an integration test that seeds synthetic role users, calls the published API over HTTP, checks JWT/cookie/CSRF/logout/error behavior, checks MinIO public bucket denial, and asserts the documented WebSocket and cross-organization not-found contracts. The task is blocked before acceptance verification because the local Compose stack cannot start.
- Deviations/questions: Dependencies `BE-011` and `FE-005` were confirmed `DONE` before editing. Blocking finding owned by `BE-005`/Docker infrastructure: `compose.yaml:159` references `minio/mc:RELEASE.2024-07-15T19-02-30Z`, and Docker reports `manifest unknown`; reproduce with `docker compose up -d --build`. Additional unexecuted contract gaps visible in current product code: `backend/config/routing.py:5` has no WebSocket URL patterns, `backend/config/asgi.py:11` exposes only the HTTP Django ASGI application, and `backend/config/urls.py:9-13` publishes auth/health routes but no matter route for the cross-org direct URL check. These were not patched because they are outside INT-001's allowed scope.
