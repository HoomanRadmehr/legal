# BE-035: Add Compose integration test runner

Status: DONE
Priority: P0
Area: Backend
Related specs: BE-000, BE-013
Depends on: BE-005, BE-006, BE-031

## Goal

Repair the Compose integration-test runner so integration tasks can collect and run pytest tests without installing test dependencies in the production backend runtime.

## Allowed scope

- `backend/pyproject.toml`
- `backend/uv.lock`
- `docker/backend/Dockerfile`
- `compose.yaml`
- `backend/tests/integration/`
- `tasks/backend/BE-035-add-compose-integration-test-runner.md`
- `tasks/integration/INT-004-verify-document-upload-and-realtime-recovery.md`
- task metadata and Markdown references needed to remove decimal task IDs
- `AI_USAGE.md`

## Required reading

- `AGENTS.md`
- `backend/AGENTS.md`
- `infra/AGENTS.md`
- `CODEX_START_HERE.md`
- `tasks/integration/INT-004-verify-document-upload-and-realtime-recovery.md`
- `specs/backend/BE-000-foundation.md`
- `specs/backend/BE-013-security-deployment.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Add a locked `test` dependency group with the existing pytest packages.
2. Add a dedicated backend Docker `test` target that installs the `test` group.
3. Keep the production runtime target free of test dependencies.
4. Add an `api-test` Compose service using the Docker `test` target, real Compose dependencies, non-root execution, and integration-test settings.
5. Update INT-004 to depend on this task and use `api-test` for its verification command.
6. Rename decimal task IDs to canonical integer IDs and update references.
7. Verify pytest import, integration test collection, production pytest absence, Compose config, simplicity, and docs validation.

## Acceptance criteria

- [x] `api-test` imports pytest.
- [x] `api-test` can collect `tests/integration/test_documents.py`.
- [x] Production backend runtime does not include pytest.
- [x] Compose configuration is valid.
- [x] Decimal task IDs are replaced with canonical three-digit integer IDs.
- [x] `python3 scripts/check_simplicity.py` passes.
- [x] `python3 scripts/validate_docs.py` passes.
- [x] No document-upload, MinIO, WebSocket, JWT, cookie, CSRF, permission, or realtime product behavior is changed.

## Verification commands

```bash
docker compose config
docker compose build --no-cache api-test
docker compose run --rm api-test python -c "import pytest; print(pytest.__version__)"
docker compose run --rm api-test python -m pytest --collect-only tests/integration/test_documents.py -q
docker compose -f compose.yaml -f compose.production.yaml build --no-cache api
docker compose -f compose.yaml -f compose.production.yaml run --rm api python -c "import pytest"
python3 scripts/check_simplicity.py
python3 scripts/validate_docs.py
```

## Out of scope

- Implementing the full INT-004 document upload and realtime recovery contract tests.
- Changing document upload, MinIO, WebSocket, JWT, cookie, CSRF, permission, or realtime product behavior.
- Weakening production image security or installing test dependencies in production.

## Codex execution log

- Started: 2026-07-15 18:39 +0330
- Completed: 2026-07-15 18:59 +0330
- Files changed:
  - `backend/pyproject.toml`
  - `backend/uv.lock`
  - `docker/backend/Dockerfile`
  - `compose.yaml`
  - `backend/tests/integration/test_documents.py`
  - `README.md`
  - `tasks/INDEX.md`
  - `tasks/ORDER.md`
  - `tasks/backend/BE-035-add-compose-integration-test-runner.md`
  - `tasks/backend/BE-036-implement-admin-user-invitation-api.md`
  - `tasks/backend/BE-037-implement-user-invitation-acceptance.md`
  - `tasks/backend/BE-038-implement-membership-role-management.md`
  - `tasks/frontend/FE-022-implement-admin-user-creation-form.md`
  - `tasks/frontend/FE-023-implement-user-invitation-acceptance-page.md`
  - `tasks/frontend/FE-024-implement-user-role-management-page.md`
  - `tasks/integration/INT-004-verify-document-upload-and-realtime-recovery.md`
  - Markdown task references and `AI_USAGE.md`
- Commands run:
  - `docker compose config` - passed.
  - `docker compose build --no-cache api-test` - passed; built `legal-backend:test`.
  - `docker compose run --rm api-test python -c "import pytest; print(pytest.__version__)"` - passed and printed `8.4.2`.
  - `docker compose run --rm api-test python -m pytest --collect-only tests/integration/test_documents.py -q` - passed, collected `tests/integration/test_documents.py::test_int004_contract_scenarios_are_pending`.
  - `docker compose -f compose.yaml -f compose.production.yaml build --no-cache api` - passed; built `legal-backend:prod`.
  - `docker compose -f compose.yaml -f compose.production.yaml run --rm api python -c "import pytest"` - first attempts were blocked by stale development Compose network/container state; after `docker compose down --remove-orphans` without volumes, rerun reached Python and failed with the expected `ModuleNotFoundError: No module named 'pytest'`.
  - `python3 scripts/check_simplicity.py` - passed, scanned 520 source files.
  - `python3 scripts/validate_docs.py` - initially failed because generated `frontend/node_modules` Markdown was present; after removing generated `frontend/node_modules` and `frontend/dist`, passed with 27 specs, 70 tasks, and 180 Markdown files.
- Result: DONE. Added a locked backend `test` dependency group, a dedicated Docker `test` target, and an `api-test` Compose service that runs as `app`, uses the real Compose dependencies and development integration settings, imports pytest, and collects the INT-004 integration file. Production runtime image excludes pytest.
- Deviations/questions: The production import check required clearing stale development Compose containers/networks without removing volumes before the production overlay could recreate the backend network. The `tests/integration/test_documents.py` file intentionally contains a failing placeholder test that is only collected by BE-035; the full INT-004 contract scenarios remain for a separate INT-004 execution. Generated frontend dependency/build output was removed only so the repository documentation validator would inspect source Markdown.
