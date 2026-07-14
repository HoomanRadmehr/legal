# FE-001: Authentication and token lifecycle

- Status: Approved
- Priority: P0
- Requirements: ASSIGN-001, ARCH-003
- Depends on: FE-000, BE-001

## Intent

Provide secure login, session restoration, access-token refresh, logout, and clear handling of throttled or expired sessions.

## Screens and state

- Login page.
- Protected route boundary.
- Session restoration loading state.
- Signed-in user menu and logout.
- Session-expired message.

Access token lives only in memory.
Refresh token is an HttpOnly cookie and is never inspected or persisted by JavaScript.

## Flow

1. App boot ensures the CSRF cookie exists, then calls refresh once.
2. Successful refresh stores access token and loads `me` data.
3. Protected routes render only after restoration resolves.
4. Login returns access token and user/membership data.
5. On access-token 401, one shared refresh promise runs.
6. Safe/idempotent failed requests may replay once after successful refresh.
7. Refresh failure clears auth state and routes to login.
8. Logout calls CSRF-protected endpoint, clears state, and routes to login.

## CSRF

Use the backend's documented CSRF bootstrap cookie/header flow for login, refresh, and logout.
Do not disable CSRF to simplify frontend code.

## Errors

- Invalid credentials show a generic localized message.
- `429` shows retry guidance using `Retry-After`.
- Network failure is distinguishable from invalid credentials.
- No token or cookie content appears in console logs or error reporting.

## Acceptance criteria

- [ ] Access token is never written to local/session storage.
- [ ] CSRF bootstrap runs when needed before login/session restoration.
- [ ] Initial refresh restores a valid session without flashing protected content.
- [ ] Parallel 401s trigger one refresh request.
- [ ] Refresh replay is limited and does not loop.
- [ ] Logout clears state even when the server reports an already-cleared session.
- [ ] Login throttle message includes safe retry timing.
- [ ] Protected routes redirect unauthenticated users.
- [ ] Tests prove token storage and single-flight behavior.

## Required tests

- Login success/failure/429.
- Bootstrap refresh success/failure.
- Single-flight parallel 401.
- No infinite retry.
- Logout.
- Token not persisted.

## Related tasks

- FE-004
