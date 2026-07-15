# BE-037: Implement user invitation acceptance

Status: DONE
Priority: P0
Area: Backend
Related specs: BE-001, BE-002, BE-008, BE-012, BE-013
Depends on: BE-010, BE-019, BE-036

## Goal

Allow an invited user to accept a valid one-time invitation, choose their own password, and activate their account securely.

The endpoint is public because the invited user does not yet have an authenticated session.

The invitation token is the authorization credential for this single operation.

## Business rules

1. The invitation token must be signed by the backend.
2. The token contains only the invitation identifier and required signing metadata.
3. Invitation acceptance must verify:
   - signature,
   - configured signing salt,
   - expiration,
   - database invitation state,
   - associated inactive User,
   - associated active Membership.
4. An accepted, revoked, expired, malformed, or unknown invitation returns the same generic error.
5. The API must not reveal which validation step failed.
6. Password validation uses Django's configured password validators.
7. Password confirmation is validated explicitly.
8. Acceptance is one-time.
9. The User becomes active only after every validation succeeds.
10. Invitation, User activation, activity, and outbox changes are atomic.
11. Acceptance does not automatically log the user in.
12. The endpoint does not set access or refresh tokens.
13. The user logs in through the normal JWT login endpoint after acceptance.
14. The endpoint has a dedicated Redis-backed rate limit.
15. No token or password appears in logs, traces, error metadata, or activity records.

## API contract

```text
POST /api/v1/auth/invitations/accept/
```

## Acceptance criteria

- [x] A valid signed invitation token activates the invited user and marks the invitation accepted.
- [x] Acceptance verifies signature, configured signing salt, database expiration, pending state, inactive user, and active membership.
- [x] Malformed, unknown, expired, already accepted, and mismatched-token invitations return the same generic error.
- [x] Password confirmation is explicit and Django password validation is called.
- [x] Acceptance is one-time and atomic with activity and outbox writes.
- [x] The endpoint is public, has a dedicated throttle, and does not set access or refresh tokens.
- [x] Tokens and passwords are not stored in activity or outbox payloads.

## Verification commands

```bash
cd backend && python -m pytest apps/accounts/tests apps/organizations/tests -q
```

## Codex execution log

- Started: 2026-07-15 10:53 +0330
- Completed: 2026-07-15 10:53 +0330
- Files changed:
  - `backend/apps/accounts/api/v1/openapi.py`
  - `backend/apps/accounts/api/v1/serializers.py`
  - `backend/apps/accounts/api/v1/urls.py`
  - `backend/apps/accounts/api/v1/views.py`
  - `backend/apps/accounts/tests/test_invitation_accept_api.py`
  - `backend/apps/organizations/services.py`
  - `backend/common/api/throttles.py`
  - `backend/config/settings/base.py`
  - `tasks/backend/BE-037-implement-user-invitation-acceptance.md`
  - `AI_USAGE.md`
- Commands run:
  - `cd backend && python -m pytest apps/accounts/tests apps/organizations/tests -q` (failed before pytest startup because `.python-version` points to uninstalled `3.12`)
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be02675-venv uv run --python /usr/bin/python3.12 python -m pytest apps/accounts/tests apps/organizations/tests -q`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be02675-venv uv run --python /usr/bin/python3.12 ruff check apps/accounts apps/organizations common/api/throttles.py config/settings/base.py`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be02675-venv uv run --python /usr/bin/python3.12 ruff format apps/accounts/tests/test_invitation_accept_api.py`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be02675-venv uv run --python /usr/bin/python3.12 ruff format --check apps/accounts apps/organizations common/api/throttles.py config/settings/base.py`
  - `python3 scripts/check_simplicity.py backend/apps/accounts backend/apps/organizations backend/common/api/throttles.py backend/config/settings/base.py`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be02675-venv uv run --python /usr/bin/python3.12 python manage.py makemigrations --check --dry-run`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be02675-venv uv run --python /usr/bin/python3.12 python manage.py spectacular --file /tmp/legal-be02675-openapi.yaml --validate`
  - `python3 scripts/validate_docs.py`
- Result: Implemented and verified public one-time invitation acceptance. Focused account and organization tests passed with 51 tests; lint, format, simplicity, migration drift, and OpenAPI validation passed.
- Deviations/questions: The task file was malformed before implementation: no closing API contract fence, no allowed scope, no acceptance section, no verification section, and no execution log. `python3 scripts/validate_docs.py` still fails because decimal task IDs are not accepted by the validator and unrelated task files remain malformed or reference missing dependencies.

## Codex verification rerun

- Started: 2026-07-15 19:06 +0330
- Completed: 2026-07-15 19:06 +0330
- Files changed:
  - `tasks/backend/BE-037-implement-user-invitation-acceptance.md`
  - `AI_USAGE.md`
- Commands run:
  - `cd backend && python -m pytest apps/accounts/tests apps/organizations/tests -q` - failed before pytest startup because `.python-version` points to unavailable pyenv `3.12`
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be037-verify-venv uv run --python /usr/bin/python3.12 python -m pytest apps/accounts/tests apps/organizations/tests -q` - passed, 58 tests
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be037-verify-venv uv run --python /usr/bin/python3.12 ruff check apps/accounts apps/organizations common/api/throttles.py config/settings/base.py` - passed
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be037-verify-venv uv run --python /usr/bin/python3.12 ruff format --check apps/accounts apps/organizations common/api/throttles.py config/settings/base.py` - passed, 46 files already formatted
  - `python3 scripts/check_simplicity.py backend/apps/accounts backend/apps/organizations backend/common/api/throttles.py backend/config/settings/base.py` - passed, scanned 39 source files
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be037-verify-venv uv run --python /usr/bin/python3.12 python manage.py makemigrations --check --dry-run` - passed with a local PostgreSQL connection warning; no changes detected
  - `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be037-verify-venv uv run --python /usr/bin/python3.12 python manage.py spectacular --file /tmp/legal-be037-verify-openapi.yaml --validate` - passed with one existing enum-name warning and 0 errors
  - `python3 scripts/validate_docs.py` - passed, 27 specs, 70 tasks, 180 Markdown files
- Result: Re-verified BE-037 without product-code changes. The public invitation acceptance endpoint remains implemented and the task remains `DONE`.
- Deviations/questions: The exact task command is still blocked by the local pyenv `3.12` shim before project code starts; the same test scope passed through the locked uv environment on `/usr/bin/python3.12`.
