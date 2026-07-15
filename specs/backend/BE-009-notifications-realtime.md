# BE-009: Notification preferences, delivery, and realtime user events

- Status: Approved
- Priority: P0
- Requirements: ARCH-002, ARCH-007, BR-030 through BR-032
- Depends on: BE-001, BE-006, BE-008

## Intent

Notify users through configurable channels and provide secure user-scoped realtime status without class-based channel strategies or client-selected subscriptions.

## Notification API

```text
GET   /api/v1/notifications/
PATCH /api/v1/notifications/{id}/read/
POST  /api/v1/notifications/read-all/
GET   /api/v1/notification-preferences/
PUT   /api/v1/notification-preferences/
```

Users manage only their own preferences.
Notification lists are recipient-scoped.

## Channels

Explicit values: `in_app`, `email`, `sms`, `push`.

- In-app is persisted and required.
- Email is implemented through configured backend/provider.
- SMS and push preferences and delivery rows are implemented; without configured providers, delivery becomes `skipped` with a safe code rather than fake success.
- Dispatch uses explicit functions and `if` statements, not a strategy class hierarchy.

## Delivery lifecycle

- An event-specific function determines recipients and preference rows.
- Unique deduplication key creates at most one delivery per event/recipient/channel/offset.
- Celery sends pending deliveries.
- Transient failures retry; permanent failures record safe code.
- Provider response bodies and secrets are not stored.

## WebSocket

```text
/ws/v1/events/?ticket=<one-time-ticket>
```

- `CommonJsonConsumer` consumes the Redis ticket and joins `user.<id>`.
- Origin is validated.
- Application and reverse-proxy logs do not store the ticket query value.
- Client cannot subscribe to arbitrary groups.
- Incoming messages are limited to documented ping/pong behavior.
- Events use the contract in `docs/tech/asyncapi.yaml`.
- WebSocket messages are status hints; normal API remains authoritative.

## Acceptance criteria

- [ ] User can read/update only their own notification preferences.
- [ ] Disabled channel creates no send attempt or records a clear skipped decision according to implementation policy.
- [ ] Delivery deduplication prevents duplicates under repeated reminder scans and task retries.
- [ ] Unconfigured SMS/push never report success.
- [ ] Ticket expires, is one-time, and is bound to the current user/organization.
- [ ] User receives only their own events and cannot choose group names.
- [ ] Upload, notification, and offboarding status events follow the versioned envelope.
- [ ] Realtime payloads contain no presigned URL or confidential content.

## Required tests

- Preference authorization.
- Per-channel enabled/disabled behavior.
- Deduplication and retries.
- Unconfigured provider status.
- Ticket expiry/reuse/cross-user behavior.
- Origin and group enforcement.
- Event schema.

## OpenAPI ownership

`apps/notifications/api/v1/openapi.py`; WebSocket contract in `docs/tech/asyncapi.yaml`.

## Related tasks

- BE-010, BE-022, BE-023, BE-024, BE-041
