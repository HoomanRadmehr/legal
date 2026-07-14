# ADR-004: Access JWT in memory and refresh JWT in HttpOnly cookie

- Status: Accepted
- Context: JWT is required, and browser token storage must reduce script access to long-lived credentials.
- Decision: Return short-lived access JWT in JSON and hold it in frontend memory. Store rotated refresh JWT in a Secure HttpOnly cookie. Provide a CSRF bootstrap endpoint and require CSRF for login/refresh/logout.
- Consequences: The frontend performs a refresh call on bootstrap and uses single-flight refresh logic. Production requires HTTPS and correct cookie/origin configuration.
- Rejected: Refresh token in local storage, long-lived access token, custom JWT implementation.
