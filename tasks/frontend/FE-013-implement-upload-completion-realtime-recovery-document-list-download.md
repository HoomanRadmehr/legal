# FE-013: Implement upload completion, realtime recovery, document list/download

Status: DONE
Priority: P0
Area: Frontend
Related specs: FE-007, FE-009
Depends on: FE-012, FE-004, BE-021, BE-022

## Goal

Complete uploads idempotently, follow authoritative status over WebSocket/polling, and download through fresh backend URLs.

## Allowed scope

- `frontend/src/features/documents/`
- `frontend/src/realtime/`
- `frontend/src/auth/`

## Required reading

- `AGENTS.md`
- `frontend/AGENTS.md` 
- `specs/frontend/FE-007-documents-upload.md`, `specs/frontend/FE-009-notifications-activity-realtime.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Implement completion request reusing idempotency key.
2. Implement one-time WS ticket client and user connection with backoff.
3. Validate event envelope/version and update/invalidate upload queries.
4. Poll active uploads while disconnected and refetch on reconnect.
5. Implement document list, status, fresh download URL, and revoke control.
6. Add state/recovery/security tests.

## Acceptance criteria

- [x] Ticket/token/URL is not persisted.
- [x] Duplicate event cannot regress final state.
- [x] Polling reaches same final state.
- [x] Download asks backend each time.
- [x] Unknown event version is safe.

## Verification commands

```bash
cd frontend && npm test -- --run src/features/documents src/realtime
cd frontend && npm run typecheck
```

## Out of scope

- Other realtime event features.

## Codex execution log

- Started: 2026-07-14 21:54 +0330
- Completed: 2026-07-14 22:04 +0330
- Files changed: `frontend/src/auth/api.ts`; `frontend/src/realtime/client.ts`; `frontend/src/realtime/events.ts`; `frontend/src/realtime/index.ts`; `frontend/src/realtime/client.test.ts`; `frontend/src/features/documents/api.ts`; `frontend/src/features/documents/hooks.ts`; `frontend/src/features/documents/queryKeys.ts`; `frontend/src/features/documents/types.ts`; `frontend/src/features/documents/index.ts`; `frontend/src/features/documents/components/DocumentUploadPanel.tsx`; `frontend/src/features/documents/components/DocumentList.tsx`; `frontend/src/features/documents/components/DocumentSection.tsx`; `frontend/src/features/documents/components/documents.css`; `frontend/src/features/documents/tests/api.test.ts`; `frontend/src/features/documents/tests/DocumentUploadPanel.test.tsx`; `frontend/src/features/documents/tests/DocumentList.test.tsx`; `frontend/src/features/documents/tests/recovery.test.ts`; `tasks/frontend/FE-013-implement-upload-completion-realtime-recovery-document-list-download.md`; `AI_USAGE.md`.
- Commands run: `cd frontend && npm ci` (restored missing locked dependencies); `cd frontend && npm test -- --run src/features/documents src/realtime` (failed before install; passed after implementation, 5 files/16 tests); `cd frontend && npm run typecheck` (passed); `python3 scripts/check_simplicity.py frontend/src` (passed); `cd frontend && npx prettier --write src/auth/api.ts src/realtime src/features/documents` (targeted formatting); `python3 scripts/validate_docs.py` (failed on unrelated task-doc issues after generated dependency cleanup).
- Result: Implemented upload completion with idempotency, one-time WebSocket ticket connection/reconnect, safe event validation, upload polling/reconnect recovery, document list/download/revoke UI, and focused state/security tests.
- Deviations/questions: The existing FE-012 client expected a nested upload initiation response while the backend publishes a flattened response. The FE-013 API adapter now normalizes both shapes so prior frontend fixtures and real backend responses are supported. Docs validation remains blocked outside this task by task-doc issues including `tasks/frontend/FE-013.07-implement-user-invitation-acceptance-page.md` being empty; an earlier validator run also reported invalid decimal-ID headings in unrelated BE-026.5, BE-026.75, and FE-013.5 task files.
