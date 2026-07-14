# FE-009: Notifications, preferences, activity, and realtime connection

- Status: Approved
- Priority: P0
- Requirements: ASSIGN-008, ARCH-007
- Depends on: FE-001, FE-002, BE-008, BE-009

## Intent

Provide one reliable user event connection, an in-app notification center, configurable channel preferences, and permission-aware activity views.

## Realtime client

- Authenticated HTTP call obtains a one-time ticket.
- Connect to one user event endpoint.
- Reconnect with bounded exponential backoff and a new ticket each time.
- Do not include access token in URL.
- Validate event envelope and version before handling.
- Unknown event/version is ignored safely and optionally logged without payload secrets.

## Notifications

Routes/areas:

```text
/notifications
/settings/notifications
```

- List unread/all notifications.
- Mark one or all read.
- Badge/count updates from realtime hint and API refetch.
- Preferences grouped by event type and channel: in-app, email, SMS, push.
- Explain unavailable development providers without pretending delivery.

## Activity

- Global activity route for permitted roles.
- Matter timeline sections.
- Explicit filters for action, actor, date, and matter where backend permits.
- Render safe localized action descriptions.
- Never render raw JSON diffs without a reviewed presentation mapping.

## Acceptance criteria

- [ ] Ticket is requested for every connection/reconnection and is not persisted.
- [ ] Realtime event invalidates targeted queries without exposing confidential payload.
- [ ] Notification list/read/preference behavior is recipient-only.
- [ ] Disabled channels display accurately.
- [ ] Activity list/timeline respect backend denial and redacted fields.
- [ ] Unknown event versions do not crash the app.
- [ ] Connection status is recoverable without blocking normal REST use.

## Required tests

- Ticket and reconnect flow.
- Event validation/unknown version.
- Notification read and preference save.
- Activity rendering/filter.
- Cross-user data not inferred in UI.

## Related tasks

- FE-013, FE-015, FE-016
