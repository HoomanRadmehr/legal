# BE-020: Implement MinIO client and upload initiation

Status: TODO
Priority: P0
Area: Backend
Related specs: BE-007
Depends on: BE-012, BE-018, BE-019, BE-010

## Goal

Create private storage client boundaries, UploadSession, and permission/rate-limited presigned initiation.

## Allowed scope

- `backend/common/storage/`
- `backend/apps/documents/models.py`
- `backend/apps/documents/services.py`
- `backend/apps/documents/api/v1/`
- `backend/apps/documents/tests/`

## Required reading

- `AGENTS.md`
- `backend/AGENTS.md` 
- `specs/backend/BE-007-documents-uploads.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Implement small MinIO client functions for stat, presign, and delete abandoned object.
2. Create UploadSession state/fields and explicit transition validation.
3. Implement initiate service with matter edit permission, file policy, size, rate, expiry, random key.
4. Return presigned method/URL/headers/fields without persisting URL.
5. Add status polling endpoint and OpenAPI.

## Acceptance criteria

- [ ] Bucket/public policy is not controlled by request.
- [ ] Object key is UUID-based and filename-safe.
- [ ] Oversize/type/rate violations use stable errors.
- [ ] Presigned URL is not logged or stored.
- [ ] Viewer/cross-org initiate is denied.

## Verification commands

```bash
cd backend && python -m pytest apps/documents/tests -q
```

## Out of scope

- Completion, Document creation, and realtime consumer.

## Codex execution log

- Started:
- Completed:
- Files changed:
- Commands run:
- Result:
- Deviations/questions:
