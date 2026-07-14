# BE-001: JWT authentication and session lifecycle

- Status: Approved
- Priority: P0
- Requirements: ASSIGN-001, ARCH-003, BR-002, BR-004
- Depends on: BE-000

## Intent

Allow active users to authenticate securely with short-lived access JWTs, rotated refresh JWT cookies, CSRF-protected login/refresh/logout, and throttled endpoints.

## In scope

- Custom `User` inheriting only Django `AbstractUser`.
- CSRF bootstrap, login, refresh, logout, and current-user endpoints.
- Simple JWT rotation and blacklist/revocation behavior.
- Access token returned in JSON; refresh token set as HttpOnly cookie.
- Active membership included in the login/me response.
- Authentication endpoint throttles.
- One-time WebSocket ticket issuance record/Redis helper, with consumer use completed in BE-009.

## API contract

```text
GET  /api/v1/auth/csrf/
POST /api/v1/auth/login/
POST /api/v1/auth/refresh/
POST /api/v1/auth/logout/
GET  /api/v1/auth/me/
POST /api/v1/auth/ws-ticket/
```

### CSRF bootstrap

A public safe GET endpoint ensures the CSRF cookie exists before login or session restoration. It returns no identity data.

### Login input

```json
{"username": "counsel@example.test", "password": "..."}
```

### Login success

- `200` JSON contains access token, safe user fields, and selected active membership.
- Response sets refresh cookie.
- No refresh token appears in JSON.

### Refresh

- Requires valid refresh cookie and CSRF token.
- Returns a new access token and rotates the refresh cookie.
- Previous refresh token cannot be reused.

### Logout

- Requires CSRF.
- Revokes/blacklists current refresh token when present.
- Clears cookie.
- Is safe to call more than once.

## Security

- Normalize login identifiers without revealing account existence.
- Reject inactive user or inactive membership.
- Do not log credentials, token values, cookie values, or authentication request bodies.
- Login, refresh, and logout enforce CSRF as documented.
- Named throttles cover login, refresh, and WebSocket ticket creation.
- Production cookie flags are Secure, HttpOnly, appropriate SameSite, restricted path/domain.
- `me` reloads current membership; roles are not trusted solely from token claims.

## Stable errors

- `invalid_credentials` - `401`.
- `inactive_account` - `401` without differentiating user versus membership in public detail.
- `refresh_required` - `401`.
- `refresh_invalid` - `401`.
- `csrf_failed` - `403`.
- `rate_limit_exceeded` - `429` with `Retry-After`.

## Acceptance criteria

- [ ] CSRF bootstrap sets the CSRF cookie without authenticating the user.
- [ ] Successful login requires CSRF, returns access token, and sets only an HttpOnly refresh cookie.
- [ ] Refresh rotates the token; reuse of the prior token fails.
- [ ] Logout clears and revokes the refresh token and is idempotent.
- [ ] An inactive user or membership cannot authenticate or refresh.
- [ ] Login and refresh limits return the standard `429` envelope.
- [ ] `me` returns current safe user and membership data.
- [ ] WebSocket ticket is random, stored in Redis, expires within 60 seconds, and is designed for one-time consumption.
- [ ] Authentication logs contain no secrets.

## Required tests

- Login success/failure and non-enumerating error.
- Refresh rotation and replay failure.
- Logout and repeated logout.
- CSRF bootstrap and CSRF required for login/refresh/logout.
- Inactive user/membership rejection.
- Rate-limit behavior and `Retry-After`.
- WebSocket ticket expiry and uniqueness.

## OpenAPI ownership

`apps/accounts/api/v1/openapi.py`

## Related tasks

- BE-007, BE-009, BE-010
