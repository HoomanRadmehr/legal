# BE-021: Implement upload completion, processing, document list/download

Status: TODO
Priority: P0
Area: Backend
Related specs: BE-007
Depends on: BE-020, BE-018, BE-019

## Goal

Verify direct uploads from MinIO, create available Document metadata asynchronously, and issue audited download URLs.

## Allowed scope

- `backend/apps/documents/`
- `backend/common/storage/`
- `backend/apps/documents/tests/`

## Required reading

- `AGENTS.md`
- `backend/AGENTS.md` 
- `specs/backend/BE-007-documents-uploads.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Create Document model.
2. Implement idempotent complete service with exact state/key/expiry/stat/size/content checks.
3. Schedule worker after commit; worker re-verifies and marks available/failed.
4. Implement permission-scoped document list/detail.
5. Implement audited short-lived download URL and revoke action.
6. Implement expired session cleanup job.

## Acceptance criteria

- [ ] Client completion claims are never trusted.
- [ ] Document is downloadable only when available.
- [ ] Download URL is never logged/activity-stored.
- [ ] Cleanup cannot remove available documents.
- [ ] Duplicate completion is safe and conflicting replay fails.

## Verification commands

```bash
cd backend && python -m pytest apps/documents/tests -q
```

## Out of scope

- Antivirus/OCR or real content extraction.

## Codex execution log

- Started:
- Completed:
- Files changed:
- Commands run:
- Result:
- Deviations/questions:
