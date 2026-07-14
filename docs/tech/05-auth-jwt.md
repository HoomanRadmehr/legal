# JWT authentication design

## Endpoints

```text
GET  /api/v1/auth/csrf/
POST /api/v1/auth/login/
POST /api/v1/auth/refresh/
POST /api/v1/auth/logout/
GET  /api/v1/auth/me/
POST /api/v1/auth/ws-ticket/
```

## Token handling

### Access token

- Short lived, default around 10 minutes.
- Returned in JSON.
- Held in frontend memory.
- Sent as `Authorization: Bearer <token>`.
- Contains minimal claims such as user subject and token type.
- Permissions are loaded from current database membership; do not embed a complete permission set.

### Refresh token

- Longer lived, default around 7 days.
- Stored in an HttpOnly cookie.
- Rotated on every successful refresh.
- Previous refresh token is blacklisted/revoked.
- Cookie is Secure in production and has explicit SameSite, path, and domain settings.
- Login, refresh, and logout require CSRF because they set or use authentication cookies.

## CSRF bootstrap

`GET /api/v1/auth/csrf/` returns a safe empty response and ensures the CSRF cookie exists.
It does not create an authenticated session. Login, refresh, and logout submit the cookie value in the documented CSRF header.

## Login response

```json
{
  "access": "<jwt>",
  "user": {
    "id": "uuid",
    "display_name": "...",
    "preferred_language": "en"
  },
  "membership": {
    "organization_id": "uuid",
    "role": "legal_counsel"
  }
}
```

The refresh token is set only as a cookie and is not included in JSON.

## Multiple organizations

The MVP expects one active organization membership per session for simplicity.
If a user has multiple memberships, login or a future switch endpoint must select one explicitly.
Do not infer organization from a request payload on each domain operation.

## Frontend refresh behavior

- On application bootstrap, ensure the CSRF cookie exists, then call refresh once.
- On an access-token 401, use a single shared refresh promise.
- Replay only safe or explicitly idempotent requests after refresh.
- If refresh fails, clear in-memory auth and redirect to login.

## WebSocket ticket

- JWT-authenticated HTTP endpoint creates a random ticket.
- Store a hash or high-entropy value in Redis with user, organization, and expiry.
- Ticket is valid for one connection and 30-60 seconds.
- Consumer deletes it when accepted.
- A ticket cannot be refreshed or reused.

## Rate limits

Login, refresh, logout abuse, and WebSocket ticket creation have named throttles.
Login uses IP plus normalized identifier where safe, without revealing whether the identifier exists.
