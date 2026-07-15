# INT-004: Verify document upload and realtime recovery

Status: TODO
Priority: P0
Area: Integration
Related specs: BE-007, BE-009, FE-007, FE-009
Depends on: BE-022, BE-035, FE-013

## Goal

Exercise browser-to-MinIO upload, completion, WebSocket status, polling fallback, and permissioned download.

## Allowed scope

- `backend/tests/integration/`
- `frontend/src/test/integration/`
- `infra/`

## Required reading

- `AGENTS.md`
- `backend/AGENTS.md`
- `frontend/AGENTS.md`
- `specs/backend/BE-007-documents-uploads.md`
- `specs/backend/BE-009-notifications-realtime.md`
- `specs/frontend/FE-007-documents-upload.md`
- `specs/frontend/FE-009-notifications-activity-realtime.md`
- `docs/traceability/definition-of-done.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Initiate as authorized Counsel and upload to MinIO.
2. Complete and observe available status.
3. Disconnect WebSocket and verify polling recovery.
4. Attempt Viewer upload and cross-org download.
5. Inspect logs/storage mocks for URL/token leakage.

## Acceptance criteria

- [ ] Direct upload succeeds without Django proxying bytes.
- [ ] Unauthorized operations fail safely.
- [ ] Realtime and polling reach same result.
- [ ] No presigned URL appears in application logs.

## Verification commands

```bash
docker compose run --rm api-test python -m pytest tests/integration/test_documents.py -q
```

## Out of scope

- Malware scanning.

## Codex execution log

- Started: 2026-07-15 18:37 +0330
- Completed: 2026-07-15 18:37 +0330
- Files changed:
  - `tasks/integration/INT-004-verify-document-upload-and-realtime-recovery.md`
  - `AI_USAGE.md`
- Dependency check:
  - `BE-022` status confirmed `DONE`.
  - `FE-013` status confirmed `DONE`.
- Commands run:
  - `docker compose run --rm api python -m pytest tests/integration/test_documents.py -q` - failed before test collection with `/opt/venv/bin/python: No module named pytest`; Compose dependencies were running or healthy, including PostgreSQL, Redis, RabbitMQ, MinIO, and `minio-init`.
  - `python3 scripts/check_simplicity.py` - passed, scanned 519 source files.
  - `python3 scripts/validate_docs.py` - failed on pre-existing task heading IDs: `tasks/backend/BE-038-implement-membership-role-management.md`, `tasks/backend/BE-036-implement-admin-user-invitation-api.md`, `tasks/backend/BE-037-implement-user-invitation-acceptance.md`, `tasks/frontend/FE-022-implement-admin-user-creation-form.md`, `tasks/frontend/FE-023-implement-user-invitation-acceptance-page.md`, and `tasks/frontend/FE-024-implement-user-role-management-page.md`.
- Result: BLOCKED. The required API integration test runner cannot reach collection because the Compose API runtime image does not include `pytest`; therefore the direct upload, completion, WebSocket recovery, polling recovery, permissioned download, JWT/cookie/CSRF, MinIO privacy, and error-contract acceptance criteria cannot be truthfully marked verified in this task.
- Deviations/questions: No product code or integration test code was patched outside INT-004's allowed scope. Blocking finding is owned by backend Docker/test infrastructure from `BE-005`/`BE-006`; reproduce with `docker compose run --rm api python -m pytest tests/integration/test_documents.py -q`.
- Dependency unblock note: 2026-07-15 18:59 +0330. `BE-035` completed the Compose integration test runner repair, added the `api-test` service, and updated this task's verification command to use `api-test`. INT-004 is reset to `TODO`; the full document upload and realtime recovery contract remains unexecuted for a separate INT-004 run.
