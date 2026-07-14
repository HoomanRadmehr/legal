# Testing guardrail

## Testing pyramid for the assignment

1. Service and selector tests for domain behavior and permissions.
2. API integration tests for authentication, status codes, filters, errors, and OpenAPI.
3. Focused Celery/MinIO/Redis integration tests with fakes or test services where practical.
4. Frontend component and feature integration tests.
5. A small number of end-to-end critical-path tests.

## Backend rules

- Use pytest and pytest-django.
- Use factories, not large static fixtures.
- Every permission test includes users from at least two organizations.
- Assert database side effects, activity logs, and outbox records for critical services.
- Freeze time for deadline boundary tests.
- Do not mock the selector being tested.
- Mock external provider calls at their explicit function boundary.
- Avoid tests that only assert framework behavior.

## Frontend rules

- Use Vitest and React Testing Library.
- Query by accessible role/label where possible.
- Test what the user sees and can do.
- Mock HTTP at the network boundary, not internal hooks.
- Test access-token restoration, single-flight refresh, 429 messaging, upload progress/status, WebSocket reconnect, permission-aware controls, RTL, and offboarding confirmation.

## Critical acceptance suite

Before final delivery, the suite must cover:

- role and organization isolation;
- case, contract, and notice create/read/update;
- deadline today/upcoming/overdue/assigned-to-me;
- task assignment boundaries;
- document upload initiation/completion/download;
- WebSocket ticket expiry and one-time use;
- audit and outbox creation;
- notification preference enforcement;
- dashboard permission filtering;
- ownership transfer and offboarding rollback;
- JWT rotation/logout;
- rate limiting;
- localization of labels/errors and Jalali UI conversion.

## No false claims

Do not mark a test task complete based only on generated test code.
The command must run, and the task execution log must record the result.
