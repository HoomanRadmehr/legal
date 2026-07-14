# Rate limiting design

Rate limiting is defense in depth, not the sole protection against abuse.
Use both the reverse proxy and Redis-backed DRF throttle classes.

## Reverse-proxy layer

Apply coarse limits by client IP or trusted upstream identity:

- general request burst and sustained rate;
- concurrent connections;
- login path burst;
- request body size;
- slow request/header timeouts;
- WebSocket connection attempts and concurrent connections;
- upload-initiation API requests. Direct object bytes do not pass through this proxy.

Do not trust an arbitrary `X-Forwarded-For`. Configure the exact trusted proxy chain.

## DRF scopes

Initial development defaults may be tuned through explicit settings values:

| Scope | Suggested initial limit | Key |
|---|---:|---|
| anonymous burst | 30/minute | client IP |
| authenticated burst | 120/minute | user + organization |
| authenticated sustained | 2,000/day | user + organization |
| login | 5/minute and 20/hour | client IP + normalized identifier hash |
| refresh | 20/minute | client IP + refresh/session signal where safe |
| WebSocket ticket | 30/minute | authenticated user |
| upload initiate | 20/hour | user + organization |
| upload complete | 60/hour | user + organization |
| download URL | 120/hour | user + organization |
| offboarding | 10/hour | Admin + organization |

These are starting values for the assignment, not universal production guarantees.
The actual values are named settings, documented in `.env.example` or settings code, and covered by tests.

## Classes

Use small explicit classes extending one project throttle base or DRF throttle class:

```text
AnonymousBurstThrottle
AuthenticatedBurstThrottle
AuthenticatedSustainedThrottle
LoginThrottle
RefreshThrottle
WebSocketTicketThrottle
UploadInitiateThrottle
UploadCompleteThrottle
DownloadUrlThrottle
OffboardingThrottle
```

Do not build a throttle registry or dynamic class generator.
ViewSets/actions list the classes explicitly.

## Keys and privacy

- Normalize the login identifier and hash it before placing it in a cache key.
- Never place raw passwords, JWTs, refresh cookies, presigned URLs, or document names in keys.
- Include organization where a user can belong to more than one organization.
- Use stable prefixes so operations can be inspected without exposing identity data.

## Response

On limit:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 42
```

```json
{
  "code": "rate_limit_exceeded",
  "message": "Too many requests. Try again later.",
  "details": {"retry_after": 42},
  "request_id": "uuid"
}
```

The message is localized. The code and header remain stable.

## Dependency failure

Redis is a required dependency for application-aware throttling and WebSocket tickets.
Readiness should fail when the required Redis service is unavailable.
Critical endpoints such as login, WebSocket ticket, upload initiation, and offboarding must not silently bypass their throttle because the cache failed; return a safe temporary `503` according to the common error contract.

## Tests

- Boundary request succeeds and next request receives `429`.
- `Retry-After` is present and positive.
- Different organizations/users do not incorrectly share a user-scoped bucket.
- Login key does not reveal the raw identifier.
- Reset/expiry behavior is deterministic with test time.
- Critical endpoint does not silently bypass throttle on simulated Redis failure.
