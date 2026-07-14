# INT-004: Verify document upload and realtime recovery

Status: TODO
Priority: P0
Area: Integration
Related specs: BE-007, BE-009, FE-007, FE-009
Depends on: BE-022, FE-013

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
docker compose run --rm api python -m pytest tests/integration/test_documents.py -q
```

## Out of scope

- Malware scanning.

## Codex execution log

- Started:
- Completed:
- Files changed:
- Commands run:
- Result:
- Deviations/questions:
