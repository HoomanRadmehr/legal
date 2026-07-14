# Realtime and upload guardrail

## Realtime purpose

Realtime delivery is for status hints and in-app notifications, not authoritative state.
PostgreSQL and normal REST endpoints remain the source of truth.

## One user stream

Use one authenticated endpoint such as:

```text
/ws/v1/events/?ticket=<one-time-ticket>
```

The server places the connection in `user.<user_id>` only.
Do not expose arbitrary subscription commands.

## Event envelope

```json
{
  "event_id": "uuid",
  "event_type": "document.upload.status_changed",
  "version": 1,
  "occurred_at": "2026-07-14T10:30:00Z",
  "data": {
    "upload_id": "uuid",
    "status": "verifying",
    "progress": 100
  }
}
```

Events must be small, versioned, and contain identifiers rather than confidential document content.
The frontend refetches authoritative state after reconnect.

## Upload state model

The browser owns local transfer states because bytes travel directly to MinIO:

```text
selected -> initiating -> uploading (local byte progress) -> completing
```

The backend owns persisted authoritative states:

```text
initiated -> verifying -> processing -> available
                         \-> failed
initiated -> expired
initiated/verifying -> cancelled (when authorized and safe)
```

The server cannot truthfully report byte-by-byte upload progress unless an additional MinIO event/progress design is implemented.
WebSocket events begin with backend-known verification/processing/final states.
Transitions occur through explicit service functions.
Do not implement a generic state-machine framework.
Use simple transition validation with an explicit mapping or `if` checks.

## Presigned upload

- Prefer a presigned POST policy when supported so size and content conditions can be constrained.
- A short-lived presigned PUT is acceptable only when completion verification enforces the policy.
- The backend stores expected key, size, content type, checksum when available, and expiry.
- The client reports local byte progress; the server reports processing state.
- The completion endpoint is idempotent.

## Failure and recovery

- If WebSocket fails, poll the upload session with bounded intervals.
- If completion is called before the object is visible, return a safe retryable conflict or schedule verification according to the spec.
- Expired incomplete objects are cleaned by a scheduled task.
- Failed objects remain private and are not represented as available documents.
