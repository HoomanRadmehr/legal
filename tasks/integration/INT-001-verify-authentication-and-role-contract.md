# INT-001: Verify authentication and role contract

Status: TODO
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

- Started:
- Completed:
- Files changed:
- Commands run:
- Result:
- Deviations/questions:
