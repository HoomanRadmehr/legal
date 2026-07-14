# BE-007: Documents, presigned uploads, and downloads

- Status: Approved
- Priority: P0
- Requirements: ASSIGN-007, ARCH-007, BR-022 through BR-027
- Depends on: BE-002, BE-008, BE-009 contract

## Intent

Store private legal documents in MinIO through short-lived direct uploads while keeping authorization, metadata, completion verification, audit, and status under Django control.

## API

```text
POST /api/v1/documents/uploads/
GET  /api/v1/documents/uploads/{id}/
POST /api/v1/documents/uploads/{id}/complete/
POST /api/v1/documents/uploads/{id}/cancel/
GET  /api/v1/documents/
GET  /api/v1/documents/{id}/
POST /api/v1/documents/{id}/download-url/
POST /api/v1/documents/{id}/revoke/
```

## Upload initiation

Input: matter ID, original filename, content type, size, optional checksum, optional description.

Checks:

- active authenticated membership;
- edit permission on matter;
- file extension/content type allowlist;
- positive size below configured maximum;
- initiation throttle and active-session limit;
- organization/matter consistency.

Output: upload ID, status, expiry, method, short-lived URL, required headers/form fields, completion endpoint, polling endpoint.
The URL is not stored and not logged.

## Completion

Requires `Idempotency-Key`.
The backend performs MinIO stat/metadata checks against the persisted session.
It does not trust client size, key, or successful upload claim.
Valid completion transitions to verification/processing and schedules a worker after commit.

## Processing

The worker:

1. Reloads the session with safe state check.
2. Re-verifies object metadata.
3. Executes documented file validation hook.
4. Creates one Document or marks failure.
5. Writes activity and outbox status event.
6. Makes the document downloadable only when status is `available`.

## Download

A permission-scoped selector resolves Document through Matter.
The service audits the request and returns a short-lived GET URL.
No URL appears in activity metadata or logs.

## Rate limits and errors

- Upload initiate and complete have separate throttles.
- `upload_policy_violation` - `422` or `413` for size.
- `upload_expired` - `409`.
- `upload_state_conflict` - `409`.
- `upload_object_missing` - retry-safe `409` or `422` according to implementation documentation.
- `upload_object_mismatch` - `422`.
- `document_not_available` - `409`.

## Acceptance criteria

- [ ] Upload URL is issued only for an editable visible matter.
- [ ] Key is generated and not derived from unsafe filename text.
- [ ] Completion verifies exact key, object existence, size, state, and expiry.
- [ ] Completion is idempotent for the same request/key and rejects conflicting replay.
- [ ] Document becomes downloadable only after available status.
- [ ] Download checks matter permission and creates an activity record without storing the URL.
- [ ] Expired sessions are cleaned safely and available documents are never deleted by cleanup.
- [ ] Status changes create user-safe realtime events.
- [ ] MinIO bucket remains private.

## Required tests

- Permission and cross-organization initiate/download.
- Oversize/disallowed type/rate limit.
- Missing/wrong-size/wrong-key/expired object.
- Duplicate completion.
- Worker success/failure.
- URL/log redaction.
- Cleanup safety.

## OpenAPI ownership

`apps/documents/api/v1/openapi.py`

## Related tasks

- BE-020, BE-021, BE-022
