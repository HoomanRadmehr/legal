# FE-026: Implement direct document upload to MinIO

Status: DONE
Priority: P0
Area: Frontend
Related specs: FE-001, FE-002, FE-008, FE-011, FE-012
Depends on: FE-002, FE-003, FE-006, FE-013, BE-039

## Goal

Replace the current session-based frontend document upload flow with a simple direct-to-MinIO upload.

The frontend must:

1. Request a presigned URL from the backend.
2. Upload the file directly from the browser to MinIO.
3. Track byte progress locally in the browser.
4. Call the backend complete action only after MinIO confirms upload success.
5. Listen for backend verification and availability events.
6. Fall back to polling when WebSocket delivery is unavailable.
7. Never send file bytes through the Django API.

## Architecture

```text
User chooses file
    ↓
Frontend validates basic metadata
    ↓
POST /api/v1/documents/presign/
    ↓
Receive Document ID and presigned upload data
    ↓
Browser uploads directly to MinIO
    ↓
Browser displays local byte progress
    ↓
POST /api/v1/documents/{id}/complete/
    ↓
Backend verifies object
    ↓
WebSocket or polling reports available/failed
```

## Important distinction

Use two status sources:

### Browser-controlled upload state

```text
preparing
uploading
upload_progress
uploaded_to_storage
```

These come from the browser upload request.

### Backend-controlled Document state

```text
pending_upload
verifying
available
failed
expired
cancelled
```

These come from backend responses, WebSocket events, or polling.

Do not show backend-generated percentages for direct MinIO upload.

## Routes and placement

Use the existing document UI locations.

Do not create a generic upload application.

Extend the existing feature structure:

```text
frontend/src/features/documents/
├── api.ts
├── upload.ts
├── types.ts
├── schemas.ts
├── components/
│   ├── DocumentUploadForm.tsx
│   └── DocumentUploadProgress.tsx
├── hooks/
│   └── useDirectDocumentUpload.ts
└── tests/
```

Keep the hook explicit and specific to document upload.

Do not create:

```text
UploadEngine
StorageProvider
UploadStrategy
GenericUploadManager
FileTransferBase
UploadComponentFactory
```

## Presign request

Call:

```text
POST /api/v1/documents/presign/
```

Send:

```json
{
  "matter_id": "matter-uuid",
  "filename": "contract.pdf",
  "content_type": "application/pdf",
  "size": 245789,
  "checksum_sha256": "optional",
  "description": "Signed contract"
}
```

Required header:

```text
Idempotency-Key: <uuid>
```

Do not send:

```text
organization_id
bucket
object_key
status
uploaded_by
file bytes
base64
multipart form data
```

## Direct upload implementation

Support exactly the backend-selected method.

### When backend returns presigned POST

Construct `FormData` containing:

1. all returned policy fields;
2. the file as the final field when required by MinIO/S3 policy behavior.

Send directly to the returned MinIO URL.

### When backend returns presigned PUT

Send the raw File directly to the returned URL with only the required returned headers.

Do not support both methods dynamically unless the backend contract explicitly requires both.

Prefer one clear implementation.

## Upload progress

Use an API that provides browser upload progress, such as:

* `XMLHttpRequest`;
* the project's existing HTTP library when it exposes reliable upload progress.

Native `fetch` does not provide standard upload-progress events in all supported browsers.

Do not add a large upload library only for progress.

Progress calculation:

```text
loaded bytes / total bytes × 100
```

Requirements:

1. Progress is local component state.
2. Progress is not stored as authoritative server state.
3. Progress never exceeds 100.
4. Reaching 100 means bytes were sent to MinIO, not that the Document is available.
5. After direct upload succeeds, display a verifying state until backend completion succeeds.
6. Do not publish browser progress through the application's WebSocket.
7. Do not send a progress request to Django for every percentage change.

## Complete action

After MinIO returns a successful response, call:

```text
POST /api/v1/documents/{document_id}/complete/
```

Request:

```json
{}
```

Do not send:

```text
object_key
bucket
organization_id
size as authority
content type as authority
file contents
```

The backend verifies the actual MinIO object.

The UI must not show the Document as available until the backend confirms `available`.

## Realtime behavior

Subscribe only through the existing authorized WebSocket infrastructure.

Listen for:

```text
document.upload.status_changed
```

Expected statuses:

```text
verifying
available
failed
expired
```

Requirements:

1. Validate the event shape.
2. Match events by Document ID.
3. Ignore events for unrelated Documents.
4. Do not trust event organization or permission claims as authorization.
5. Use the event only to refresh current backend state.
6. Do not place presigned URLs in WebSocket messages.
7. Do not store WebSocket tickets or JWTs in logs.

## Polling fallback

When:

* WebSocket is disconnected;
* an event may have been missed;
* the page reloads during verification;

poll the existing permission-scoped Document detail endpoint.

Use bounded polling, for example:

```text
every 2–5 seconds
stop when status is available, failed, expired or cancelled
stop after a configured timeout
```

Do not create a generic polling framework.

Do not poll while the browser is still uploading bytes directly to MinIO unless needed for another existing feature.

## Refresh and recovery

After page refresh:

1. Pending upload byte progress cannot be reconstructed unless browser upload is still active.
2. Reload the Document status from the backend.
3. If status is `pending_upload` and no active browser request exists:

   * show that the upload was interrupted;
   * allow the User to restart by creating a new presign request when permitted.
4. If status is `verifying`, resume WebSocket listening and polling fallback.
5. If status is `available`, show normal Document state.
6. If status is `failed` or `expired`, show safe retry guidance.

Do not persist the presigned URL to:

```text
localStorage
sessionStorage
IndexedDB
Redux
TanStack Query persistence
URL query parameters
```

## Cancellation

When the browser upload is active:

* allow local request cancellation when supported;
* cancelling the browser request stops sending bytes;
* do not claim the MinIO object was removed unless the backend confirms cleanup.

A backend cancel action is optional and should be used only if already defined.

Otherwise, expired pending-object cleanup remains a backend responsibility.

## Client-side validation

Before requesting a presign URL, perform basic UX validation for:

```text
filename
extension
content type
file size
description length
```

Backend validation remains authoritative.

Do not rely on browser MIME type for security.

Do not inspect file contents unless explicitly required by a separate approved task.

## Checksum

When checksum support is enabled by the backend:

1. Use a small browser-safe SHA-256 implementation already available through the Web Crypto API.
2. Do not add a cryptography dependency.
3. Calculate the checksum before presign only when file-size and performance rules allow.
4. Show a preparing state while calculating.
5. Allow the backend contract to make checksum optional.

Do not implement encryption or custom cryptographic protocols.

## Error handling

Handle these stages separately:

### Presign errors

```text
invalid_input
authentication_required
permission_denied
resource_not_found
idempotency_conflict
rate_limit_exceeded
storage_unavailable
```

### Direct MinIO errors

Handle:

```text
network failure
CORS failure
presigned URL expired
403 signature failure
5xx storage error
browser cancellation
```

Do not display raw XML MinIO error bodies.

Map them to safe localized messages.

### Complete errors

```text
upload_expired
upload_object_missing
upload_size_mismatch
upload_content_type_mismatch
upload_checksum_mismatch
upload_verification_failed
rate_limit_exceeded
storage_unavailable
```

### Realtime errors

Handle:

```text
socket disconnected
missed event
polling timeout
permission revoked
Document unavailable
```

## Retry behavior

Retries must be explicit.

### Before bytes are uploaded

The User may request a new presigned upload.

### During direct upload failure

Do not reuse an expired or rejected presigned URL.

Request a new presign response.

### After MinIO success but complete failure

When the failure may be temporary:

* retry the complete action for the same Document;
* do not re-upload the file immediately;
* rely on backend idempotency.

When backend reports a permanent verification failure:

* show the failure;
* allow a new upload from the beginning.

Do not automatically retry indefinitely.

## API functions

Add small explicit functions:

```typescript
async function createDocumentPresign(
  input: CreateDocumentPresignInput,
  idempotencyKey: string,
): Promise<CreateDocumentPresignResponse> {
  // ...
}
```

```typescript
async function completeDocumentUpload(
  documentId: string,
): Promise<DocumentSummary> {
  // ...
}
```

```typescript
function uploadFileDirectlyToMinio(
  upload: PresignedUpload,
  file: File,
  onProgress: (percentage: number) => void,
  signal?: AbortSignal,
): Promise<void> {
  // ...
}
```

Keep them small and explicit.

Do not create API service classes.

## Hook behavior

A specific hook may coordinate the flow:

```typescript
function useDirectDocumentUpload() {
  // ...
}
```

The hook should expose a small state shape:

```text
status
progress
document
error
startUpload
cancelUpload
retry
reset
```

Keep status as a simple discriminated union or canonical string union.

Do not build a generic state machine library.

Do not add XState or another workflow dependency.

## UI states

Support:

```text
idle
preparing
requesting_presign
uploading
uploaded_to_storage
completing
verifying
available
failed
expired
cancelled
```

Each state must have localized Persian and English text.

Do not use translated strings as program state.

## Security requirements

1. Never send file bytes to Django.
2. Never store presigned URLs persistently.
3. Never log presigned URLs.
4. Never log MinIO policy fields.
5. Never log authorization headers.
6. Never log JWTs or refresh cookies.
7. Never expose MinIO credentials.
8. Never let the User edit the object key.
9. Never trust frontend role state as authorization.
10. Never display raw MinIO XML or stack traces.
11. Never use wildcard credentials in browser requests.
12. Never attach Django Authorization headers to MinIO requests.
13. Never attach cookies to MinIO unless explicitly required and approved.
14. MinIO request credentials mode should follow the presigned contract, normally without application cookies.

## Localization and RTL

Provide Persian and English text for:

```text
select file
file selected
preparing
calculating checksum
requesting upload permission
uploading
upload percentage
uploaded to storage
verifying
available
failed
expired
cancelled
retry
cancel
remove
download
permission denied
file too large
unsupported type
upload URL expired
storage unavailable
network failure
verification failed
```

Persian is RTL.

File names, MIME types, checksums, UUIDs, percentages and technical error codes may use localized LTR containers where appropriate.

Do not translate canonical backend statuses before sending requests.

## Accessibility

1. File input has an accessible label.
2. Upload progress uses an accessible progress bar.
3. Progress includes textual percentage.
4. State changes are announced through an approved live region.
5. Cancel and retry buttons have clear labels.
6. Keyboard-only upload is possible.
7. Failure states do not rely only on color.
8. Focus moves safely after errors and completion.
9. RTL does not reverse the semantic order of progress information.

## Allowed scope

* Frontend documents feature
* Document API functions and types
* Direct MinIO upload helper
* Document upload hook
* Upload form and progress UI
* WebSocket status handling
* Polling fallback
* Persian and English translations
* Document upload tests
* Relevant frontend specifications
* `INT-004` dependency documentation

Do not modify unrelated legal pages.

## Acceptance criteria

* [x] Frontend requests a presigned upload from Django.
* [x] Frontend uploads bytes directly to MinIO.
* [x] Django never receives the file body.
* [x] Frontend never sends multipart file data to the Django API.
* [x] Upload progress is calculated locally in the browser.
* [x] Progress reaches 100 only for byte transfer, not backend availability.
* [x] Frontend calls complete only after MinIO upload success.
* [x] Frontend never sends object key in the complete request.
* [x] Document is not shown as available before backend confirmation.
* [x] Verifying status is displayed.
* [x] Available status is displayed.
* [x] Failed and expired statuses are displayed safely.
* [x] WebSocket events are matched by Document ID.
* [x] Polling recovers missed WebSocket events.
* [x] Refresh during verification recovers current backend status.
* [x] Interrupted direct upload does not falsely resume.
* [x] Retry requests a new presigned URL when required.
* [x] Temporary complete failure can retry completion without re-uploading.
* [x] Presigned URLs are not persisted.
* [x] Presigned URLs are not logged.
* [x] MinIO credentials are never exposed.
* [x] Application JWT is not sent to MinIO.
* [x] MinIO errors are mapped to safe messages.
* [x] `429` uses `Retry-After`.
* [x] Persian and English text exists.
* [x] Persian UI is RTL.
* [x] Upload UI is keyboard accessible.
* [x] Components are function components.
* [x] Functions remain small.
* [x] No inheritance, upload engine, strategy class, generic state machine, generic upload framework or service class is introduced.

## Required tests

Add behavior tests for:

1. Valid file selection.
2. Invalid extension.
3. Invalid MIME type.
4. Oversized file.
5. Presign request payload.
6. Presign idempotency header.
7. Organization not submitted.
8. Object key not submitted.
9. File body not sent to Django.
10. Presigned POST direct upload.
11. Or presigned PUT direct upload, according to the selected contract.
12. Required MinIO fields or headers.
13. Django Authorization header absent from MinIO request.
14. Browser cookies absent from MinIO request when not required.
15. Local upload progress.
16. Progress never exceeds 100.
17. MinIO success triggers complete action.
18. MinIO failure does not call complete.
19. Complete request contains no object key.
20. Complete success.
21. Verifying state.
22. WebSocket available event.
23. WebSocket failure event.
24. Unrelated WebSocket event ignored.
25. Socket disconnect polling fallback.
26. Page reload during verification.
27. Interrupted pending upload recovery.
28. Presigned URL expiration.
29. CORS or network failure.
30. MinIO 403 mapped safely.
31. Raw MinIO XML not displayed.
32. Temporary complete retry.
33. Permanent verification failure.
34. Rate-limit response.
35. `Retry-After` guidance.
36. Cancel active browser upload.
37. Presigned URL absent from localStorage.
38. Presigned URL absent from sessionStorage.
39. Presigned URL absent from logs.
40. JWT absent from MinIO request.
41. English labels.
42. Persian labels.
43. Persian RTL.
44. Accessible progress bar.
45. Keyboard operation.
46. No duplicate completion call.
47. No false available state.

## Verification commands

```bash
cd frontend && npm run lint
cd frontend && npm run typecheck
cd frontend && npm run test -- --run
cd frontend && npm run build
docker compose run --rm api-test python -m pytest tests/integration/test_documents.py -q
python3 scripts/check_simplicity.py frontend
python3 scripts/validate_docs.py
```

## Out of scope

* Uploading file bytes through Django.
* Multipart Django upload endpoints.
* Chunked uploads.
* Resumable multipart uploads.
* Persisting browser upload progress.
* Server-generated direct-upload percentage.
* Generic upload engine.
* Multiple storage providers.
* Client-selected object keys.
* Public MinIO buckets.
* OCR.
* Antivirus scanning unless already supported.
* Document text extraction.
* Qdrant.
* Background synchronization of every percentage update.

## Codex execution log

* Started: 2026-07-15 20:17 +0330
* Completed: 2026-07-15 20:30 +0330
* Files changed:
  * `frontend/src/features/documents/api.ts`
  * `frontend/src/features/documents/upload.ts`
  * `frontend/src/features/documents/types.ts`
  * `frontend/src/features/documents/hooks.ts`
  * `frontend/src/features/documents/queryKeys.ts`
  * `frontend/src/features/documents/components/DocumentUploadPanel.tsx`
  * `frontend/src/features/documents/components/DocumentUploadProgress.tsx`
  * `frontend/src/features/documents/components/DocumentList.tsx`
  * `frontend/src/features/documents/components/documents.css`
  * `frontend/src/features/documents/text.ts`
  * `frontend/src/features/documents/tests/api.test.ts`
  * `frontend/src/features/documents/tests/DocumentUploadPanel.test.tsx`
  * `frontend/src/features/documents/tests/DocumentList.test.tsx`
  * `frontend/src/features/documents/tests/recovery.test.ts`
  * `frontend/src/realtime/events.ts`
  * `frontend/src/realtime/client.test.ts`
  * `frontend/src/app/App.test.tsx`
  * `tasks/integration/INT-004-verify-document-upload-and-realtime-recovery.md`
* Commands run:
  * `cd frontend && npm ci` - passed, 371 packages installed from the lockfile with 0 reported vulnerabilities.
  * `cd frontend && npm run lint` - passed.
  * `cd frontend && npm run typecheck` - initially failed on FE-026 type issues, passed after fixes.
  * `cd frontend && npm run format:check` - failed on pre-existing formatting differences across unrelated frontend files; not used as a required acceptance command.
  * `cd frontend && npx prettier --write ...` on FE-026-touched frontend files - passed.
  * `cd frontend && npm test -- --run src/features/documents src/realtime/client.test.ts` - initially failed on checksum fallback and label expectations, passed after fixes, 22 tests.
  * `python3 scripts/check_simplicity.py frontend/src/features/documents frontend/src/realtime` - initially failed on `DirectUploadError extends Error`; passed after replacing it with a plain typed error factory, 23 files.
  * `python3 scripts/check_simplicity.py frontend` - passed, 252 source files.
  * `cd frontend && npm run test -- --run` - passed, 47 files and 178 tests.
  * `cd frontend && npm run build` - passed with the existing Vite large chunk warning.
  * `docker compose run --rm api-test python -m pytest tests/integration/test_documents.py -q` - passed, 3 tests.
  * `python3 scripts/validate_docs.py` - initially failed because `npm ci` generated `frontend/node_modules` Markdown files; passed after removing generated `frontend/node_modules` and `frontend/dist`, 27 specs, 72 tasks, 182 Markdown files.
  * `git diff --check` - passed.
* Result: DONE. The documents feature now uses `POST /documents/presign/`, direct browser-to-MinIO PUT with local XHR progress and no app credentials, `POST /documents/{id}/complete/` after storage success, Document detail polling fallback, and realtime status matching by `document_id`.
* Deviations/questions:
  * Implemented the backend-selected presigned PUT path only. Presigned POST remains out of scope unless the backend contract adds it.
  * Checksum calculation uses Web Crypto when available and falls back to an empty optional checksum when unsupported.
  * Removed generated `frontend/node_modules` and `frontend/dist` before docs validation so repository docs validation ignores vendored package Markdown and generated build output.
