# FE-007: Document list, presigned upload, realtime status, and download

- Status: Approved
- Priority: P0
- Requirements: ASSIGN-007, ARCH-007
- Depends on: FE-001, FE-002, BE-007, BE-009

## Intent

Allow authorized users to upload directly to MinIO with visible local progress and authoritative backend status, then list/download available documents securely.

## Upload flow

1. User selects a file from a matter's document section.
2. Client validates obvious size/type constraints for immediate feedback.
3. Client calls the document presign endpoint with an idempotency key.
4. Client uploads using the exact method, headers, or form fields returned by backend.
5. Local byte progress is displayed as frontend-only `uploading`; the server does not claim byte progress.
6. Client calls completion for the pending document.
7. UI listens for user event and polls document metadata as fallback.
8. Final status is available or failed with safe explanation.

Do not place presigned URLs in console logs, error telemetry, router state, or persistent storage.

## UI states

- selected;
- initiating;
- uploading with percentage;
- completing;
- verifying;
- available;
- failed;
- expired;
- cancelled.

The frontend does not invent server processing progress. It may show indeterminate state after byte upload reaches 100%.

## Document list/download

- List is matter-scoped or permission-scoped global list.
- Show filename, type, size, uploader, date, description, and status.
- Download action calls backend for a fresh URL and navigates/downloads immediately.
- Do not cache or persist the URL.
- Viewer sees download only when returned/allowed.

## Realtime recovery

- User WebSocket event updates the matching upload status or invalidates query.
- On disconnect, polling continues with bounded backoff.
- On reconnect, refetch pending/active documents and available documents.
- Duplicate events do not regress a final state.

## Acceptance criteria

- [ ] File bytes go directly to returned MinIO URL, not through Django.
- [ ] Client sends only backend-provided upload headers/fields and never storage credentials.
- [ ] Presign uses a stable idempotency key for retries.
- [ ] URL is not persisted or logged.
- [ ] Realtime and polling produce the same final state.
- [ ] Expired/mismatched/failure errors are safe and actionable.
- [ ] Download asks the backend each time and handles unavailable/forbidden states.
- [ ] Viewer cannot see upload controls.

## Required tests

- Initiate/upload/complete success.
- Local progress and server verification/final states.
- WebSocket event and polling fallback.
- URL redaction from logs/storage.
- Expired/failure/429.
- Download behavior and permission controls.

## Related tasks

- FE-012, FE-013
