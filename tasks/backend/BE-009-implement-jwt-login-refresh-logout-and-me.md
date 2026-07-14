# BE-009: Implement JWT login, refresh, logout, and me

Status: DONE
Priority: P0
Area: Backend
Related specs: BE-001
Depends on: BE-007, BE-008, BE-003

## Goal

Implement secure JWT browser endpoints with CSRF bootstrap, rotated HttpOnly refresh cookie, and CSRF-protected login/refresh/logout.

## Allowed scope

- `backend/apps/accounts/api/v1/`
- `backend/apps/accounts/services.py`
- `backend/apps/accounts/selectors.py`
- `backend/apps/accounts/tests/`

## Required reading

- `AGENTS.md`
- `backend/AGENTS.md` 
- `specs/backend/BE-001-authentication.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Configure maintained JWT package with short access and rotated refresh tokens plus blacklist.
2. Implement explicit ModelSerializer inputs/outputs and ViewSet or API views consistent with spec.
3. Set/clear refresh cookie with settings-driven attributes.
4. Add a safe CSRF bootstrap endpoint and require CSRF on login/refresh/logout.
5. Return safe user and active membership data.
6. Ensure logout is idempotent and logs no token values.
7. Add domain OpenAPI declarations.

## Acceptance criteria

- [x] Refresh token never appears in JSON.
- [x] Old refresh cannot be reused after rotation.
- [x] Inactive user/membership is rejected.
- [x] CSRF bootstrap works and login/refresh/logout require CSRF.
- [x] Authentication errors are non-enumerating and localized.

## Verification commands

```bash
cd backend && python -m pytest apps/accounts/tests -q
cd backend && python manage.py spectacular --file /tmp/openapi.yaml --validate
```

## Out of scope

- Password reset/MFA and WebSocket consumer.

## Codex execution log

- Started: 2026-07-14
- Completed: 2026-07-14
- Files changed:
  - `backend/config/settings/base.py`
  - `backend/config/settings/production.py`
  - `backend/config/urls.py`
  - `backend/common/api/exception_handler.py`
  - `backend/apps/accounts/selectors.py`
  - `backend/apps/accounts/services.py`
  - `backend/apps/accounts/api/v1/__init__.py`
  - `backend/apps/accounts/api/v1/openapi.py`
  - `backend/apps/accounts/api/v1/serializers.py`
  - `backend/apps/accounts/api/v1/urls.py`
  - `backend/apps/accounts/api/v1/views.py`
  - `backend/apps/accounts/tests/test_auth_api.py`
  - `tasks/backend/BE-009-implement-jwt-login-refresh-logout-and-me.md`
  - `AI_USAGE.md`
- Commands run:
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be009-venv uv run --python /usr/bin/python3.12 python -m pytest apps/accounts/tests -q`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be009-venv uv run --python /usr/bin/python3.12 python manage.py spectacular --file /tmp/openapi.yaml --validate`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be009-venv uv run --python /usr/bin/python3.12 python -m pytest common/tests/test_error_envelope.py -q`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be009-venv uv run --python /usr/bin/python3.12 python manage.py makemigrations --check --dry-run`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be009-venv uv run --python /usr/bin/python3.12 ruff check apps/accounts common/api/exception_handler.py config/settings/base.py config/settings/production.py config/urls.py`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be009-venv uv run --python /usr/bin/python3.12 ruff format --check apps/accounts common/api/exception_handler.py config/settings/base.py config/settings/production.py config/urls.py`
  - `/usr/bin/python3 scripts/check_simplicity.py backend`
  - `/usr/bin/python3 scripts/validate_docs.py`
  - `cd backend && python -m pytest apps/accounts/tests -q` (failed before test startup because local pyenv points to uninstalled Python 3.12)
  - `cd backend && python manage.py spectacular --file /tmp/openapi.yaml --validate` (failed before Django startup for the same local pyenv reason)
- Result: Passed through the locked Python 3.12 uv environment. Accounts tests passed with 17 tests; OpenAPI validation passed; common error envelope regression tests, migration dry-run, lint, format, simplicity, and docs checks passed.
- Deviations/questions: Added Simple JWT blacklist/settings registration, production refresh-cookie secure setting, URL mounting, and stable-code exception handler support outside the narrow task path because refresh rotation, OpenAPI routing, and documented auth error codes require them. Rate limiting and WebSocket tickets remain deferred to BE-010. No unresolved questions remain.
