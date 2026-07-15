# BE-007: Documents, presigned uploads, and downloads

- Status: Approved
- Priority: P0
- Requirements: ASSIGN-007, ARCH-007, BR-022 through BR-027
- Depends on: BE-002, BE-008, BE-009 contract

## Intent

Store private legal documents in MinIO through short-lived direct uploads while keeping authorization, metadata, completion verification, audit, and status under Django control.

## API

```text
POST /api/v1/documents/presign/
GET  /api/v1/documents/
GET  /api/v1/documents/{id}/
POST /api/v1/documents/{id}/complete/
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
- initiation throttle and active pending-document limit;
- organization/matter consistency.

Output: pending document ID, status, expiry, method, short-lived URL, and required headers.
The URL is not stored and not logged.
The frontend cannot submit bucket, organization, object key, upload status, uploader, or MinIO credentials.

## Completion

The backend performs MinIO stat/metadata checks against the pending Document.
It does not trust client size, key, or successful upload claim.
Valid completion transitions through `verifying` to `available`.
The backend does not receive a file body.

## Direct upload status

The Document itself is the upload intent.
Status changes:

1. `pending_upload` after presign.
2. `verifying` during completion.
3. `available` after MinIO object verification.
4. `failed`, `expired`, or `cancelled` for unsafe terminal states.

Every status event uses backend-owned document identifiers and omits presigned URLs and storage credentials.

## Download

A permission-scoped selector resolves Document through Matter.
The service audits the request and returns a short-lived GET URL.
No URL appears in activity metadata or logs.

## Rate limits and errors

- Upload initiate and complete have separate throttles.
- `invalid_input` - `422` for unsupported names/types/checksums.
- `upload_size_exceeded` - `413`.
- `upload_expired` - `409`.
- `upload_state_conflict` - `409`.
- `upload_object_missing` - retry-safe `409`.
- `upload_size_mismatch`, `upload_content_type_mismatch`, `upload_checksum_mismatch` - `409`.
- `document_not_available` - `409`.

## Acceptance criteria

- [ ] Upload URL is issued only for an editable visible matter.
- [ ] Key is generated and not derived from unsafe filename text.
- [ ] Completion verifies exact key, object existence, size, state, and expiry.
- [ ] Presign is idempotent and completion safely replays available documents.
- [ ] Document becomes downloadable only after available status.
- [ ] Download checks matter permission and creates an activity record without storing the URL.
- [ ] Expired pending documents are cleaned safely and available documents are never deleted by cleanup.
- [ ] Status changes create user-safe realtime events.
- [ ] MinIO bucket remains private.

## Required tests

- Permission and cross-organization initiate/download.
- Oversize/disallowed type/rate limit.
- Missing/wrong-size/wrong-key/expired object.
- Duplicate completion.
- URL/log redaction.
- Cleanup safety.

## OpenAPI ownership

`apps/documents/api/v1/openapi.py`

## Related tasks

- BE-020, BE-021, BE-022, BE-039, BE-040, BE-042
