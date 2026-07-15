# Realtime design

## Transport

Django Channels serves one JSON WebSocket endpoint through ASGI.
Redis provides the channel layer and one-time ticket store.
Development and production API containers must start `config.asgi:application`,
not the WSGI development server, so `/ws/v1/events/` reaches the Channels router.

## Authentication flow

1. Authenticated frontend calls `/api/v1/auth/ws-ticket/`.
2. Backend creates a high-entropy ticket in Redis with a short TTL.
3. Frontend connects to `/ws/v1/events/?ticket=...`.
4. Consumer validates allowed origin, consumes the ticket, and joins `user.<user_id>`.
5. Client cannot request any other group.
6. Application and reverse-proxy logs omit or redact the ticket query value.

## Consumer design

Use one `UserEventsConsumer` extending one `CommonJsonConsumer`.
The normal direction is server-to-client.
Incoming client messages are limited to `ping` or a small documented acknowledgement if needed.
Do not build a command bus over WebSocket.

## Publishing

Business services write outbox events.
A worker or explicit post-commit publisher converts permitted event types into user messages.
The event data contains IDs and safe status fields only.

## Event types

Initial event types:

- `document.upload.status_changed`
- `notification.created`
- `deadline.reminder.created`
- `offboarding.status_changed`

Each event has an integer schema version.

## Client recovery

- Reconnect with exponential backoff and jitter.
- Obtain a new one-time ticket for every connection attempt.
- On reconnect, invalidate relevant active queries.
- Upload UI polls while disconnected.
- Duplicate events are ignored by recent `event_id` tracking where necessary.
