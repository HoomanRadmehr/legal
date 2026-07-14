# Observability and operational behavior

## Request correlation

- Accept or create a request ID.
- Return it in an `X-Request-ID` response header.
- Include it in safe structured logs, activity metadata where relevant, and Celery task headers.

## Structured logging

Use JSON or consistently structured logs in production.
Suggested fields:

```text
timestamp
level
service
environment
request_id
actor_id
organization_id
route
method
status_code
duration_ms
event_code
```

Redact tokens, cookies, presigned URLs, credentials, document contents, and confidential payload fields.

## Health endpoints

- Liveness: process is running and event loop responds.
- Readiness: required dependencies for serving normal requests are reachable according to a bounded check policy.
- Do not perform expensive full dependency operations on every health request.

## Metrics for future production

At minimum document counters for:

- login successes/failures and throttles;
- API latency and status;
- upload initiation/completion/failure;
- outbox backlog;
- Celery retries/failures;
- reminder deliveries;
- WebSocket connection count;
- offboarding runs.

A full metrics platform is optional for the assignment; structured logs and health checks are required.
