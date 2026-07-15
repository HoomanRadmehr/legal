# FE-028: Add document creation and direct-upload UI

Status: DONE
Priority: P0
Area: Frontend
Related specs: FE-002, FE-008, FE-011, FE-012
Depends on: FE-002, FE-003, FE-006, FE-013, FE-026, FE-027, BE-039, BE-042

## Goal

Add a clear and accessible document-upload entry point to the Documents page.

The User must be able to:

1. See an **Upload document** action when permitted.
2. Open a dedicated document-upload page.
3. Select the related legal Matter.
4. Select a local file.
5. Enter optional document metadata.
6. Upload the file directly from the browser to MinIO using the existing presigned-upload flow.
7. See local upload progress.
8. See backend verification status.
9. Return to the Documents list after successful completion.
10. See the newly created Document in the list.

The Django backend must never receive file bytes.

## Product terminology

In this system, creating a Document means:

```text
Creating the Document metadata
+
Uploading its file directly to MinIO
```

Do not create an empty available Document without a file.

The backend creates the pending Document record when the frontend requests the presigned upload URL.

## Routes

Documents list:

```text
/documents
```

Document-upload page:

```text
/documents/new
```

Optional preselected Matter:

```text
/documents/new?matter_id=<matter-uuid>
```

The query parameter may preselect a Matter only when that Matter exists in the permission-scoped choices returned by the backend.

Do not trust the query parameter as authorization.

## Documents-page changes

Add a primary action:

```text
Upload document
```

Persian label:

```text
بارگذاری سند
```

Placement:

* page header on desktop;
* clearly accessible action on mobile;
* visible near the Documents page title;
* not hidden inside an unrelated menu.

The action navigates to:

```text
/documents/new
```

## Permission behavior

The frontend may hide or disable the action using the current User's known permissions.

However, the backend remains authoritative.

Requirements:

1. Legal Admin can see the action when document upload is allowed.
2. Legal Manager can see the action when document upload is allowed.
3. Legal Counsel can see the action only when their current permissions allow document upload.
4. Viewer must not see the action.
5. Direct navigation to `/documents/new` by an unauthorized User must show the existing forbidden state.
6. Losing permission before presign or completion must be handled safely.
7. Do not infer access only from the selected Matter label.
8. Do not store permission authority in localStorage or sessionStorage.

Use the project's existing explicit permission helpers.

Do not create a frontend permission framework.

## Feature structure

Extend the existing Documents feature:

```text
frontend/src/features/documents/
├── api.ts
├── upload.ts
├── types.ts
├── schemas.ts
├── hooks/
│   └── useDirectDocumentUpload.ts
├── components/
│   ├── DocumentUploadForm.tsx
│   ├── DocumentUploadProgress.tsx
│   └── DocumentUploadResult.tsx
├── pages/
│   ├── DocumentsPage.tsx
│   └── CreateDocumentPage.tsx
└── tests/
    ├── DocumentsPage.test.tsx
    └── CreateDocumentPage.test.tsx
```

Reuse the direct-upload implementation from `FE-026`.

Reuse the asynchronous Matter dropdown from `FE-027`.

Do not duplicate the MinIO upload workflow.

## Upload form fields

Required fields:

```text
matter
file
```

Optional fields:

```text
description
document_type
```

Use `document_type` only when the backend already supports a canonical document-type field.

Do not invent a new backend enum in this task.

The form must not contain:

```text
organization_id
bucket
object_key
status
uploaded_by
uploaded_at
MinIO credentials
access key
secret key
presigned URL input
```

## Matter field

Use:

```text
GET /api/v1/matters/choices/?purpose=document_upload
```

The Matter selector must:

1. Be searchable.
2. Use infinite scroll.
3. Load only permission-scoped choices.
4. Submit only the selected `matter_id`.
5. Show Matter title.
6. Show reference code as secondary text.
7. Show a localized Matter-kind label where helpful.
8. Support Persian RTL.
9. Display reference codes in an LTR container.
10. Not allow arbitrary UUID input.

When `matter_id` exists in the URL:

1. Attempt to load or resolve it through the approved choice API.
2. Preselect it only when the backend returns it as permitted.
3. Otherwise leave the field empty and show a safe unavailable-Matter message.
4. Do not expose whether an unauthorized Matter exists.

## File field

The file input must:

1. Use the native browser File API.
2. Allow one file per upload.
3. Display the selected filename.
4. Display formatted file size.
5. Display detected browser MIME type.
6. Allow removing the selected file before upload starts.
7. Prevent changing the file while an upload is active.
8. Support keyboard access.
9. Have a clear accessible label.
10. Use the backend-supported file-type and size rules.

Client-side validation is for UX only.

Backend validation remains authoritative.

## Upload flow

Use the existing direct-upload flow:

```text
Select Matter and file
    ↓
Validate form
    ↓
Request presigned upload from Django
    ↓
Upload bytes directly to MinIO
    ↓
Call Django complete action
    ↓
Wait for verifying/available status
    ↓
Refresh Documents list
```

### Presign request

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
  "checksum_sha256": "optional-value",
  "description": "Signed agreement"
}
```

Send an `Idempotency-Key`.

Do not send the file body to Django.

### MinIO upload

Upload directly to the presigned MinIO URL.

Do not attach:

```text
Django Authorization header
JWT
refresh cookie
organization ID
application cookies
```

Use only the MinIO fields or headers returned by the backend.

### Complete action

After successful MinIO upload, call:

```text
POST /api/v1/documents/{document_id}/complete/
```

Do not include:

```text
object_key
bucket
file bytes
organization ID
```

The backend verifies the actual object.

## Form submission states

Use these explicit states:

```text
idle
validating
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

Do not use translated text as internal state.

Do not add a workflow or state-machine library.

Use the existing `useDirectDocumentUpload` hook.

## Upload progress

Show browser-observed byte progress during the direct MinIO request.

Display:

```text
percentage
uploaded bytes
total bytes
current state
```

Requirements:

1. Progress must never exceed 100%.
2. Reaching 100% means the browser sent the bytes to MinIO.
3. Reaching 100% does not mean the Document is available.
4. After byte upload, show:

```text
در حال بررسی فایل
```

until the backend confirms availability.

5. Do not send percentage updates to Django.
6. Do not send percentage updates through WebSocket.
7. Use an accessible progress bar.

## Realtime and polling

After calling complete:

1. Listen for the existing document status WebSocket event.
2. Match the event by `document_id`.
3. Ignore unrelated events.
4. Refresh Document state after receiving an event.
5. Use polling fallback when WebSocket is unavailable.
6. Stop polling when status becomes:

   * available;
   * failed;
   * expired;
   * cancelled.
7. Do not treat a WebSocket event as authorization.
8. Backend REST state remains authoritative.

## Success behavior

When the Document becomes `available`:

1. Show a localized success state.
2. Invalidate the Documents list query.
3. Invalidate relevant Matter-document queries.
4. Clear file and form state.
5. Provide actions:

```text
View document
Back to documents
Upload another document
```

6. The default primary action should navigate to the Document detail page when it exists.
7. Otherwise navigate to:

```text
/documents
```

8. The new Document must appear in the refreshed list.

Do not claim success before backend verification.

## Failure behavior

Handle failures by stage.

### Form validation

Examples:

```text
Matter is required
File is required
Unsupported file type
File is too large
Description is too long
```

### Presign failure

Handle:

```text
authentication_required
permission_denied
resource_not_found
invalid_input
idempotency_conflict
rate_limit_exceeded
storage_unavailable
```

### Direct MinIO failure

Handle:

```text
network error
CORS error
expired presigned URL
signature rejection
storage error
browser cancellation
```

Do not display raw MinIO XML.

### Completion failure

Handle:

```text
upload_expired
upload_object_missing
upload_size_mismatch
upload_content_type_mismatch
upload_checksum_mismatch
upload_verification_failed
storage_unavailable
```

### Realtime failure

Handle:

```text
WebSocket disconnected
missed event
polling timeout
permission revoked
Document unavailable
```

## Retry behavior

### Presign failed before upload

Allow retry with the same form data.

Use the idempotency behavior defined by the direct-upload implementation.

### Direct upload failed

Request a new presigned URL when the current one may be expired or rejected.

Do not persist or indefinitely reuse the previous URL.

### MinIO upload succeeded but complete failed temporarily

Retry only the complete action for the same Document.

Do not immediately re-upload the file.

### Permanent verification failure

Show the backend failure safely.

Allow starting a new upload.

Do not silently change a failed Document to available.

## Cancellation

During browser-to-MinIO upload:

1. Provide a Cancel action.
2. Abort the local browser request.
3. Set the frontend state to cancelled.
4. Do not claim the MinIO object was deleted.
5. Leave backend cleanup to the approved expiration or cleanup process.
6. Allow the User to start a fresh upload.

Do not add a cancel endpoint unless the backend already provides one.

## Documents list integration

The Documents page must include:

1. Page title.
2. Upload document action.
3. Existing search and filters.
4. Loading state.
5. Empty state.
6. Error state.
7. Documents list or table.
8. Safe status labels.
9. Clear indication of pending or verifying Documents if they are intentionally returned by the list API.

When no Documents exist, the empty state should contain:

```text
No documents have been uploaded.
Upload document
```

Persian:

```text
هنوز سندی بارگذاری نشده است.
بارگذاری سند
```

The empty-state action follows the same permission rule as the page-header action.

## Localization

Provide English and Persian text for:

```text
documents
upload document
new document
select legal matter
search legal matters
select file
choose file
remove file
description
document type
file name
file size
preparing
requesting upload permission
uploading
uploaded to storage
completing
verifying
available
failed
expired
cancelled
retry
cancel
upload another
view document
back to documents
permission denied
file too large
unsupported file type
upload URL expired
storage unavailable
network error
verification failed
no documents
```

Persian is RTL.

Use local LTR direction for:

```text
filenames when necessary
MIME types
reference codes
UUIDs
checksums
percentages when layout requires it
```

Do not translate canonical status or API values before sending them.

## Accessibility

1. The page must have one clear heading.
2. Form labels must be associated with controls.
3. File input must work with keyboard navigation.
4. Matter dropdown must work with keyboard navigation.
5. Progress must use an accessible progress-bar role.
6. Progress state changes must be announced.
7. Errors must be connected to relevant fields.
8. The first invalid field should receive focus after validation failure.
9. Cancel and retry actions must have clear labels.
10. Status must not rely only on color.
11. Success and failure messages must use an approved live region.
12. RTL must not break focus order.

## Security requirements

1. File bytes must never be sent to Django.
2. Presigned URLs must not be stored in localStorage.
3. Presigned URLs must not be stored in sessionStorage.
4. Presigned URLs must not be added to route parameters.
5. Presigned URLs must not be logged.
6. JWTs must not be sent to MinIO.
7. Refresh cookies must not be sent to MinIO.
8. MinIO credentials must never be visible.
9. User cannot edit object key.
10. User cannot choose organization.
11. User cannot mark a Document available.
12. Raw storage errors must not be displayed.
13. Frontend permission state is not authoritative.
14. Documents query cache must be cleared after logout.
15. Do not include file contents or URLs in error-monitoring metadata.

## Simplicity requirements

Do not introduce:

```text
class components
inheritance
higher-order components
generic upload framework
generic form builder
generic CRUD page
schema-driven form
upload strategy classes
storage-provider classes
custom state-machine library
Redux only for upload state
```

Prefer:

```text
small function components
existing direct-upload hook
existing async Matter dropdown
React Hook Form
Zod
TanStack Query
explicit API functions
explicit status rendering
```

Keep functions short and easy to review.

## Allowed scope

* Documents page
* New Document page
* Upload button and empty-state action
* Document upload form
* Existing direct-upload hook integration
* Existing Matter async dropdown integration
* Document query invalidation
* Document upload status UI
* English and Persian translations
* Related frontend tests
* Relevant frontend specification and task references

Do not modify unrelated domains.

## Acceptance criteria

* [ ] Documents page has a visible Upload document action for permitted Users.
* [ ] Viewer does not see the Upload document action.
* [ ] Unauthorized direct navigation is denied safely.
* [ ] `/documents/new` route exists.
* [ ] Form includes Matter and file fields.
* [ ] Matter uses searchable infinite-scroll choices.
* [ ] Matter choices are permission-scoped by the backend.
* [ ] File can be selected and removed before upload.
* [ ] Client validation works.
* [ ] Form submits only approved metadata to Django.
* [ ] File bytes are uploaded directly to MinIO.
* [ ] Django receives no multipart file body.
* [ ] Browser upload progress is displayed.
* [ ] Progress reaching 100 does not show available prematurely.
* [ ] Complete action is called after MinIO success.
* [ ] Document enters verifying state.
* [ ] WebSocket status updates are handled.
* [ ] Polling fallback works.
* [ ] Available status produces a success state.
* [ ] Documents list is refreshed after success.
* [ ] Newly uploaded Document appears in the list.
* [ ] Empty Documents page includes an upload action when permitted.
* [ ] Presign errors are handled safely.
* [ ] MinIO errors are handled safely.
* [ ] Completion errors are handled safely.
* [ ] Raw MinIO XML is not displayed.
* [ ] Retry behavior is stage-aware.
* [ ] Cancel aborts the local upload.
* [ ] Presigned URL is not persisted.
* [ ] JWT and refresh cookies are not sent to MinIO.
* [ ] Persian translations exist.
* [ ] Persian page is RTL.
* [ ] Upload form is accessible.
* [ ] Components are function components.
* [ ] No inheritance or generic upload/form framework is introduced.

## Required tests

Add tests for:

### Documents page

1. Upload action visible for Legal Admin.
2. Upload action visible for permitted Legal Manager.
3. Upload action visible for permitted Legal Counsel.
4. Upload action hidden for Viewer.
5. Upload action links to `/documents/new`.
6. Empty-state upload action.
7. Unauthorized direct navigation.
8. Documents list refresh after upload.

### Form

9. Matter field rendered.
10. File field rendered.
11. Description field rendered.
12. Matter selection.
13. Infinite Matter scrolling.
14. Matter search.
15. URL Matter preselection when permitted.
16. Unauthorized URL Matter not preselected.
17. File selection.
18. File removal.
19. Missing Matter validation.
20. Missing file validation.
21. Invalid type validation.
22. Oversized file validation.

### Direct upload

23. Presign request contains Matter ID.
24. Presign request contains file metadata.
25. Presign request contains idempotency key.
26. Organization ID absent.
27. Object key absent.
28. File body absent from Django request.
29. Direct MinIO request receives file.
30. Django Authorization header absent from MinIO request.
31. Application cookies absent from MinIO request.
32. Local upload progress.
33. Progress never exceeds 100.
34. MinIO success calls complete.
35. MinIO failure does not call complete.
36. Complete request contains no object key.
37. Complete request contains no file bytes.

### Status and recovery

38. Uploaded-to-storage state.
39. Verifying state.
40. WebSocket available event.
41. WebSocket failed event.
42. Unrelated WebSocket event ignored.
43. Polling fallback.
44. Page reload during verification.
45. Successful availability.
46. Query invalidation.
47. Newly uploaded Document displayed.
48. Temporary complete retry.
49. Permanent verification failure.
50. Upload expiration.
51. Cancellation.

### Security and localization

52. Presigned URL absent from localStorage.
53. Presigned URL absent from sessionStorage.
54. Presigned URL absent from logs.
55. JWT absent from MinIO request.
56. Raw MinIO XML not displayed.
57. English translations.
58. Persian translations.
59. Persian RTL.
60. Reference code LTR inside RTL page.
61. Accessible file input.
62. Accessible progress bar.
63. Keyboard-only flow.
64. Status not represented only by color.

## Verification commands

```bash
cd frontend && npm run lint
cd frontend && npm run typecheck
cd frontend && npm run test -- --run
cd frontend && npm run build
python3 scripts/check_simplicity.py frontend
python3 scripts/validate_docs.py
```

After the relevant backend environment is available:

```bash
docker compose run --rm api-test \
  python -m pytest tests/integration/test_documents.py -q
```

## Out of scope

* Backend file proxying.
* Multipart upload to Django.
* Chunked uploads.
* Resumable multipart upload.
* Multiple files in one upload operation.
* Drag-and-drop unless already supported by the approved UI components.
* OCR.
* Antivirus scanning.
* Document editing.
* Document replacement/versioning.
* Public MinIO buckets.
* Generic upload framework.
* Generic form builder.
* Storage-provider abstraction.

## Codex execution log

* Started: 2026-07-15
* Completed: 2026-07-15
* Files changed: `frontend/src/app/routes.tsx`, `frontend/src/features/documents/api.ts`, `frontend/src/features/documents/hooks.ts`, `frontend/src/features/documents/queryKeys.ts`, `frontend/src/features/documents/types.ts`, `frontend/src/features/documents/text.ts`, `frontend/src/features/documents/index.ts`, `frontend/src/features/documents/pages/index.ts`, `frontend/src/features/documents/pages/DocumentsPage.tsx`, `frontend/src/features/documents/pages/CreateDocumentPage.tsx`, `frontend/src/features/documents/components/DocumentList.tsx`, `frontend/src/features/documents/components/DocumentMatterChoiceSelect.tsx`, `frontend/src/features/documents/components/DocumentUploadForm.tsx`, `frontend/src/features/documents/components/DocumentUploadResult.tsx`, `frontend/src/features/documents/components/documents.css`, `frontend/src/features/documents/tests/DocumentsPage.test.tsx`, `frontend/src/features/documents/tests/CreateDocumentPage.test.tsx`, `tasks/frontend/FE-028-implement-document-uploading.md`, `AI_USAGE.md`
* Commands run: `cd frontend && npm ci`; `cd frontend && npm run lint`; `cd frontend && npm run typecheck`; `cd frontend && npm run test -- --run`; `cd frontend && npm run build`; `python3 scripts/check_simplicity.py frontend`; `python3 scripts/validate_docs.py`; `docker compose run --rm api-test python -m pytest tests/integration/test_documents.py -q`
* Result: DONE. Added `/documents/new`, permission-aware upload actions, a document upload form with matter choice lookup, file metadata display/removal, direct MinIO upload integration, backend verification/realtime recovery wiring, localized states, and focused tests. All required verification commands passed.
* Deviations/questions: FE-027 remains blocked and its shared async Matter dropdown is absent, so this task uses a narrow document-scoped Matter choice selector instead of touching the broader FE-027 forms. Generated `frontend/dist` and `frontend/node_modules` were removed after build/test so repository guard scripts scan source and project docs only.
