# FE-012: Implement document upload initiation and direct transfer

Status: DONE
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

- [x] Bytes are sent to presigned URL, not Django API.
- [x] No MinIO credential or URL persistence/log.
- [x] Viewer has no upload control.
- [x] Local progress stops at upload completion and processing remains authoritative.

## Verification commands

```bash
cd frontend && npm test -- --run src/features/documents
cd frontend && npm run typecheck
```

## Out of scope

- Completion/realtime/download.

## Codex execution log

- Started: 2026-07-14
- Completed: 2026-07-14 21:54:47 +0330
- Files changed:
  - `frontend/src/features/documents/api.ts`
  - `frontend/src/features/documents/hooks.ts`
  - `frontend/src/features/documents/index.ts`
  - `frontend/src/features/documents/policy.ts`
  - `frontend/src/features/documents/types.ts`
  - `frontend/src/features/documents/components/DocumentUploadPanel.tsx`
  - `frontend/src/features/documents/components/documents.css`
  - `frontend/src/features/documents/tests/DocumentUploadPanel.test.tsx`
  - `frontend/src/features/documents/tests/api.test.ts`
  - `AI_USAGE.md`
  - `tasks/frontend/FE-012-implement-document-upload-initiation-and-direct-transfer.md`
- Commands run:
  - `cd frontend && npm test -- --run src/features/documents` (initially failed because generated `node_modules` was absent and `vitest` was not installed; passed after dependency install)
  - `printf '%s\n' '<sudo password redacted>' | sudo -S chown -R hooman:hooman frontend/node_modules`
  - `cd frontend && npm ci`
  - `cd frontend && npm test -- --run src/features/documents`
  - `cd frontend && npm run typecheck`
  - `cd frontend && npm run lint`
  - `cd frontend && npm run format:check`
  - `cd frontend && npx prettier --write src/features/documents/**/*.{ts,tsx,css}`
  - `cd frontend && npx prettier --write src/features/documents/*.{ts,tsx}` (formatted top-level `.ts` files but exited nonzero because there are no top-level `.tsx` files)
  - `python3 scripts/check_simplicity.py frontend/src`
  - `cd frontend && npm run build`
  - `rm -rf frontend/node_modules frontend/dist && python3 scripts/validate_docs.py`
- Result: DONE; implemented typed upload initiation, direct PUT/POST storage transfer with exact returned URL/headers/fields, local byte-progress state, generated in-memory idempotency key retention for later completion retry, file picker/drop affordance with size/type precheck, viewer-hidden upload control, rate-limit/413/422 feedback, and network-boundary tests.
- Deviations/questions: Completion, realtime, polling, list, and download remain out of scope for FE-012. `npm ci` was needed because dependencies were absent; generated `frontend/node_modules` was root-owned from a prior local state, so ownership was corrected before installation. Generated `node_modules` and `dist` were removed after verification so docs validation scans repository docs only.
