# Security review

```text
Read docs/guardrails/02-security.md and specs/backend/BE-013-security-deployment.md.
Review the current implementation for cross-organization IDOR, role escalation, stale JWT
or refresh replay, CSRF, CORS, rate limits, WebSocket ticket reuse and arbitrary groups,
MinIO policy and completion verification, presigned URL leakage, sensitive logs, missing
audit/outbox records, and offboarding rollback. Add focused tests for confirmed gaps.
Do not add a new architecture or weaken existing acceptance criteria.
```
