# FE-012: Implement document upload initiation and direct transfer

Status: TODO
Priority: P0
Area: Frontend
Related specs: FE-007
Depends on: FE-005, FE-006, BE-020

## Goal

Implement file selection, policy feedback, presigned initiation, direct MinIO transfer, and local progress.

## Allowed scope

- `frontend/src/features/documents/`
- `frontend/src/api/client.ts`

## Required reading

- `AGENTS.md`
- `frontend/AGENTS.md` 
- `specs/frontend/FE-007-documents-upload.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Write upload initiation API and types.
2. Implement file picker/drag area with size/type precheck.
3. Upload using exact returned method/fields/headers and report byte progress.
4. Do not persist/log URL.
5. Generate and retain idempotency key for completion retry.
6. Handle initiation 413/422/429.
7. Add tests with network boundary mocks.

## Acceptance criteria

- [ ] Bytes are sent to presigned URL, not Django API.
- [ ] No MinIO credential or URL persistence/log.
- [ ] Viewer has no upload control.
- [ ] Local progress stops at upload completion and processing remains authoritative.

## Verification commands

```bash
cd frontend && npm test -- --run src/features/documents
cd frontend && npm run typecheck
```

## Out of scope

- Completion/realtime/download.

## Codex execution log

- Started:
- Completed:
- Files changed:
- Commands run:
- Result:
- Deviations/questions:
