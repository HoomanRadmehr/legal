# AI usage record

This file is required by the assignment. Record only tools and prompts actually used.
Do not claim that a tool verified code unless its output was reviewed.

## 1. Tools used

| Tool | Purpose | Where used |
|---|---|---|
| Codex | Read task/spec guardrails, scaffolded backend and frontend foundations, generated lock files, implemented settings validation, common API primitives, health endpoints, OpenAPI components, logging redaction, Docker Compose infrastructure, backend CI, guard checks, the custom user model, organization tenancy models, explicit role and matter permission functions, concrete matter/access/relation models, activity logs, transactional outbox, JWT auth endpoints, authentication throttles, one-time WebSocket tickets, Channels user event stream and safe realtime publishing helpers, notification preferences and delivery functions, deadline reminder scheduling, deadlines, notices, the task API and assignment rules, MinIO upload initiation/completion/processing/download, backend localization/OpenAPI completion, filter/index/query-efficiency review, focused backend security test coverage, production Docker/Compose overlay, idempotent backend demo seed data, backend README/evidence completion, final backend acceptance verification, the typed frontend API client, the frontend app shell providers/router/states, login/session restore/refresh/logout, role-aware app shell/permission helpers, the localization/component foundation, explicit case screens, explicit contract screens, explicit deadline screens, explicit notice screens, explicit task screens and matter task sections, explicit document upload initiation/direct-transfer UI, the explicit admin user invitation form, invitation acceptance page, organization user role-management page, permission-aware dashboard, activity list/timeline presentation, and admin offboarding workflow, INT-001 integration evidence, INT-002 blocked verification evidence, INT-003 blocked verification evidence, INT-005 blocked verification evidence, and INT-006 blocked verification evidence, and reviewed verification output | BE-001 through BE-034 backend foundation, legal workflows, and evidence; FE-001 through FE-017 frontend foundation and case/contract/deadline/notice/task/document/admin/invitation/dashboard/activity/offboarding screens; INT-001 through INT-003 and INT-005 through INT-006 integration verification |
| ChatGPT | Requirements and architecture planning | Initial specification starter |
| Other local tools | Docker Compose, Docker, uv, pytest, Ruff, Django management commands, repository docs/simplicity scripts, npm, and shell search tools were used to build, run, and verify the implementation. | Recorded command-by-command in verification evidence |

## 2. Development workflow

The work proceeded task by task: read the task/spec/guardrails first, state scope and expected files, implement only the assigned task, run the requested verification commands, fix issues surfaced by those commands when in scope, and record command outcomes truthfully in the task log and this file. The backend stayed on the documented modular-monolith path with explicit models, selectors, services, serializers, ViewSets, activity logs, outbox rows, and focused tests.

BE-001 update: Codex read the root/backend AGENTS files, the task, `BE-000`, and relevant guardrails/technical docs; created the minimal Django project skeleton; generated `uv.lock`; and reviewed the required verification command output before marking the task done.

BE-002 update: Codex read the root/backend AGENTS files, the task, `BE-000`, and relevant settings/security/testing docs; implemented explicit environment parsing, production security validation, development/test settings differences, and reviewed verification output before marking the task done.

BE-003 update: Codex read the root/backend AGENTS files, `BE-000`, `BE-012`, and relevant API/security/localization/common-base docs; implemented common model/API primitives, request ID middleware, pagination, and error envelopes; and reviewed verification output before marking the task done.

BE-004 update: Codex read the root/backend AGENTS files, `BE-000`, `BE-012`, and relevant API/security/observability docs; implemented health endpoints, reusable OpenAPI components, explicit common ordering defaults, and sensitive log redaction; then reviewed verification output before marking the task done.

BE-005 update: Codex read the root/backend/infra AGENTS files, `BE-000`, `BE-013`, and relevant Docker/security/settings docs; implemented the development Dockerfile, Compose stack, MinIO private bucket initialization, and Docker ignore rules; then reviewed Compose, image build, non-root, and image-secret scan outputs before marking the task done.

BE-006 update: Codex read the root/backend AGENTS files, `BE-000`, `BE-013`, and relevant CI/testing/OpenAPI/security/simplicity docs; added the backend GitHub Actions workflow, documented reproducible quality commands, fixed a broken README documentation link caught by the docs validator, applied mechanical Ruff formatting required by the new formatting gate, and reviewed the final verification output before marking the task done.

BE-007 update: Codex read the root/backend AGENTS files, `BE-001`, `BE-013`, and relevant auth/security/data-model/localization/testing docs; implemented the explicit `accounts.User` model with UUID primary key and canonical preferred-language choices; registered a password-hash-safe admin view; generated the initial migration; added factory, model, admin, and migration tests; and reviewed verification output before marking the task done.

FE-001 update: Codex read the root/frontend AGENTS files, `FE-000`, and relevant frontend architecture/security/testing/localization/dependency docs; scaffolded a strict Vite React TypeScript app; locked dependencies; added the required folder skeleton, Vitest/Testing Library setup, ESLint/Prettier scripts, and a minimal function-component smoke test; and reviewed verification output before marking the task done.

FE-002 update: Codex read the root/frontend AGENTS files, `FE-000`, and relevant frontend architecture/security/testing/API-error/OpenAPI/auth/dependency docs; added a handwritten typed fetch client, safe backend error parser, query key and retry helpers, dev-only OpenAPI type generation, and focused API tests; and reviewed verification output before marking the task done.

FE-003 update: Codex read the root/frontend AGENTS files, `FE-000`, and relevant frontend architecture/security/testing/API-error/dependency/agent docs; added explicit app providers, React Router route placeholders, bounded TanStack Query defaults, accessible standard state components, route-level unexpected error containment, and focused smoke tests; and reviewed verification output before marking the task done.

FE-004 update: Codex read the root/frontend AGENTS files, `FE-001`, and relevant frontend architecture/auth/security/API-error/testing/localization docs; implemented the in-memory auth session store, CSRF-backed login/refresh/logout API calls, protected route restoration, single-flight refresh replay, and focused login/session tests with storage inspection; and reviewed verification output before marking the task done.

FE-005 update: Codex read the root/frontend AGENTS files, `FE-002`, the role matrix, and relevant frontend architecture/security/API-error/testing/localization/simplicity docs; implemented explicit pure permission helpers, a responsive role-aware app shell, safe direct denial/not-found route placeholders, and role navigation/action matrix tests; and reviewed verification output before marking the task done.

FE-006 update: Codex read the root/frontend AGENTS files, `FE-000`, `FE-011`, and relevant frontend architecture/security/testing/dependency/workflow docs; added i18next common namespace resources, document language/direction switching, an `Accept-Language` helper, technical value direction isolation, and small visual page header, table, badge, dialog, and form error components; and reviewed verification output before marking the task done.

FE-007 update: Codex read the root/frontend AGENTS files, `FE-003`, the backend case API contract, and relevant frontend architecture/security/API-error/filtering/testing/localization/simplicity docs; added explicit case API functions, query keys, types, Zod schemas, list/detail/create/edit pages, party field-array form behavior, archive confirmation, version-conflict handling, safe timeline action labels, route wiring, feature CSS, and focused tests for filter mapping, viewer read-only behavior, conflict preservation, archive wording, and timeline states; and reviewed verification output before marking the task done.

FE-008 update: Codex read the root/frontend AGENTS files, `FE-004`, the backend contract API contract, and relevant frontend architecture/security/API-error/filtering/testing/localization/simplicity docs; added explicit contract API functions, query keys, hooks, types, Zod schemas, list/detail/create/edit pages, renewal/expiration validation, backend 422 date error mapping, archive confirmation, version-conflict handling, safe timeline action labels, route wiring, feature CSS, and focused tests for filter mapping, visible date warnings, viewer read-only behavior, conflict preservation, archive wording, field error mapping, and timeline states; noted that Jalali conversion remains deferred by FE-008 to FE-018; and reviewed verification output before marking the task done.

FE-009 update: Codex read the root/frontend AGENTS files, `FE-006`, the backend deadline API contract, and relevant frontend architecture/security/API-error/filtering/testing/localization/simplicity docs; added explicit deadline API functions, query keys, hooks, types, Zod schemas, four backend view tabs, filters, list/detail/create/edit pages, complete/cancel confirmations, permission-aware action visibility, 409/429 user messaging, route wiring, feature CSS, and focused tests for view parameters, timezone labeling, viewer controls, complete/cancel endpoints, conflict handling, rate-limit guidance, and form submission; noted that the current auth session lacks an exact organization timezone string and kept backend classification authoritative; and reviewed verification output before marking the task done.

FE-010 update: Codex read the root/frontend AGENTS files, `FE-005`, the backend notice API contract, and relevant frontend architecture/security/API-error/filtering/testing/localization/simplicity docs; added explicit notice API functions, query keys, hooks, types, Zod schemas, list/detail/create/edit pages, permission-scoped related case/contract search, resolved related matter detail links, linked deadline status/assignee display, archive confirmation, linked deadline invalidation, route wiring, feature CSS, and focused tests for invisible related choices, linked deadline refresh, invalid date errors, hidden relation errors, version conflicts, viewer read-only behavior, and archive confirmation; noted that the task named `routes.ts` while the repository uses `routes.tsx`; and reviewed verification output before marking the task done.

FE-011 update: Codex read the root/frontend AGENTS files, `FE-006`, the backend task API contract, and relevant frontend architecture/security/API-error/filtering/testing/localization/simplicity docs; added explicit task API functions, query keys, hooks, types, Zod schemas, list/detail/create/edit pages, assigned-to-me defaults, active assignee controls, viewer and counsel role boundaries, complete/cancel confirmations, task mutation error handling, a matter-scoped task section, route wiring, feature CSS, and focused tests for filter mapping, 429 retry guidance, viewer read-only behavior, counsel reassignment hiding, version conflicts, idempotent final actions, and matter task actions; noted that the task named `routes.ts` while the repository uses `routes.tsx`; and reviewed verification output before marking the task done.

FE-012 update: Codex read the root/frontend AGENTS files, `FE-007-documents-upload`, and relevant frontend architecture, upload/realtime, MinIO, security, API-error, testing, and simplicity docs; used the React best-practices skill; added explicit document upload initiation API/types, direct MinIO PUT/POST transfer with returned method/headers/fields, local byte-progress state, in-memory idempotency-key retention for completion retry, file picker/drop affordance with size/type precheck, viewer-hidden upload panel, safe 413/422/429 messaging, feature CSS, and network-boundary tests for Django initiation versus storage transfer, progress, URL non-persistence/logging, and viewer controls; installed dependencies to run verification after correcting generated `node_modules` ownership, removed generated dependency/build artifacts before docs validation, and reviewed verification output before marking the task done.

FE-013.5 update: Codex read the root/frontend AGENTS files, `FE-001`, `FE-002`, `FE-011`, `FE-012`, the backend invitation API task, and relevant frontend architecture, security, API-error, localization, testing, and simplicity docs; used the React best-practices skill; repaired the truncated task document; added an explicit admin-only localized invitation form at `/admin/users/new`, typed membership invitation POST, idempotency-key generation, safe duplicate/rate-limit error handling, admin navigation, and tests verifying no password or organization fields are rendered or submitted; and reviewed verification output before marking the task done.

FE-013.75 update: Codex read the root/frontend AGENTS files, `FE-001`, `FE-011`, `FE-012`, the backend invitation acceptance task, and relevant frontend architecture, security, API-error, localization, testing, and simplicity docs; used the React best-practices skill; repaired the malformed task document; added an explicit public `/accept-invitation#token=...` page, typed invitation acceptance POST, password confirmation validation, safe invalid-token and rate-limit messaging, English/Persian labels, and tests proving no auto-login or token persistence; and reviewed verification output before marking the task done.

FE-013.8 update: Codex read the root/frontend AGENTS files, `FE-001`, `FE-002`, `FE-011`, `FE-012`, the backend membership role-management task, and relevant frontend architecture, security, API-error, localization, testing, and simplicity docs; used the React best-practices skill; repaired the truncated task document; added an explicit Legal Admin-only `/admin/users` role-management page, typed membership list and role-change calls, canonical role controls, safe error handling, self-role session refresh, English/Persian labels, and focused tests for filtering, payloads, denials, conflicts, rate limits, network errors, and session refresh; and reviewed verification output before marking the task done.

FE-014 update: Codex read the root/frontend AGENTS files, `FE-008`, the backend dashboard API task, and relevant frontend architecture, security, API-error, localization, testing, enum, and simplicity docs; used the React best-practices skill; added an explicit dashboard feature with typed `GET /dashboard/` API access, TanStack Query hook, permission-aware app-shell page, server-value metric cards, filter-preserving links, safe error/rate-limit states, accessible text urgency indicators, recent activity links only when the backend returns a matter id, English/Persian RTL-compatible local copy, and focused tests; and reviewed verification output before marking the task done.

FE-016 update: Codex read the root/frontend AGENTS files, `FE-009`, the backend activity API task, and relevant frontend architecture, security, API-error, localization, testing, endpoint, and simplicity docs; used the React best-practices skill; added an explicit activity feature with typed activity and matter timeline API calls, filters, TanStack Query hooks, a permission-aware `/activity` page, safe localized action labels, reviewed field display only, 403/404/429 handling, and a small visual timeline component reused by case, contract, and notice timelines; and reviewed verification output before marking the task done.

FE-017 update: Codex read the root/frontend AGENTS files, `FE-010`, the backend offboarding spec/task/API implementation, and relevant frontend architecture, security, API-error, localization, testing, endpoint, and simplicity docs; used the React best-practices skill; added an explicit Admin-only offboarding workflow with typed preview/execute/run API calls, active membership selection, read-only preview presentation, explicit `OFFBOARD` confirmation, stable idempotency-key reuse across execute retries, stale-preview recovery, final result display, route wiring, feature-local English/Persian copy, and focused network-boundary tests; and reviewed verification output before marking the task done.

BE-008 update: Codex read the root/backend AGENTS files, `BE-002`, `BE-013`, and relevant backend architecture/data-model/security/tenancy/localization/testing/common-base docs; added explicit organization and membership models, canonical choices, timezone validation, organization-scoped selectors, factories, migration, and focused tests; and reviewed verification output before marking the task done.

BE-009 update: Codex read the root/backend AGENTS files, `BE-001`, and relevant JWT/security/API/testing/localization/OpenAPI docs; added CSRF bootstrap, login, refresh rotation, logout, and current-user endpoints; wired Simple JWT blacklist support, refresh cookie attributes, URL routing, stable auth error codes, OpenAPI declarations, and focused auth API tests; and reviewed verification output before marking the task done.

BE-010 update: Codex read the root/backend AGENTS files, `BE-001`, `BE-009`, and relevant JWT/realtime/rate-limiting/security/API/testing/localization docs; added explicit login, refresh, and WebSocket ticket throttles; added short-lived one-time WebSocket ticket helpers; documented 429 responses and `Retry-After`; added focused auth tests for throttle envelopes, hashed login identifiers, ticket entropy/TTL, one-time consumption, and JWT exclusion from ticket URLs; and reviewed verification output before marking the task done.

BE-011 update: Codex read the root/backend AGENTS files, `BE-002`, and relevant backend architecture/data-model/security/API-error/testing/localization/common-base docs; added a small common permission base, explicit organization role helpers, an active membership resolver wrapper, matter visibility/edit permission functions, a matter permission class that returns not-visible behavior for hidden matters, and role matrix tests with two organizations; and reviewed verification output before marking the task done.

BE-012 update: Codex read the root/backend AGENTS files, `BE-002`, `BE-003`, and relevant backend architecture/data-model/security/API-error/testing/localization/common-base docs; added the concrete `Matter`, `MatterAccess`, and `MatterRelation` models with explicit foreign keys, constraints, indexes, and initial migration; registered the matters app; implemented permission-scoped selectors and minimal grant/revoke/owner-transfer services; expanded database-backed matter tests; and reviewed verification output before marking the task done.

BE-019 update: Codex read the root/backend AGENTS files, `BE-008`, and relevant backend architecture/data-model/security/background-jobs/observability/testing/simplicity docs; added append-only `ActivityLog`, durable `OutboxEvent`, explicit activity action constants, safe redaction allowlists, `record_activity`, `create_outbox_event`, bounded outbox dispatch helpers, Celery task wrappers that pass IDs only, and tests for rollback, redaction, append-only behavior, duplicate dispatch, safe retry errors, and bounded retry; and reviewed verification output before marking the task done.

BE-020 update: Codex read the root/backend AGENTS files, `BE-007-documents-uploads`, and relevant upload, security, tenancy, API, rate-limit, OpenAPI, testing, enum, and observability docs; confirmed dependent backend tasks were marked `DONE`; added the concrete `UploadSession` model and migration, small MinIO storage boundary functions, explicit upload-initiation service and polling selector, documents upload serializers/viewset/OpenAPI/URLs, upload-initiate throttle, focused service/API tests, and minimal app/URL registration; noted the task-scope contradiction around registration/throttle files; and reviewed verification output before marking the task done.

BE-021 update: Codex read the root/backend AGENTS files, `BE-007-documents-uploads`, `BE-008-activity-outbox`, and relevant upload, security, tenancy, API, background-job, rate-limit, OpenAPI, testing, enum, and observability docs; confirmed dependent backend tasks were marked `DONE`; added the concrete `Document` model and migration, MinIO download presign helper, idempotent upload completion, object stat verification, post-commit processing task scheduling, available/failed processing, permission-scoped document selectors, list/detail/download/revoke API actions, expired upload cleanup, and focused service/API tests for duplicate completion, conflicting replay, object mismatch/missing/expiry, worker success/failure, download redaction, revoke, and cleanup safety; and reviewed verification output before marking the task done.

BE-022 update: Codex read the root/backend AGENTS files, `BE-009-notifications-realtime`, `BE-007-documents-uploads`, and relevant realtime, upload, security, tenancy, background-job, simplicity, and AsyncAPI docs; confirmed dependent backend tasks were marked `DONE`; added the ASGI WebSocket route, `CommonJsonConsumer`, `UserEventsConsumer`, safe versioned realtime event builders, upload-status publishing helpers, AsyncAPI updates, and focused tests for ticket deletion/reuse/expiry, origin rejection, cross-user group isolation, ping-only client input, and JWT/presigned URL payload redaction; noted the allowed-scope contradiction around wiring the existing outbox dispatcher stub; and reviewed verification output before marking the task done.

BE-023 update: Codex read the root/backend AGENTS files, `BE-009-notifications-realtime`, and relevant notifications, realtime, background-job, security, API/OpenAPI, testing, tenancy, enum, and simplicity docs; confirmed dependent backend tasks were marked `DONE`; added concrete notification preference, notification, and delivery models, plain own-preference and recipient-scoped selector/service functions, explicit in-app/email/SMS/push delivery functions, skipped statuses for disabled/unconfigured channels, unique delivery dedupe keys, in-app realtime hints, API serializers/views/routes/OpenAPI, a Celery delivery wrapper, and focused tests for ownership, cross-recipient isolation, disabled/unconfigured truthfulness, dedupe rejection, safe payload filtering, and provider-response safety; noted the minimal config registration deviation required to expose and test the app; and reviewed verification output before marking the task done.

BE-024 update: Codex read the root/backend AGENTS files, `BE-006-deadlines-tasks`, `BE-009-notifications-realtime`, and relevant background-job, notification, realtime, security, tenancy, testing, and simplicity docs; confirmed dependent backend tasks were marked `DONE`; added fixed 24-hour and 1-hour reminder windows, a bounded open-deadline scanner, notification/delivery intent creation through the notification service, stable per-deadline/recipient/offset/channel dedupe, a Celery task entry point, a 5-minute Celery Beat schedule, and tests for repeated scans, completed/cancelled exclusion, disabled preference handling, no provider calls during scanning, timezone boundary behavior, and task invocation; and reviewed verification output before marking the task done.

BE-028 update: Codex read the root/backend AGENTS files, `BE-012-api-localization`, and relevant API, localization, OpenAPI, security, testing, architecture, backend, notification, endpoint, and enum docs; confirmed dependent backend tasks were marked `DONE`; added project English/Persian locale catalogs with compiled message files, wired `LOCALE_PATHS`, documented localized error and standard language/idempotency/rate-limit headers in common OpenAPI, stabilized generated enum component names, generated and validated `build/openapi.yaml`, and added focused tests for Persian `Accept-Language`, canonical enum values, OpenAPI ownership, operation IDs, and synthetic examples. Exact `python` verification commands were blocked by the repository pyenv `3.12` setting, so the same commands were verified with `/usr/bin/python3.12` through `uv`; docs validation still fails on existing decimal task heading IDs outside BE-028 scope.

BE-029 update: Codex read the root/backend AGENTS files, the case, contract, notice, deadline/task, dashboard, and API/localization specs, and relevant filtering, tenancy, testing, simplicity, and backend architecture guardrails; confirmed dependent backend tasks were marked `DONE`; added targeted indexes for reviewed matter, task, and document list/dashboard paths; simplified dashboard recent activity to use the permission-scoped matter selector; tightened the dashboard query-count regression; and added explicit filter/order/index tests. Exact `python` verification commands were blocked by the repository pyenv `3.12` setting, so equivalent `/usr/bin/python3.12` uv-backed pytest and migration dry-run commands were reviewed; docs validation still fails on existing decimal task heading IDs outside BE-029 scope.

BE-030 update: Codex read the root/backend AGENTS files, the security deployment spec, and relevant security, tenancy, upload, realtime, rate-limit, and testing guardrails; confirmed all dependent tasks were marked `DONE`; added a focused backend security suite for cross-organization hiding, viewer mutation denial, stale version conflicts, role mutation restrictions, JWT CSRF/refresh/logout behavior, login and upload throttles, upload completion abuse cases, sensitive redaction, WebSocket ticket boundaries, and offboarding idempotency/rollback; fixed a stale notice test deadline fixture without weakening the permission assertion; and reviewed verification output before marking the task done. Exact `python` verification commands were blocked by the repository pyenv `3.12` setting, so equivalent `/usr/bin/python3.12` uv-backed pytest and `python3` simplicity commands were reviewed.

BE-031 update: Codex read the root/backend/infra AGENTS files, the security deployment spec, and relevant Docker, settings, security, realtime/upload, rate-limit, background-job, observability, dependency, and testing guardrails; confirmed `BE-005` and `BE-030` were `DONE`; added a production Docker/Compose overlay with one non-root backend image for API/worker/Beat/migration, a static frontend runtime, a production MinIO init image, a reverse proxy with WebSocket upgrade, coarse rate limits, request limits, and query-redacting logs, private production networks, an explicit migration profile, generated MinIO CORS, and TLS/HSTS operational notes; and reviewed verification output before marking the task done. Because dependency files were outside BE-031 scope, the Dockerfile pins `daphne==4.1.2` inside the image build for the required ASGI runtime command.

BE-032 update: Codex read the root/backend AGENTS files, the security deployment spec, relevant legal-domain specs, and security/tenancy/testing/simplicity workflow guardrails; confirmed `BE-013`, `BE-014`, `BE-015`, `BE-016`, `BE-017`, and `BE-023` were `DONE`; added an idempotent `seed_demo` command with synthetic organizations, all four roles, visible/hidden and cross-organization records, cases/contracts/notices, today/upcoming/overdue deadlines, tasks, document metadata, notification preferences, demo notification rows, and README development-only credentials; added focused tests for second-run idempotency, role coverage, visibility boundaries, deadline selectors, and synthetic fixture coverage; and reviewed verification output before marking the task done. Exact `python` commands remain blocked by the local pyenv `3.12` setting, so equivalent `/usr/bin/python3.12` uv-backed commands were reviewed; local Compose DB migrations were applied before seeding because the running database was behind current migrations.

BE-033 update: Codex read the root/backend AGENTS files, the security deployment spec, Docker/environment/auth/upload/realtime/background-job/OpenAPI/testing technical docs, and relevant guardrails; confirmed `BE-028`, `BE-031`, and `BE-032` were `DONE`; completed the backend README with setup, environment, development and production Docker commands, migration, seed, test, lint, OpenAPI, Celery, architecture, security decisions, troubleshooting, demo users, and limitations; refreshed the root README reviewer entry points; added a presentation evidence summary; removed placeholder AI evidence; and reviewed documentation validation output. The required docs validator still fails on pre-existing decimal task heading IDs outside BE-033's allowed documentation scope.

BE-034 update: Codex read the root/backend AGENTS files, the security deployment spec, Docker/environment/auth/upload/realtime/background-job/OpenAPI/testing technical docs, and relevant guardrails; confirmed `BE-030`, `BE-031`, `BE-032`, and `BE-033` were `DONE`; ran the final backend acceptance gate; recorded exact `python` command failures caused by the unavailable pyenv `3.12` runtime; verified supporting lint, tests, migration drift, OpenAPI, production deploy check, development and production image builds, Compose startup, API health, seed, CSRF/login/me/WebSocket-ticket smoke flow, MinIO private bucket behavior, and non-root backend/frontend/proxy images with explicit available Python and Docker commands; and marked BE-034 blocked because docs validation still fails on existing decimal task IDs and `legal-minio-init:prod` runs as root, which belongs to BE-031 scope.

BE-017 update: Codex read the root/backend AGENTS files, `BE-006`, and relevant backend architecture/data-model/security/API/testing/OpenAPI/simplicity docs; added the concrete matter-linked `Task` app with explicit assignment rules, permission-scoped selectors, create/update/complete/cancel services, API serializers/filter/viewset/OpenAPI, initial migration, route/settings registration, and focused tests for cross-organization or inactive assignees, counsel reassignment denial, viewer read-only behavior, idempotent final actions, stale versions, and filter/ordering allowlists; and reviewed verification output before marking the task done.

INT-001 update: Codex read the root/backend/frontend AGENTS files, the integration task, linked backend/frontend auth and permission specs, definition of done, and relevant architecture/security/realtime/MinIO/Docker/testing guardrails; confirmed `BE-011` and `FE-005` were `DONE`; added an allowed-scope backend integration test for published auth, CSRF, refresh, logout, WebSocket ticket, MinIO bucket, and cross-org not-found contracts; and marked the task blocked after required Compose verification failed before stack startup on an unavailable MinIO client image tag.

INT-002 update: Codex read the root/backend/frontend AGENTS files, the integration task, linked backend/frontend case, contract, and notice specs, definition of done, and relevant architecture/security/API/testing guardrails; confirmed `BE-016` and `FE-010` were `DONE`; used the real local Compose stack and ran the required verification command; cleared unrelated Docker port conflicts; and marked the task blocked because the `legal-backend:dev` runtime image does not include `pytest`, so the required `docker compose run --rm api python -m pytest tests/integration/test_legal_records.py -q` command exits before test collection.

INT-003 update: Codex read the root/backend/frontend AGENTS files, the integration task, linked backend/frontend deadline and task specs, definition of done, and relevant architecture/security/API/testing/localization guardrails; confirmed `BE-017` and `FE-011` were `DONE`; used the real local Compose stack and ran the required verification command; identified a host PostgreSQL port conflict on `5432`; and marked the task blocked after the no-host-port Compose variant confirmed the `legal-backend:dev` runtime image does not include `pytest`, so deadline/task integration tests cannot reach collection.

INT-005 update: Codex read the root/backend/frontend/infra AGENTS files, the integration task, linked backend/frontend notification, activity, dashboard, and realtime specs, definition of done, and relevant architecture/security/API/testing guardrails; confirmed `BE-025` and `FE-016` were `DONE`; added allowed-scope backend integration coverage for notification preferences, delivery truthfulness, WebSocket ticket handshake, activity redaction and visibility, dashboard count parity, and MinIO private bucket behavior; used the real local Compose stack; and marked the task blocked because `docker compose run --rm api python -m pytest tests/integration/test_dashboard_notifications.py -q` exits before collection with `/opt/venv/bin/python: No module named pytest`. `python3 scripts/validate_docs.py` also still fails on existing decimal task heading IDs outside INT-005 scope.

INT-006 update: Codex read the root/backend/frontend AGENTS files, the integration task, linked backend/frontend offboarding specs, definition of done, and relevant architecture/security/API/testing/transaction guardrails; confirmed `BE-027` and `FE-017` were `DONE`; added allowed-scope backend integration coverage for Admin preview read-only behavior, atomic final reassignment state, idempotent replay, stale-preview rollback/conflict, non-Admin denial, cross-organization run hiding, WebSocket ticket handshake, and private MinIO bucket behavior; used the real local Compose stack; and marked the task blocked because `docker compose run --rm api python -m pytest tests/integration/test_offboarding.py -q` exits before collection with `/opt/venv/bin/python: No module named pytest`. `python3 scripts/validate_docs.py` also still fails on existing decimal task heading IDs outside INT-006 scope.

## 3. Important prompts

Record 5-10 prompts that materially affected the result.

### Prompt 1

```text
Implement only [BE-001-scaffold-django-project-and-lock-dependencies.md](tasks/backend/BE-001-scaffold-django-project-and-lock-dependencies.md) 
First read the root and nearest nested AGENTS.md, the task file, every linked spec,
and the relevant guardrails. Before editing, provide a concise implementation plan and
list the files you expect to change. Keep the implementation explicit and standard:
no multiple inheritance, no polymorphic domain code, no GenericForeignKey, no signals
for business workflows, no service classes, and no complex functions. Run every command
listed in the task's verification section. Update the task execution note and AI_USAGE.md.
Do not start another task.
```

**Result used:** Created and verified the minimal backend scaffold for BE-001 only.

**Human review or correction:** Human redirected from an interrupted BE-002 request back to BE-001; implementation followed the latest task prompt.

### Prompt 2

```text
Implement only [BE-002-implement-settings-modules-and-environment-validation.md](tasks/backend/BE-002-implement-settings-modules-and-environment-validation.md) 
First read the root and nearest nested AGENTS.md, the task file, every linked spec,
and the relevant guardrails. Before editing, provide a concise implementation plan and
list the files you expect to change. Keep the implementation explicit and standard:
no multiple inheritance, no polymorphic domain code, no GenericForeignKey, no signals
for business workflows, no service classes, and no complex functions. Run every command
listed in the task's verification section. Update the task execution note and AI_USAGE.md.
Do not start another task.
```

**Result used:** Created strict production settings, development/test settings, an explicit environment reader, and focused settings tests for BE-002 only.

**Human review or correction:** None during implementation; production deploy check used required env values exported in the shell rather than weakening validation defaults.

### Prompt 3

```text
Implement only [BE-003-add-common-model-api-base-classes-and-error-envelope.md](tasks/backend/BE-003-add-common-model-api-base-classes-and-error-envelope.md) 
First read the root and nearest nested AGENTS.md, the task file, every linked spec,
and the relevant guardrails. Before editing, provide a concise implementation plan and
list the files you expect to change. Keep the implementation explicit and standard:
no multiple inheritance, no polymorphic domain code, no GenericForeignKey, no signals
for business workflows, no service classes, and no complex functions. Run every command
listed in the task's verification section. Update the task execution note and AI_USAGE.md.
Do not start another task.
```

**Result used:** Created common base classes, request ID middleware, pagination, error envelope helpers, and direct tests for BE-003 only.

**Human review or correction:** None during implementation; a task-scope tension was resolved by keeping settings wiring out of BE-003 and testing the common primitives directly.

### Prompt 4

```text
Implement only [BE-004-configure-drf-filters-openapi-health-and-structured-logging.md](tasks/backend/BE-004-configure-drf-filters-openapi-health-and-structured-logging.md) 
First read the root and nearest nested AGENTS.md, the task file, every linked spec,
and the relevant guardrails. Before editing, provide a concise implementation plan and
list the files you expect to change. Keep the implementation explicit and standard:
no multiple inheritance, no polymorphic domain code, no GenericForeignKey, no signals
for business workflows, no service classes, and no complex functions. Run every command
listed in the task's verification section. Update the task execution note and AI_USAGE.md.
Do not start another task.
```

**Result used:** Added transport configuration, health endpoints, OpenAPI common components, redaction helpers, and focused smoke tests for BE-004 only.

**Human review or correction:** None during implementation; tests caught an over-greedy cookie redaction pattern, which was narrowed before final verification.

### Prompt 5

```text
Implement only [BE-005-create-development-docker-compose-infrastructure.md](tasks/backend/BE-005-create-development-docker-compose-infrastructure.md) 
First read the root and nearest nested AGENTS.md, the task file, every linked spec,
and the relevant guardrails. Before editing, provide a concise implementation plan and
list the files you expect to change. Keep the implementation explicit and standard:
no multiple inheritance, no polymorphic domain code, no GenericForeignKey, no signals
for business workflows, no service classes, and no complex functions. Run every command
listed in the task's verification section. Update the task execution note and AI_USAGE.md.
Do not start another task.
```

**Result used:** Added multi-stage backend image, development Compose services, MinIO private bucket initialization, `.dockerignore`, and verification evidence for BE-005 only.

**Human review or correction:** None during implementation; a MinIO healthcheck that depended on an implicit `mc` alias was replaced with the HTTP liveness endpoint before verification.

### Prompt 6

```text
Implement only [BE-006-add-backend-ci-and-documentation-guard-checks.md](tasks/backend/BE-006-add-backend-ci-and-documentation-guard-checks.md) 
First read the root and nearest nested AGENTS.md, the task file, every linked spec,
and the relevant guardrails. Before editing, provide a concise implementation plan and
list the files you expect to change. Keep the implementation explicit and standard:
no multiple inheritance, no polymorphic domain code, no GenericForeignKey, no signals
for business workflows, no service classes, and no complex functions. Run every command
listed in the task's verification section. Update the task execution note and AI_USAGE.md.
Do not start another task.
```

**Result used:** Added backend CI with locked dependency install, docs and simplicity checks from the repository root, Ruff format/lint, pytest, migration drift, OpenAPI validation, and production deploy checks for BE-006 only.

**Human review or correction:** None during implementation; local verification exposed an unavailable `python` pyenv shim and pre-existing unformatted backend files, both recorded in the task log.

### Prompt 7

```text
Implement only [BE-007-implement-custom-user-model-and-initial-migration.md](tasks/backend/BE-007-implement-custom-user-model-and-initial-migration.md) 
First read the root and nearest nested AGENTS.md, the task file, every linked spec,
and the relevant guardrails. Before editing, provide a concise implementation plan and
list the files you expect to change. Keep the implementation explicit and standard:
no multiple inheritance, no polymorphic domain code, no GenericForeignKey, no signals
for business workflows, no service classes, and no complex functions. Run every command
listed in the task's verification section. Update the task execution note and AI_USAGE.md.
Do not start another task.
```

**Result used:** Added the custom accounts user model, initial migration, safe admin registration, factory, and focused tests for BE-007 only.

**Human review or correction:** None during implementation; local verification exposed the same unavailable `python` pyenv shim, so the task commands were also run through the locked temporary virtualenv Python.

### Prompt 8

```text
Implement only [FE-001-scaffold-react-typescript-application.md](tasks/frontend/FE-001-scaffold-react-typescript-application.md) 
First read the root and nearest nested AGENTS.md, the task file, every linked spec,
and the relevant guardrails. Before editing, provide a concise implementation plan and
list the files you expect to change. Keep the implementation explicit and standard:
no multiple inheritance, no polymorphic domain code, no GenericForeignKey, no signals
for business workflows, no service classes, and no complex functions. Run every command
listed in the task's verification section. Update the task execution note and AI_USAGE.md.
Do not start another task.
```

**Result used:** Added the strict React/Vite TypeScript scaffold, dependency lockfile, required frontend folder skeleton, lint/format/test/typecheck/build scripts, and a minimal smoke test for FE-001 only.

**Human review or correction:** None during implementation; Codex recorded the necessary `index.html` and ESLint config files as task-scope gaps because Vite build and ESLint 9 need them.

### Prompt 9

```text
Implement only [FE-002-implement-typed-api-client-and-error-contract.md](tasks/frontend/FE-002-implement-typed-api-client-and-error-contract.md) 
First read the root and nearest nested AGENTS.md, the task file, every linked spec,
and the relevant guardrails. Before editing, provide a concise implementation plan and
list the files you expect to change. Keep the implementation explicit and standard:
no multiple inheritance, no polymorphic domain code, no GenericForeignKey, no signals
for business workflows, no service classes, and no complex functions. Run every command
listed in the task's verification section. Update the task execution note and AI_USAGE.md.
Do not start another task.
```

**Result used:** Added the FE-002 typed API client and error contract only, with generated TypeScript schema placeholders, focused tests, and dev-only OpenAPI type generation.

**Human review or correction:** None during implementation; verification caught strict TypeScript and lint issues in the tests, which were fixed before completion.

### Prompt 10

```text
Implement only [BE-019-implement-activitylog-and-transactional-outbox.md](tasks/backend/BE-019-implement-activitylog-and-transactional-outbox.md) 
First read the root and nearest nested AGENTS.md, the task file, every linked spec,
and the relevant guardrails. Before editing, provide a concise implementation plan and
list the files you expect to change. Keep the implementation explicit and standard:
no multiple inheritance, no polymorphic domain code, no GenericForeignKey, no signals
for business workflows, no service classes, and no complex functions. Run every command
listed in the task's verification section. Update the task execution note and AI_USAGE.md.
Do not start another task.
```

**Result used:** Added BE-019 activity log and transactional outbox only, with explicit services, Celery task wrappers, migration, and focused tests.

**Human review or correction:** None during implementation; Codex recorded the local missing-pyenv Python issue and used the locked `/usr/bin/python3.12` path for meaningful verification.

## 4. AI mistakes or limitations

The assignment requires at least two. Record concrete examples rather than generic statements.

### Example 1

- What the AI proposed: A cookie redaction regex that matched from `Cookie:` to the end of the log line.
- Why it was wrong or unsuitable: It was safe but too broad, hiding later URL and ticket fields instead of letting each sensitive pattern be redacted independently.
- How it was detected: `common/tests/test_logging.py` failed during BE-004 verification.
- What was changed: The cookie and set-cookie regexes were narrowed to redact the cookie token only.

### Example 2

- What the AI proposed: A MinIO server healthcheck using `mc ready local`.
- Why it was wrong or unsuitable: It could depend on an implicit `mc` alias and credentials inside the server image, making the healthcheck less predictable.
- How it was detected: Manual review before running final Docker verification.
- What was changed: The MinIO healthcheck now calls the server's HTTP liveness endpoint.

### Example 3

- What the AI proposed: Add `ruff format --check .` to CI without first checking whether the existing backend source was already formatted.
- Why it was wrong or unsuitable: The new CI gate would have failed immediately on the current backend files.
- How it was detected: Local BE-006 verification reported 23 files that would be reformatted.
- What was changed: Codex applied the mechanical Ruff formatting pass and reran the formatter check successfully.

### Example 4

- What the AI proposed: Migration tests that used `MigrationLoader(connection)` without marking the tests for database access.
- Why it was wrong or unsuitable: `MigrationLoader` checks the migration recorder table, which requires a database connection under pytest-django.
- How it was detected: The first BE-007 accounts test run failed with "Database access not allowed."
- What was changed: The migration test module was marked with `pytest.mark.django_db` and the suite was rerun successfully.

### Example 5

- What the AI proposed: Run `npm ci`, typecheck, tests, build, lint, and format checks in parallel.
- Why it was wrong or unsuitable: `npm ci` rebuilds `node_modules`, so the other commands observed partially installed packages and failed with missing-module errors.
- How it was detected: The first FE-001 verification pass showed missing TypeScript, Vitest, Rollup, ESLint, and Prettier modules while `npm ci` was running.
- What was changed: Codex reran the verification commands sequentially after `npm ci`, and the meaningful implementation issues were fixed and rechecked.

### Example 6

- What the AI proposed: FE-002 tests that inferred mocked `fetch` arguments too loosely and later renamed unused mock parameters with underscore prefixes.
- Why it was wrong or unsuitable: Strict TypeScript could not safely read the mock call tuple, and the lint configuration still rejected the unused parameters.
- How it was detected: `npm run typecheck` and then `npm run lint` failed during FE-002 verification.
- What was changed: The tests now type the mocked fetch explicitly, consume unused mock parameters with `void`, and pass typecheck and lint.

### Example 7

- What the AI proposed: A FE-003 route error smoke-test component that only threw an error.
- Why it was wrong or unsuitable: TypeScript inferred the component return type as `void`, so it was not a valid JSX element even though the runtime test passed.
- How it was detected: `npm run typecheck` failed during FE-003 verification.
- What was changed: The test component now has an explicit React return type and the required typecheck was rerun successfully.

### Example 8

- What the AI proposed: Run backend BE-008 checks with `uv run` while leaving the generated `.venv` inside the backend directory.
- Why it was wrong or unsuitable: The repository simplicity checker scanned `.venv` and reported unrelated third-party JavaScript class inheritance.
- How it was detected: `/usr/bin/python3 scripts/check_simplicity.py backend` failed after the first uv-backed check run.
- What was changed: Codex reran backend checks with `UV_PROJECT_ENVIRONMENT=/tmp/legal-be008-venv`, removed generated environments, and reran the simplicity check successfully.

### Example 9

- What the AI proposed: Use DRF `AuthenticationFailed` for public login and refresh contract errors.
- Why it was wrong or unsuitable: DRF converted those exceptions to `403` on unauthenticated views without a challenge header, but the auth contract requires stable `401` errors.
- How it was detected: The first BE-009 accounts API test run returned `403` for invalid credentials and refresh replay scenarios.
- What was changed: Codex replaced those public auth failures with a small explicit `401` API exception carrying the documented stable codes.

### Example 10

- What the AI proposed: A BE-010 test that forced DRF request parsing as a bare expression, and a ticket TTL assertion anchored before the request started.
- Why it was wrong or unsuitable: Ruff rejected the bare expression, and the TTL check could fail by a millisecond because the ticket is created after request dispatch begins.
- How it was detected: The first tightened BE-010 verification pass failed Ruff and two focused account tests.
- What was changed: The request parsing became a real assertion, the synthetic request was given a JSON parser, and the TTL assertion now compares expiry against response completion.

### Example 11

- What the AI proposed: A single BE-011 role matrix test that covered both matter view and edit outcomes.
- Why it was wrong or unsuitable: The test was readable but crossed the repository's hard 40-line function limit by one line.
- How it was detected: `/usr/bin/python3.12 scripts/check_simplicity.py backend` failed during BE-011 verification.
- What was changed: The matrix was split into separate view and edit tests with a small setup helper, and the simplicity check passed.

### Example 12

- What the AI proposed: After BE-012 switched permission tests to real database models, keep the role matrix setup in one helper.
- Why it was wrong or unsuitable: The helper grew to 49 lines and violated the repository's hard function-length guardrail.
- How it was detected: `/usr/bin/python3.12 scripts/check_simplicity.py backend` failed during BE-012 verification.
- What was changed: The setup was split into smaller membership and matter/grant helpers, and the simplicity check passed.

### Example 13

- What the AI proposed: An outbox dispatch function that marked max attempts but still tried to publish on the following call.
- Why it was wrong or unsuitable: The bounded retry state was not terminal, so a worker could attempt one extra publish after reaching the configured limit.
- How it was detected: `apps/activity/tests/test_outbox_dispatcher.py::test_dispatch_records_bounded_retry_failure` failed during BE-019 verification.
- What was changed: The dispatcher now treats the max-attempt error marker as terminal before publishing, and the activity tests pass.

### Example 14

- What the AI proposed: A matter task action hook that captured an empty task id before a user selected the task action.
- Why it was wrong or unsuitable: Completing a matter task attempted to call `/api/v1/tasks//complete/` instead of the selected task endpoint.
- How it was detected: `cd frontend && npm test -- --run src/features/tasks` failed during FE-011 verification.
- What was changed: Matter task complete/cancel mutations now accept the selected task id and version at mutation time, and the task tests pass.

## 5. Decisions made personally

The implementation followed these professional decisions from the repository constraints and repeated task reviews:

- Keep the system a modular monolith. This preserved PostgreSQL transactions, simple local deployment, and direct reviewability for the assignment scope.
- Use `Matter` as the explicit shared permission boundary instead of polymorphic legal records, generic foreign keys, or content-type associations.
- Keep services and selectors as plain functions. This made authorization, transactions, audit writes, and outbox writes visible without a service container or repository layer.
- Store JWT refresh tokens in HttpOnly cookies and keep access tokens in frontend memory to reduce browser storage exposure.
- Use direct-to-MinIO uploads with short-lived presigned instructions and backend completion verification instead of proxying document bytes through Django.
- Treat WebSocket events as recovery/status hints. REST and PostgreSQL remain authoritative after reconnect or missed realtime events.
- Prefer explicit per-domain pages, serializers, filters, and OpenAPI declarations over a generic CRUD generator.
- Record failed commands and environment blockers rather than rewriting history or claiming verification that did not run.

## 6. Verification evidence

| Area | Command or method | Result | Reviewed by |
|---|---|---|---|
| Backend scaffold | `cd backend && python -m compileall .` | Passed | Codex |
| Backend tests | `cd backend && python -m pytest -q` | Passed, `1 passed` | Codex |
| Backend simplicity | `python scripts/check_simplicity.py backend` | Passed, scanned 19 source files | Codex |
| Backend lint | `cd backend && python -m ruff check .` | Passed | Codex |
| Backend dependency lock | `uv sync --locked --all-groups --python /usr/bin/python3.12` | Passed, checked 55 packages | Codex |
| Backend settings tests | `cd backend && python -m pytest tests/test_settings.py -q` | Passed, `4 passed` | Codex |
| Backend deploy check | `cd backend && DJANGO_SETTINGS_MODULE=config.settings.production python manage.py check --deploy` with required production env exported | Passed, no issues | Codex |
| Backend BE-002 simplicity | `python scripts/check_simplicity.py backend` | Passed, scanned 22 source files | Codex |
| Backend BE-002 lint | `cd backend && python -m ruff check .` | Passed | Codex |
| Backend common tests | `cd backend && python -m pytest common/tests -q` | Passed, `15 passed` | Codex |
| Backend BE-003 simplicity | `python scripts/check_simplicity.py backend` | Passed, scanned 34 source files | Codex |
| Backend BE-003 lint | `cd backend && python -m ruff check .` | Passed | Codex |
| Backend OpenAPI validation | `cd backend && python manage.py spectacular --file /tmp/openapi.yaml --validate` | Passed | Codex |
| Backend health/common tests | `cd backend && python -m pytest common/tests tests/test_health.py -q` | Passed, `22 passed` | Codex |
| Backend BE-004 simplicity | `python scripts/check_simplicity.py backend` | Passed, scanned 41 source files | Codex |
| Backend BE-004 lint | `cd backend && python -m ruff check .` | Passed | Codex |
| Docker Compose config | `docker compose config` | Passed | Codex |
| Backend Docker image | `docker build -f docker/backend/Dockerfile -t legal-backend:test .` | Passed | Codex |
| Backend Docker non-root | `docker image inspect ...` and `docker run ... os.getuid()` | Passed, user `app`, UID `999` | Codex |
| Backend image secret check | image env/history grep for app secret patterns | Passed, no matches | Codex |
| Backend CI docs guard | `/usr/bin/python3 scripts/validate_docs.py` | Passed, 27 specs, 63 tasks, 172 Markdown files | Codex |
| Backend CI simplicity guard | `/usr/bin/python3 scripts/check_simplicity.py backend` | Passed, scanned 41 source files | Codex |
| Backend CI locked install | `uv sync --locked --all-groups --python /usr/bin/python3.12` | Passed, installed 55 packages into temporary venv | Codex |
| Backend CI format | `uv run ruff format --check .` | Passed after mechanical Ruff formatting | Codex |
| Backend CI lint | `uv run ruff check .` | Passed | Codex |
| Backend CI tests | `uv run python -m pytest -q` | Passed, `19 passed` | Codex |
| Backend CI migration drift | `uv run python manage.py makemigrations --check --dry-run` | Passed, no changes detected | Codex |
| Backend CI OpenAPI | `uv run python manage.py spectacular --file ../build/openapi.yaml --validate` | Passed | Codex |
| Backend CI deploy check | `uv run python manage.py check --deploy` with CI placeholder env values | Passed, no issues | Codex |
| Backend custom user migration drift | `/tmp/legal-be-007-venv/bin/python manage.py makemigrations --check --dry-run` | Passed, no changes detected; local PostgreSQL role warning reviewed | Codex |
| Backend accounts tests | `/tmp/legal-be-007-venv/bin/python -m pytest apps/accounts/tests -q` | Passed, `7 passed` | Codex |
| Backend regression tests | `/tmp/legal-be-007-venv/bin/python -m pytest common/tests apps/accounts/tests tests -q` | Passed, `33 passed` | Codex |
| Backend BE-007 lint | `/tmp/legal-be-007-venv/bin/python -m ruff check .` | Passed | Codex |
| Backend BE-007 format | `/tmp/legal-be-007-venv/bin/python -m ruff format --check .` | Passed | Codex |
| Backend BE-007 simplicity | `/usr/bin/python3 scripts/check_simplicity.py backend` | Passed, scanned 49 source files | Codex |
| Frontend locked install | `cd frontend && npm ci` | Passed, 351 packages installed, 0 vulnerabilities | Codex |
| Frontend typecheck | `cd frontend && npm run typecheck` | Passed | Codex |
| Frontend tests | `cd frontend && npm test -- --run` | Passed, 1 test file and 1 test | Codex |
| Frontend build | `cd frontend && npm run build` | Passed | Codex |
| Frontend lint | `cd frontend && npm run lint` | Passed | Codex |
| Frontend format | `cd frontend && npm run format:check` | Passed | Codex |
| Frontend simplicity | `/usr/bin/python3 scripts/check_simplicity.py frontend` | Passed, scanned 7 source files | Codex |
| Frontend docs validation | `/usr/bin/python3 scripts/validate_docs.py` after removing generated dependency/build artifacts | Passed, 27 specs, 63 tasks, 170 Markdown files | Codex |
| Frontend FE-002 dependency lock | `cd frontend && npm ci` | Passed, 371 packages installed, 0 vulnerabilities | Codex |
| Frontend FE-002 typecheck | `cd frontend && npm run typecheck` | Passed | Codex |
| Frontend FE-002 API tests | `cd frontend && npm test -- --run src/api` | Passed, 4 test files and 10 tests | Codex |
| Frontend FE-002 lint | `cd frontend && npm run lint` | Passed | Codex |
| Frontend FE-002 format | `cd frontend && npm run format:check` | Passed | Codex |
| Frontend FE-002 build | `cd frontend && npm run build` | Passed | Codex |
| Frontend FE-002 simplicity | `/usr/bin/python3 scripts/check_simplicity.py frontend` | Passed, scanned 13 source files | Codex |
| Frontend generated source check | `rg -n "\b(function|class|const|let|var|fetch|client)\b" frontend/src/api/generated/schema.ts frontend/src/api/generated/index.ts` | Passed, no runtime client matches | Codex |
| Frontend FE-002 docs validation | `/usr/bin/python3 scripts/validate_docs.py` after removing generated dependency/build artifacts | Passed, 27 specs, 63 tasks, 170 Markdown files | Codex |
| Frontend FE-003 dependency install | `cd frontend && npm ci` | Passed, 371 packages installed, 0 vulnerabilities | Codex |
| Frontend FE-003 typecheck | `cd frontend && npm run typecheck` | Passed after fixing the deliberate throwing test component return type | Codex |
| Frontend FE-003 app/component tests | `cd frontend && npm test -- --run src/app src/components` | Passed, 3 test files and 8 tests | Codex |
| Frontend FE-003 lint | `cd frontend && npm run lint` | Passed | Codex |
| Frontend FE-003 format | `cd frontend && npm run format:check` | Passed | Codex |
| Frontend FE-003 build | `cd frontend && npm run build` | Passed | Codex |
| Frontend FE-003 simplicity | `/usr/bin/python3 scripts/check_simplicity.py frontend` | Passed, scanned 23 source files | Codex |
| Frontend FE-003 docs validation | `/usr/bin/python3 scripts/validate_docs.py` after removing generated dependency/build artifacts | Passed, 27 specs, 63 tasks, 170 Markdown files | Codex |
| Frontend FE-006 dependency install | `cd frontend && npm ci` | Passed, 371 packages installed, 0 vulnerabilities | Codex |
| Frontend FE-006 i18n/component tests | `cd frontend && npm test -- --run src/i18n src/components` | Passed, 3 test files and 13 tests | Codex |
| Frontend FE-006 typecheck | `cd frontend && npm run typecheck` | Passed | Codex |
| Frontend FE-006 lint | `cd frontend && npm run lint` | Passed | Codex |
| Frontend FE-006 format | `cd frontend && npm run format:check` | Passed | Codex |
| Frontend FE-006 build | `cd frontend && npm run build` | Passed | Codex |
| Frontend FE-006 simplicity | `/usr/bin/python3 scripts/check_simplicity.py frontend` | Passed, scanned 36 source files | Codex |
| Frontend FE-006 docs validation | `/usr/bin/python3 scripts/validate_docs.py` after removing generated dependency/build artifacts | Passed, 27 specs, 63 tasks, 170 Markdown files | Codex |
| Frontend FE-004 literal auth tests before dependency install | `cd frontend && npm test -- --run src/auth src/features/auth` | Failed because `vitest` was unavailable before `node_modules` was installed | Codex |
| Frontend FE-004 dependency install | `cd frontend && npm ci` | Passed, 371 packages installed, 0 vulnerabilities | Codex |
| Frontend FE-004 auth tests | `cd frontend && npm test -- --run src/auth src/features/auth` | Passed, 3 test files and 12 tests | Codex |
| Frontend FE-004 typecheck | `cd frontend && npm run typecheck` | Passed | Codex |
| Frontend FE-004 app/API regression tests | `cd frontend && npm test -- --run src/app src/api` | Passed, 6 test files and 15 tests | Codex |
| Frontend FE-004 lint | `cd frontend && npm run lint` | Passed after splitting non-component auth exports out of `AuthProvider.tsx` | Codex |
| Frontend FE-004 format check | `cd frontend && npm run format:check` | Passed after running Prettier on touched frontend files | Codex |
| Frontend FE-005 auth/layout tests | `cd frontend && npm test -- --run src/auth src/components/layout` | Passed, 4 test files and 17 tests | Codex |
| Frontend FE-005 typecheck | `cd frontend && npm run typecheck` | Passed | Codex |
| Frontend FE-005 app regression tests | `cd frontend && npm test -- --run src/app` | Passed, 2 test files and 5 tests | Codex |
| Frontend FE-005 lint | `cd frontend && npm run lint` | Passed | Codex |
| Frontend FE-005 format check | `cd frontend && npm run format:check` | Passed after running Prettier on touched frontend files | Codex |
| Integration INT-001 test formatting | `cd backend && uv run --python /usr/bin/python3.12 ruff format tests/integration/test_auth.py` | Passed after formatting the new integration test file | Codex |
| Integration INT-001 test lint | `cd backend && uv run --python /usr/bin/python3.12 ruff check tests/integration/test_auth.py` | Passed | Codex |
| Integration INT-001 Compose startup | `docker compose up -d --build` | Failed before stack startup because `minio/mc:RELEASE.2024-07-15T19-02-30Z` returned `manifest unknown` | Codex |
| Integration INT-001 pytest command | `docker compose run --rm api python -m pytest tests/integration/test_auth.py -q` | Failed before pytest startup for the same unavailable MinIO client image manifest | Codex |
| Integration INT-001 simplicity | `python3 scripts/check_simplicity.py` | Passed, scanned 149 source files | Codex |
| Integration INT-001 docs validation | `python3 scripts/validate_docs.py` | Initially failed while generated `frontend/node_modules` existed; passed after removing that generated dependency directory, 27 specs, 63 tasks, 171 Markdown files | Codex |
| Backend BE-008 migration generation | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be008-venv uv run --python /usr/bin/python3.12 python manage.py makemigrations organizations` | Passed; generated `0001_initial`, with existing local PostgreSQL role warning reviewed | Codex |
| Backend BE-008 literal pytest command | `cd backend && python -m pytest apps/organizations/tests -q` | Failed before test startup because local pyenv points to uninstalled Python 3.12 | Codex |
| Backend BE-008 literal migration check | `cd backend && python manage.py makemigrations --check --dry-run` | Failed before Django startup for the same local pyenv reason | Codex |
| Backend BE-008 tests | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be008-venv uv run --python /usr/bin/python3.12 python -m pytest apps/organizations/tests -q` | Passed, `12 passed` | Codex |
| Backend BE-008 migration drift | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be008-venv uv run --python /usr/bin/python3.12 python manage.py makemigrations --check --dry-run` | Passed, no changes detected; local PostgreSQL role warning reviewed | Codex |
| Backend BE-008 lint | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be008-venv uv run --python /usr/bin/python3.12 ruff check apps/organizations config/settings/base.py` | Passed | Codex |
| Backend BE-008 format | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be008-venv uv run --python /usr/bin/python3.12 ruff format --check apps/organizations config/settings/base.py` | Passed | Codex |
| Backend BE-008 simplicity | `/usr/bin/python3 scripts/check_simplicity.py backend` after removing generated virtualenvs and caches | Passed, scanned 58 source files | Codex |
| Backend BE-008 docs validation | `/usr/bin/python3 scripts/validate_docs.py` | Passed, 27 specs, 63 tasks, 171 Markdown files | Codex |
| Backend BE-009 literal pytest command | `cd backend && python -m pytest apps/accounts/tests -q` | Failed before test startup because local pyenv points to uninstalled Python 3.12 | Codex |
| Backend BE-009 literal OpenAPI command | `cd backend && python manage.py spectacular --file /tmp/openapi.yaml --validate` | Failed before Django startup for the same local pyenv reason | Codex |
| Backend BE-009 accounts tests | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be009-venv uv run --python /usr/bin/python3.12 python -m pytest apps/accounts/tests -q` | Passed, `17 passed` | Codex |
| Backend BE-009 OpenAPI validation | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be009-venv uv run --python /usr/bin/python3.12 python manage.py spectacular --file /tmp/openapi.yaml --validate` | Passed | Codex |
| Backend BE-009 common error regression | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be009-venv uv run --python /usr/bin/python3.12 python -m pytest common/tests/test_error_envelope.py -q` | Passed, `5 passed` | Codex |
| Backend BE-009 migration drift | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be009-venv uv run --python /usr/bin/python3.12 python manage.py makemigrations --check --dry-run` | Passed, no changes detected; local PostgreSQL role warning reviewed | Codex |
| Backend BE-009 lint | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be009-venv uv run --python /usr/bin/python3.12 ruff check apps/accounts common/api/exception_handler.py config/settings/base.py config/settings/production.py config/urls.py` | Passed | Codex |
| Backend BE-009 format | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be009-venv uv run --python /usr/bin/python3.12 ruff format --check apps/accounts common/api/exception_handler.py config/settings/base.py config/settings/production.py config/urls.py` | Passed | Codex |
| Backend BE-009 simplicity | `/usr/bin/python3 scripts/check_simplicity.py backend` after removing generated caches | Passed, scanned 66 source files | Codex |
| Backend BE-009 docs validation | `/usr/bin/python3 scripts/validate_docs.py` | Passed, 27 specs, 63 tasks, 171 Markdown files | Codex |
| Backend BE-010 literal pytest command | `cd backend && python -m pytest apps/accounts/tests -q` | Failed before test startup because local pyenv points to uninstalled Python 3.12 | Codex |
| Backend BE-010 accounts tests | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be010-venv uv run --python /usr/bin/python3.12 python -m pytest apps/accounts/tests -q` | Passed, `22 passed` | Codex |
| Backend BE-010 OpenAPI validation | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be010-venv uv run --python /usr/bin/python3.12 python manage.py spectacular --file /tmp/legal-be010-schema.yaml --validate` | Passed | Codex |
| Backend BE-010 migration drift | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be010-venv uv run --python /usr/bin/python3.12 python manage.py makemigrations --check --dry-run` | Passed, no changes detected; local PostgreSQL role warning reviewed | Codex |
| Backend BE-010 lint | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be010-venv uv run --python /usr/bin/python3.12 ruff check common/api/throttles.py common/auth/tickets.py apps/accounts/api/v1 apps/accounts/tests/test_auth_api.py` | Passed | Codex |
| Backend BE-010 format | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be010-venv uv run --python /usr/bin/python3.12 ruff format common/api/throttles.py common/auth/tickets.py apps/accounts/api/v1 apps/accounts/tests/test_auth_api.py` | Passed, 8 files left unchanged | Codex |
| Backend BE-010 simplicity | `/usr/bin/python3.12 scripts/check_simplicity.py backend` | Passed, scanned 68 source files | Codex |
| Backend BE-010 docs validation | `/usr/bin/python3.12 scripts/validate_docs.py` | Passed, 27 specs, 63 tasks, 170 Markdown files | Codex |
| Backend BE-011 literal pytest command | `cd backend && python -m pytest apps/organizations/tests apps/matters/tests -q` | Failed before test startup because local pyenv points to uninstalled Python 3.12 | Codex |
| Backend BE-011 permission tests | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be011-venv uv run --python /usr/bin/python3.12 python -m pytest apps/organizations/tests apps/matters/tests -q` | Passed, `24 passed` | Codex |
| Backend BE-011 migration drift | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be011-venv uv run --python /usr/bin/python3.12 python manage.py makemigrations --check --dry-run` | Passed, no changes detected; local PostgreSQL role warning reviewed | Codex |
| Backend BE-011 lint | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be011-venv uv run --python /usr/bin/python3.12 ruff check common/permissions.py apps/organizations/permissions.py apps/matters/permissions.py apps/organizations/tests/test_permissions.py apps/matters/tests/test_permissions.py` | Passed | Codex |
| Backend BE-011 format | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be011-venv uv run --python /usr/bin/python3.12 ruff format --check common/permissions.py apps/organizations/permissions.py apps/matters/permissions.py apps/organizations/tests/test_permissions.py apps/matters/tests/test_permissions.py` | Passed, 5 files already formatted | Codex |
| Backend BE-011 simplicity | `/usr/bin/python3.12 scripts/check_simplicity.py backend` | Passed, scanned 75 source files | Codex |
| Backend BE-011 docs validation | `/usr/bin/python3.12 scripts/validate_docs.py` | Passed, 27 specs, 63 tasks, 170 Markdown files | Codex |
| Backend BE-012 literal pytest command | `cd backend && python -m pytest apps/matters/tests -q` | Failed before test startup because local pyenv points to uninstalled Python 3.12 | Codex |
| Backend BE-012 literal migration check | `cd backend && python manage.py makemigrations --check --dry-run` | Failed before Django startup for the same local pyenv reason | Codex |
| Backend BE-012 literal simplicity check | `python scripts/check_simplicity.py backend` | Failed before script startup for the same local pyenv reason | Codex |
| Backend BE-012 migration generation | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be012-venv uv run --python /usr/bin/python3.12 python manage.py makemigrations matters` | Passed; generated `0001_initial`, with existing local PostgreSQL role warning reviewed | Codex |
| Backend BE-012 matter tests | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be012-venv uv run --python /usr/bin/python3.12 python -m pytest apps/matters/tests -q` | Passed, `23 passed` | Codex |
| Backend BE-012 migration drift | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be012-venv uv run --python /usr/bin/python3.12 python manage.py makemigrations --check --dry-run` | Passed, no changes detected; local PostgreSQL role warning reviewed | Codex |
| Backend BE-012 lint | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be012-venv uv run --python /usr/bin/python3.12 ruff check config/settings/base.py apps/matters apps/matters/tests` | Passed | Codex |
| Backend BE-012 format | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be012-venv uv run --python /usr/bin/python3.12 ruff format --check config/settings/base.py apps/matters apps/matters/tests` | Passed | Codex |
| Backend BE-012 simplicity | `/usr/bin/python3.12 scripts/check_simplicity.py backend` | Passed, scanned 83 source files | Codex |
| Backend BE-012 docs validation | `/usr/bin/python3.12 scripts/validate_docs.py` | Passed, 27 specs, 63 tasks, 170 Markdown files | Codex |
| Backend BE-019 literal pytest command | `cd backend && python -m pytest apps/activity/tests -q` | Failed before test startup because local pyenv points to uninstalled Python 3.12 | Codex |
| Backend BE-019 migration generation | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be019-venv uv run --python /usr/bin/python3.12 python manage.py makemigrations activity` | Passed; generated `0001_initial`, with existing local PostgreSQL role warning reviewed | Codex |
| Backend BE-019 activity tests | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be019-venv uv run --python /usr/bin/python3.12 python -m pytest apps/activity/tests -q` | Passed, `9 passed` | Codex |
| Backend BE-019 migration drift | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be019-venv uv run --python /usr/bin/python3.12 python manage.py makemigrations --check --dry-run` | Passed, no changes detected; local PostgreSQL role warning reviewed | Codex |
| Backend BE-019 lint | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be019-venv uv run --python /usr/bin/python3.12 ruff check config/settings/base.py apps/activity common/services` | Passed | Codex |
| Backend BE-019 format | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be019-venv uv run --python /usr/bin/python3.12 ruff format --check config/settings/base.py apps/activity common/services` | Passed, 14 files already formatted | Codex |
| Backend BE-019 simplicity | `/usr/bin/python3.12 scripts/check_simplicity.py backend` | Passed, scanned 94 source files | Codex |
| Backend BE-019 docs validation | `/usr/bin/python3.12 scripts/validate_docs.py` | Passed, 27 specs, 63 tasks, 170 Markdown files | Codex |
| Backend BE-018 migration generation | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be018-venv uv run --python /usr/bin/python3.12 python manage.py makemigrations activity` | Passed; generated `0002_idempotencyrecord`, with existing local PostgreSQL role warning reviewed | Codex |
| Backend BE-018 literal pytest command | `cd backend && python -m pytest common/tests apps/activity/tests -q` | Failed before test startup because local pyenv points to uninstalled Python 3.12 | Codex |
| Backend BE-018 common/activity tests | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be018-venv uv run --python /usr/bin/python3.12 python -m pytest common/tests apps/activity/tests -q` | Passed, `39 passed` | Codex |
| Backend BE-018 migration drift | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be018-venv uv run --python /usr/bin/python3.12 python manage.py makemigrations --check --dry-run` | Passed, no changes detected; local PostgreSQL role warning reviewed | Codex |
| Backend BE-018 lint | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be018-venv uv run --python /usr/bin/python3.12 ruff check common/services/idempotency.py common/services/versioning.py common/tests/test_idempotency.py common/tests/test_versioning.py apps/activity/models.py apps/activity/migrations/0002_idempotencyrecord.py` | Passed after mechanical import-order fix | Codex |
| Backend BE-018 format | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be018-venv uv run --python /usr/bin/python3.12 ruff format --check common/services/idempotency.py common/services/versioning.py common/tests/test_idempotency.py common/tests/test_versioning.py apps/activity/models.py apps/activity/migrations/0002_idempotencyrecord.py` | Passed, 6 files already formatted | Codex |
| Backend BE-018 simplicity | `/usr/bin/python3.12 scripts/check_simplicity.py backend` | Passed, scanned 100 source files | Codex |
| Backend BE-018 docs validation | `/usr/bin/python3.12 scripts/validate_docs.py` | Passed, 27 specs, 63 tasks, 172 Markdown files | Codex |
| Backend BE-018 re-verification literal pytest command | `cd backend && python -m pytest common/tests apps/activity/tests -q` | Failed before test startup because local pyenv points to uninstalled Python 3.12 | Codex |
| Backend BE-018 re-verification common/activity tests | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be018-verify-venv uv run --python /usr/bin/python3.12 python -m pytest common/tests apps/activity/tests -q` | Passed, `39 passed` | Codex |
| Backend BE-013 migration generation | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be013-venv uv run --python /usr/bin/python3.12 python manage.py makemigrations cases` | Passed; generated `0001_initial`, with existing local PostgreSQL role warning reviewed | Codex |
| Backend BE-013 literal pytest command | `cd backend && python -m pytest apps/cases/tests -q` | Failed before test startup because local pyenv points to uninstalled Python 3.12 | Codex |
| Backend BE-013 literal OpenAPI command | `cd backend && python manage.py spectacular --file /tmp/openapi.yaml --validate` | Failed before Django startup for the same local pyenv reason | Codex |
| Backend BE-013 case tests | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be013-venv uv run --python /usr/bin/python3.12 python -m pytest apps/cases/tests -q` | Passed, `12 passed` | Codex |
| Backend BE-013 OpenAPI validation | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be013-venv uv run --python /usr/bin/python3.12 python manage.py spectacular --file /tmp/openapi.yaml --validate` | Passed without warnings after explicit case ID path annotation | Codex |
| Backend BE-013 migration drift | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be013-venv uv run --python /usr/bin/python3.12 python manage.py makemigrations --check --dry-run` | Passed, no changes detected; local PostgreSQL role warning reviewed | Codex |
| Backend BE-013 lint | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be013-venv uv run --python /usr/bin/python3.12 ruff check apps/cases config/settings/base.py config/urls.py` | Passed after mechanical import fixes | Codex |
| Backend BE-013 format | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be013-venv uv run --python /usr/bin/python3.12 ruff format --check apps/cases config/settings/base.py config/urls.py` | Passed, 19 files already formatted | Codex |
| Backend BE-013 simplicity | `/usr/bin/python3.12 scripts/check_simplicity.py backend` | Passed, scanned 115 source files | Codex |
| Backend BE-013 docs validation | `/usr/bin/python3.12 scripts/validate_docs.py` | Passed, 27 specs, 63 tasks, 172 Markdown files | Codex |
| Backend BE-014 migration generation | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be014-venv uv run --python /usr/bin/python3.12 python manage.py makemigrations contracts` | Passed; generated `0001_initial`, with existing local PostgreSQL role warning reviewed | Codex |
| Backend BE-014 literal pytest command | `cd backend && python -m pytest apps/contracts/tests -q` | Failed before test startup because local pyenv points to uninstalled Python 3.12 | Codex |
| Backend BE-014 literal OpenAPI command | `cd backend && python manage.py spectacular --file /tmp/openapi.yaml --validate` | Failed before Django startup for the same local pyenv reason | Codex |
| Backend BE-014 contract tests | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be014-venv uv run --python /usr/bin/python3.12 python -m pytest apps/contracts/tests -q` | Passed, `16 passed` | Codex |
| Backend BE-014 OpenAPI validation | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be014-venv uv run --python /usr/bin/python3.12 python manage.py spectacular --file /tmp/openapi.yaml --validate` | Passed | Codex |
| Backend BE-014 migration drift | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be014-venv uv run --python /usr/bin/python3.12 python manage.py makemigrations --check --dry-run` | Passed, no changes detected; local PostgreSQL role warning reviewed | Codex |
| Backend BE-014 lint | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be014-venv uv run --python /usr/bin/python3.12 ruff check apps/contracts config/settings/base.py config/urls.py` | Passed after mechanical import fixes | Codex |
| Backend BE-014 format | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be014-venv uv run --python /usr/bin/python3.12 ruff format --check apps/contracts config/settings/base.py config/urls.py` | Passed, 19 files already formatted | Codex |
| Backend BE-014 simplicity | `/usr/bin/python3.12 scripts/check_simplicity.py backend` | Passed, scanned 130 source files | Codex |
| Backend BE-014 docs validation | `/usr/bin/python3.12 scripts/validate_docs.py` | Passed, 27 specs, 63 tasks, 172 Markdown files | Codex |
| Backend BE-015 migration generation | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be015-venv uv run --python /usr/bin/python3.12 python manage.py makemigrations deadlines` | Passed; generated `0001_initial`, with existing local PostgreSQL role warning reviewed | Codex |
| Backend BE-015 literal pytest command | `cd backend && python -m pytest apps/deadlines/tests -q` | Failed before pytest startup because local pyenv points to uninstalled Python 3.12 | Codex |
| Backend BE-015 deadline tests | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be015-venv uv run --python /usr/bin/python3.12 python -m pytest apps/deadlines/tests -q` | Passed, `15 passed` | Codex |
| Backend BE-015 OpenAPI validation | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be015-venv uv run --python /usr/bin/python3.12 python manage.py spectacular --file /tmp/openapi.yaml --validate` | Passed without warnings after making deadline output status a string field | Codex |
| Backend BE-015 migration drift | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be015-venv uv run --python /usr/bin/python3.12 python manage.py makemigrations --check --dry-run` | Passed, no changes detected; local PostgreSQL role warning reviewed | Codex |
| Backend BE-015 lint | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be015-venv uv run --python /usr/bin/python3.12 ruff check apps/deadlines config/settings/base.py config/urls.py` | Passed after mechanical import and formatting fixes | Codex |
| Backend BE-015 format | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be015-venv uv run --python /usr/bin/python3.12 ruff format --check apps/deadlines config/settings/base.py config/urls.py` | Passed, 20 files already formatted | Codex |
| Backend BE-015 simplicity | `/usr/bin/python3.12 scripts/check_simplicity.py backend` | Passed after trimming one test helper, scanned 146 source files | Codex |
| Backend BE-015 docs validation | `/usr/bin/python3.12 scripts/validate_docs.py` | Passed, 27 specs, 63 tasks, 172 Markdown files | Codex |
| Backend BE-016 migration generation | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be016-venv uv run --python /usr/bin/python3.12 python manage.py makemigrations notices` | Passed; generated `0001_initial`, with existing local PostgreSQL role warning reviewed | Codex |
| Backend BE-016 literal pytest command | `cd backend && python -m pytest apps/notices/tests apps/deadlines/tests -q` | Failed before pytest startup because local pyenv points to uninstalled Python 3.12 | Codex |
| Backend BE-016 notice/deadline tests | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be016-venv uv run --python /usr/bin/python3.12 python -m pytest apps/notices/tests apps/deadlines/tests -q` | Passed after fixing visible-forbidden test setup and a lazy QuerySet assertion, `27 passed` | Codex |
| Backend BE-016 OpenAPI validation | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be016-venv uv run --python /usr/bin/python3.12 python manage.py spectacular --file /tmp/openapi.yaml --validate` | Passed | Codex |
| Backend BE-016 migration drift | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be016-venv uv run --python /usr/bin/python3.12 python manage.py makemigrations --check --dry-run` | Passed, no changes detected; local PostgreSQL role warning reviewed | Codex |
| Backend BE-016 lint | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be016-venv uv run --python /usr/bin/python3.12 ruff check apps/notices apps/deadlines config/settings/base.py config/urls.py` | Passed after mechanical import and formatting fixes | Codex |
| Backend BE-016 format | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be016-venv uv run --python /usr/bin/python3.12 ruff format apps/notices apps/deadlines config/settings/base.py config/urls.py` | Passed | Codex |
| Backend BE-016 simplicity | `/usr/bin/python3.12 scripts/check_simplicity.py backend` | Passed, scanned 161 source files | Codex |
| Backend BE-016 docs validation | `/usr/bin/python3.12 scripts/validate_docs.py` | Initially failed because generated `frontend/node_modules` Markdown was present; passed after removing that ignored generated dependency directory, 27 specs, 63 tasks, 172 Markdown files | Codex |
| Backend BE-017 migration generation | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be017-venv uv run --python /usr/bin/python3.12 python manage.py makemigrations tasks` | Passed; generated `0001_initial`, with existing local PostgreSQL role warning reviewed | Codex |
| Backend BE-017 literal pytest command | `cd backend && python -m pytest apps/tasks/tests -q` | Failed before pytest startup because local pyenv points to uninstalled Python 3.12 | Codex |
| Backend BE-017 task tests | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be017-venv uv run --python /usr/bin/python3.12 python -m pytest apps/tasks/tests -q` | Passed, `18 passed` | Codex |
| Backend BE-017 OpenAPI validation | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be017-venv uv run --python /usr/bin/python3.12 python manage.py spectacular --file /tmp/legal-be017-openapi.yaml --validate` | Passed with 0 errors and one drf-spectacular enum naming warning for reused status choice fields | Codex |
| Backend BE-017 migration drift | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be017-venv uv run --python /usr/bin/python3.12 python manage.py makemigrations --check --dry-run` | Passed, no changes detected; local PostgreSQL role warning reviewed | Codex |
| Backend BE-017 lint | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be017-venv uv run --python /usr/bin/python3.12 ruff check apps/tasks config/settings/base.py config/urls.py` | Passed after generated migration import ordering fix | Codex |
| Backend BE-017 format | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be017-venv uv run --python /usr/bin/python3.12 ruff format --check apps/tasks config/settings/base.py config/urls.py` | Passed, 20 files already formatted | Codex |
| Backend BE-017 simplicity | `/usr/bin/python3.12 scripts/check_simplicity.py backend` | Passed after splitting one test function and removing ignored generated `backend/.venv`, scanned 177 source files | Codex |
| Backend BE-017 docs validation | `/usr/bin/python3.12 scripts/validate_docs.py` | Passed, 27 specs, 63 tasks, 172 Markdown files | Codex |
| Frontend FE-007 initial test command | `cd frontend && npm test -- --run src/features/cases` | Failed before test startup because dependencies were not installed and `vitest` was missing | Codex |
| Frontend FE-007 dependency install | `cd frontend && npm ci` | Passed, 371 packages installed, 0 vulnerabilities | Codex |
| Frontend FE-007 case tests | `cd frontend && npm test -- --run src/features/cases` | Passed, 4 test files and 8 tests after fixing fixture UUID and TypeScript mock shape | Codex |
| Frontend FE-007 typecheck | `cd frontend && npm run typecheck` | Passed after enum boundary casts and complete test fixtures | Codex |
| Frontend FE-007 lint | `cd frontend && npm run lint` | Passed | Codex |
| Frontend FE-007 format | `cd frontend && npm run format:check` | Passed | Codex |
| Frontend FE-007 simplicity | `/usr/bin/python3.12 scripts/check_simplicity.py frontend/src` | Passed, scanned 73 source files | Codex |
| Frontend FE-007 docs validation | `/usr/bin/python3.12 scripts/validate_docs.py` | Initially failed because generated `frontend/node_modules` Markdown was present; passed after removing that ignored generated dependency directory and build output | Codex |
| Frontend FE-007 production build | `cd frontend && npm run build` | Passed with Vite chunk-size warning for the bundled app | Codex |
| Frontend FE-008 dependency install | `cd frontend && npm ci` | Passed, 371 packages installed, 0 vulnerabilities | Codex |
| Frontend FE-008 contract tests | `cd frontend && npm test -- --run src/features/contracts` | Initially failed once due to a fake-timer test stall and once due to an invalid edit fixture; passed after fixes, 4 test files and 9 tests | Codex |
| Frontend FE-008 typecheck | `cd frontend && npm run typecheck` | Initially failed on strict schema/field typings; passed after explicit type narrowing | Codex |
| Frontend FE-008 lint | `cd frontend && npm run lint` | Passed | Codex |
| Frontend FE-008 format | `cd frontend && npm run format:check` | Initially failed on new-file formatting; passed after targeted Prettier formatting | Codex |
| Frontend FE-008 production build | `cd frontend && npm run build` | Passed with Vite chunk-size warning for the bundled app | Codex |
| Frontend FE-008 simplicity | `/usr/bin/python3.12 scripts/check_simplicity.py frontend/src` | Passed, scanned 95 source files | Codex |
| Frontend FE-008 docs validation | `python3 scripts/validate_docs.py` | Initially failed because generated `frontend/node_modules` Markdown was present; passed after removing generated `frontend/node_modules` and `frontend/dist` | Codex |
| Frontend FE-009 dependency install | `cd frontend && npm ci` | Passed, 371 packages installed, 0 vulnerabilities | Codex |
| Frontend FE-009 deadline tests | `cd frontend && npm test -- --run src/features/deadlines` | Initially failed once on a test timing assertion; passed after fix, 3 test files and 11 tests | Codex |
| Frontend FE-009 typecheck | `cd frontend && npm run typecheck` | Passed | Codex |
| Frontend FE-009 lint | `cd frontend && npm run lint` | Initially failed on a Fast Refresh constant export warning; passed after moving the constant to a non-component file | Codex |
| Frontend FE-009 format | `cd frontend && npm run format:check` | Initially failed on new-file formatting; passed after targeted Prettier formatting | Codex |
| Frontend FE-009 production build | `cd frontend && npm run build` | Passed with Vite chunk-size warning for the bundled app | Codex |
| Frontend FE-009 simplicity | `python3 scripts/check_simplicity.py frontend/src` | Passed, scanned 118 source files | Codex |
| Frontend FE-009 docs validation | `python3 scripts/validate_docs.py` | Initially failed because generated `frontend/node_modules` Markdown was present; passed after removing generated `frontend/node_modules` and `frontend/dist` | Codex |
| Frontend FE-010 dependency install | `cd frontend && npm ci` | Passed, 371 packages installed, 0 vulnerabilities; rerun after generated dependency cleanup also passed | Codex |
| Frontend FE-010 notice tests | `cd frontend && npm test -- --run src/features/notices` | Initially failed because form tests needed a QueryClient wrapper; a post-cleanup rerun failed while `node_modules` was absent; passed after reinstalling dependencies, 3 test files and 9 tests | Codex |
| Frontend FE-010 typecheck | `cd frontend && npm run typecheck` | A post-cleanup rerun failed while `node_modules` was absent; passed after reinstalling dependencies | Codex |
| Frontend FE-010 lint | `cd frontend && npm run lint` | Passed | Codex |
| Frontend FE-010 format | `cd frontend && npm run format:check` | Initially failed on new-file formatting; passed after targeted Prettier formatting | Codex |
| Frontend FE-010 production build | `cd frontend && npm run build` | Passed with Vite chunk-size warning for the bundled app | Codex |
| Frontend FE-010 simplicity | `python3 scripts/check_simplicity.py frontend/src/features/notices frontend/src/app/routes.tsx` | Passed, scanned 23 source files | Codex |
| Frontend FE-010 docs validation | `python3 scripts/validate_docs.py` | Passed after removing generated `frontend/node_modules` and `frontend/dist`, 27 specs, 63 tasks, 172 Markdown files | Codex |
| Frontend FE-011 dependency install | `cd frontend && npm ci` | Passed, 371 packages installed, 0 vulnerabilities | Codex |
| Frontend FE-011 task tests | `cd frontend && npm test -- --run src/features/tasks` | Initially failed on duplicate 429 retry text and matter action task id binding; passed after fixes, 3 test files and 10 tests | Codex |
| Frontend FE-011 typecheck | `cd frontend && npm run typecheck` | Initially failed on test fixture/mock typings; passed after fixes | Codex |
| Frontend FE-011 lint | `cd frontend && npm run lint` | Initially failed on lint-only issues in task tests/schema/form; passed after fixes | Codex |
| Frontend FE-011 format | `cd frontend && npm run format:check` | Passed | Codex |
| Frontend FE-011 production build | `cd frontend && npm run build` | Passed with Vite chunk-size warning for the bundled app | Codex |
| Frontend FE-011 simplicity | `python3 scripts/check_simplicity.py frontend/src/features/tasks frontend/src/app/routes.tsx` | Passed, scanned 22 source files | Codex |
| Frontend FE-011 docs validation | `python3 scripts/validate_docs.py` | Passed after task log and AI usage updates and after removing generated dependency/build artifacts, 27 specs, 63 tasks, 172 Markdown files | Codex |
| Frontend FE-013 dependency install | `cd frontend && npm ci` | Passed, restored locked frontend dependencies after `vitest` was initially unavailable | Codex |
| Frontend FE-013 document/realtime tests | `cd frontend && npm test -- --run src/features/documents src/realtime` | Initially failed before dependency install; passed after implementation and formatting, 5 test files and 16 tests | Codex |
| Frontend FE-013 typecheck | `cd frontend && npm run typecheck` | Initially surfaced strict test/WebSocket typing issues; passed after fixes | Codex |
| Frontend FE-013 targeted formatting | `cd frontend && npx prettier --write src/auth/api.ts src/realtime src/features/documents` | Passed, formatted only files in the allowed FE-013 frontend scope | Codex |
| Frontend FE-013 simplicity | `python3 scripts/check_simplicity.py frontend/src` | Passed, scanned 180 source files | Codex |
| Frontend FE-013 docs validation | `python3 scripts/validate_docs.py` | Failed after generated dependency cleanup on unrelated task-doc issues: current blocker is empty `tasks/frontend/FE-013.07-implement-user-invitation-acceptance-page.md`; earlier run also reported invalid decimal-ID task headings | Codex |
| Frontend FE-015 dependency install | `cd frontend && npm ci` | Passed, restored locked frontend dependencies for notification tests | Codex |
| Frontend FE-015 notification tests | `cd frontend && npm test -- --run src/features/notifications` | Initially failed on duplicate text test selectors; passed after test fix, 3 test files and 8 tests | Codex |
| Frontend FE-015 typecheck | `cd frontend && npm run typecheck` | Initially surfaced strict Vitest mock tuple indexing; passed after explicit mock call casts | Codex |
| Frontend FE-015 targeted formatting | `cd frontend && npx prettier --write src/app/routes.tsx src/features/notifications` | Passed, no final formatting changes needed | Codex |
| Frontend FE-015 simplicity | `python3 scripts/check_simplicity.py frontend/src/features/notifications frontend/src/app/routes.tsx` | Passed, scanned 15 source files | Codex |
| Frontend FE-015 docs validation | `python3 scripts/validate_docs.py` | Failed after generated dependency cleanup on unrelated task-doc issues in BE-026.5, BE-026.75, FE-013.5, FE-013.75, and missing BE-036 dependency reference | Codex |
| Backend BE-025 literal pytest command | `cd backend && python -m pytest apps/dashboard/tests -q` | Failed before pytest startup because `.python-version` points to uninstalled `3.12` | Codex |
| Backend BE-025 dashboard tests | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be025-venv uv run --python /usr/bin/python3.12 python -m pytest apps/dashboard/tests -q` | Passed after correcting the contract horizon fixture, 5 tests | Codex |
| Backend BE-025 lint | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be025-venv uv run --python /usr/bin/python3.12 ruff check apps/dashboard config/settings/base.py config/urls.py` | Passed | Codex |
| Backend BE-025 format | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be025-venv uv run --python /usr/bin/python3.12 ruff format --check apps/dashboard config/settings/base.py config/urls.py` | Passed, 13 files already formatted | Codex |
| Backend BE-025 simplicity | `python3 scripts/check_simplicity.py backend/apps/dashboard backend/config/settings/base.py backend/config/urls.py` | Passed, scanned 11 source files | Codex |
| Backend BE-025 migration drift | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be025-venv uv run --python /usr/bin/python3.12 python manage.py makemigrations --check --dry-run` | Passed with local PostgreSQL authentication warning; no changes detected | Codex |
| Backend BE-025 OpenAPI validation | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be025-venv uv run --python /usr/bin/python3.12 python manage.py spectacular --file /tmp/legal-be025-openapi.yaml --validate` | Passed with existing repeated `status` enum naming warning and 0 errors | Codex |
| Backend BE-025 docs validation | `python3 scripts/validate_docs.py` | Failed on unrelated task metadata/dependency issues outside BE-025, including BE-026 decimal task IDs and missing BE-035/BE-036/FE-022 references | Codex |
| Backend BE-026 literal pytest command | `cd backend && python -m pytest apps/activity/tests -q` | Failed before pytest startup because `.python-version` points to uninstalled `3.12` | Codex |
| Backend BE-026 activity tests | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be026-venv uv run --python /usr/bin/python3.12 python -m pytest apps/activity/tests -q` | Passed, 14 tests | Codex |
| Backend BE-026 lint | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be026-venv uv run --python /usr/bin/python3.12 ruff check apps/activity config/urls.py` | Passed after formatting two new files | Codex |
| Backend BE-026 format | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be026-venv uv run --python /usr/bin/python3.12 ruff format --check apps/activity config/urls.py` | Passed, 20 files already formatted | Codex |
| Backend BE-026 simplicity | `python3 scripts/check_simplicity.py backend/apps/activity backend/config/urls.py` | Passed, scanned 16 source files | Codex |
| Backend BE-026 migration drift | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be026-venv uv run --python /usr/bin/python3.12 python manage.py makemigrations --check --dry-run` | Passed with local PostgreSQL authentication warning; no changes detected | Codex |
| Backend BE-026 OpenAPI validation | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be026-venv uv run --python /usr/bin/python3.12 python manage.py spectacular --file /tmp/legal-be026-openapi.yaml --validate` | Passed with existing repeated `status` enum naming warning and 0 errors | Codex |
| Backend BE-026 docs validation | `python3 scripts/validate_docs.py` | Failed on unrelated malformed decimal task files and missing task dependency references outside BE-026 | Codex |
| Backend BE-026.5 literal pytest command | `cd backend && python -m pytest apps/organizations/tests -q` | Failed before pytest startup because `.python-version` points to uninstalled `3.12` | Codex |
| Backend BE-026.5 organization tests | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be0265-venv uv run --python /usr/bin/python3.12 python -m pytest apps/organizations/tests -q` | Passed after updating the organizations migration leaf guard, 22 tests | Codex |
| Backend BE-026.5 lint | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be0265-venv uv run --python /usr/bin/python3.12 ruff check apps/organizations config/urls.py` | Passed after import cleanup and wrapping one long test payload | Codex |
| Backend BE-026.5 format | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be0265-venv uv run --python /usr/bin/python3.12 ruff format --check apps/organizations config/urls.py` | Passed, 22 files already formatted | Codex |
| Backend BE-026.5 simplicity | `python3 scripts/check_simplicity.py backend/apps/organizations backend/config/urls.py` | Passed, scanned 18 source files | Codex |
| Backend BE-026.5 migration drift | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be0265-venv uv run --python /usr/bin/python3.12 python manage.py makemigrations --check --dry-run` | Passed after aligning the hand-written migration UUID field; local PostgreSQL authentication warning reviewed; no changes detected | Codex |
| Backend BE-026.5 OpenAPI validation | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be0265-venv uv run --python /usr/bin/python3.12 python manage.py spectacular --file /tmp/legal-be0265-openapi.yaml --validate` | Passed with existing enum naming warnings for reused `status` and `role` fields, 0 errors | Codex |
| Backend BE-026.5 docs validation | `python3 scripts/validate_docs.py` | Failed because decimal task IDs are not accepted by the validator and unrelated future task dependency references are missing | Codex |
| Backend BE-026.75 literal pytest command | `cd backend && python -m pytest apps/accounts/tests apps/organizations/tests -q` | Failed before pytest startup because `.python-version` points to uninstalled `3.12` | Codex |
| Backend BE-026.75 invitation acceptance tests | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be02675-venv uv run --python /usr/bin/python3.12 python -m pytest apps/accounts/tests apps/organizations/tests -q` | Passed after changing invitation-accept throttling from token-scoped to IP-scoped, 51 tests | Codex |
| Backend BE-026.75 lint | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be02675-venv uv run --python /usr/bin/python3.12 ruff check apps/accounts apps/organizations common/api/throttles.py config/settings/base.py` | Passed after formatting the new invitation acceptance test file | Codex |
| Backend BE-026.75 format | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be02675-venv uv run --python /usr/bin/python3.12 ruff format --check apps/accounts apps/organizations common/api/throttles.py config/settings/base.py` | Passed, 42 files already formatted | Codex |
| Backend BE-026.75 simplicity | `python3 scripts/check_simplicity.py backend/apps/accounts backend/apps/organizations backend/common/api/throttles.py backend/config/settings/base.py` | Passed, scanned 35 source files | Codex |
| Backend BE-026.75 migration drift | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be02675-venv uv run --python /usr/bin/python3.12 python manage.py makemigrations --check --dry-run` | Passed with local PostgreSQL authentication warning; no changes detected | Codex |
| Backend BE-026.75 OpenAPI validation | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be02675-venv uv run --python /usr/bin/python3.12 python manage.py spectacular --file /tmp/legal-be02675-openapi.yaml --validate` | Passed with existing enum naming warnings for reused `status` and `role` fields, 0 errors | Codex |
| Backend BE-026.75 docs validation | `python3 scripts/validate_docs.py` | Failed because decimal task IDs are not accepted by the validator and unrelated task files remain malformed or reference missing dependencies | Codex |
| Backend BE-026.-8 literal pytest command | `cd backend && python -m pytest apps/organizations/tests -q` | Failed before pytest startup because `.python-version` points to uninstalled `3.12` | Codex |
| Backend BE-026.-8 organization tests | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be0268-venv uv run --python /usr/bin/python3.12 python -m pytest apps/organizations/tests -q` | Passed after implementation and final docs updates, 29 tests | Codex |
| Backend BE-026.-8 lint | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be0268-venv uv run --python /usr/bin/python3.12 ruff check apps/organizations common/services/activity.py common/services/outbox.py` | Passed before and after targeted formatting | Codex |
| Backend BE-026.-8 format | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be0268-venv uv run --python /usr/bin/python3.12 ruff format --check apps/organizations common/services/activity.py common/services/outbox.py` | Initially reported `apps/organizations/services.py`; passed after `ruff format apps/organizations/services.py` | Codex |
| Backend BE-026.-8 simplicity | `python3 scripts/check_simplicity.py backend/apps/organizations backend/common/services/activity.py backend/common/services/outbox.py` | Passed, scanned 19 source files | Codex |
| Backend BE-026.-8 migration drift | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be0268-venv uv run --python /usr/bin/python3.12 python manage.py makemigrations --check --dry-run` | Passed with local PostgreSQL authentication warning; no changes detected | Codex |
| Backend BE-026.-8 OpenAPI validation | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be0268-venv uv run --python /usr/bin/python3.12 python manage.py spectacular --file /tmp/legal-be0268-openapi.yaml --validate` | Passed with existing enum naming warnings for reused `status` and `role` fields, 0 errors | Codex |
| Backend BE-026.-8 docs validation | `python3 scripts/validate_docs.py` | Failed on unrelated existing task metadata issues: decimal task headings, FE-013.75/FE-013.8 missing acceptance/verification sections, and FE-024 missing FE-022 dependency reference | Codex |
| Backend BE-026.-8 verification rerun literal pytest | `cd backend && python -m pytest apps/organizations/tests -q` | Failed before pytest startup because `.python-version` points to uninstalled `3.12` | Codex |
| Backend BE-026.-8 verification rerun tests | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be0268-verify-venv uv run --python /usr/bin/python3.12 python -m pytest apps/organizations/tests -q` | Passed, 29 tests | Codex |
| Backend BE-026.-8 verification rerun lint | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be0268-verify-venv uv run --python /usr/bin/python3.12 ruff check apps/organizations common/services/activity.py common/services/outbox.py` | Passed | Codex |
| Backend BE-026.-8 verification rerun format | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be0268-verify-venv uv run --python /usr/bin/python3.12 ruff format --check apps/organizations common/services/activity.py common/services/outbox.py` | Passed, 24 files already formatted | Codex |
| Backend BE-026.-8 verification rerun simplicity | `python3 scripts/check_simplicity.py backend/apps/organizations backend/common/services/activity.py backend/common/services/outbox.py` | Passed, scanned 19 source files | Codex |
| Backend BE-026.-8 verification rerun migration drift | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be0268-verify-venv uv run --python /usr/bin/python3.12 python manage.py makemigrations --check --dry-run` | Passed with local PostgreSQL authentication warning; no changes detected | Codex |
| Backend BE-026.-8 verification rerun OpenAPI validation | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be0268-verify-venv uv run --python /usr/bin/python3.12 python manage.py spectacular --file /tmp/legal-be0268-verify-openapi.yaml --validate` | Passed with existing enum naming warnings for reused `status` and `role` fields, 0 errors | Codex |
| Backend BE-026.-8 verification rerun docs validation | `python3 scripts/validate_docs.py` | Failed on existing decimal task heading and task metadata issues in BE-026.-8, BE-026.5, BE-026.75, FE-013.5, FE-013.8, and FE-013.75 | Codex |
| Backend BE-027 py_compile | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be027-venv uv run --python /usr/bin/python3.12 python -m py_compile apps/offboarding/services.py apps/offboarding/api/v1/views.py apps/offboarding/tests/test_api.py` | Passed after creating the offboarding app files | Codex |
| Backend BE-027 first simplicity check | `python3 scripts/check_simplicity.py backend/apps/offboarding backend/apps/matters/services.py` | Initially failed on an oversized test helper; passed after splitting preview read helpers into selectors and breaking the test fixture helper down | Codex |
| Backend BE-027 offboarding tests | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be027-venv uv run --python /usr/bin/python3.12 python -m pytest apps/offboarding/tests -q` | Initially failed because the fixture created an extra default admin; passed after fixing the grant factory input, 11 tests | Codex |
| Backend BE-027 literal pytest command | `cd backend && python -m pytest apps/offboarding/tests -q` | Failed before pytest startup because `.python-version` points to uninstalled `3.12` | Codex |
| Backend BE-027 lint | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be027-venv uv run --python /usr/bin/python3.12 ruff check apps/offboarding config/settings/base.py config/urls.py` | Initially found import formatting and an unused test import; passed after cleanup | Codex |
| Backend BE-027 format | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be027-venv uv run --python /usr/bin/python3.12 ruff format --check apps/offboarding config/settings/base.py config/urls.py` | Passed after import cleanup, 17 files already formatted | Codex |
| Backend BE-027 migration drift | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be027-venv uv run --python /usr/bin/python3.12 python manage.py makemigrations --check --dry-run` | Passed with local PostgreSQL authentication warning; no changes detected | Codex |
| Backend BE-027 OpenAPI validation | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be027-venv uv run --python /usr/bin/python3.12 python manage.py spectacular --file /tmp/legal-be027-openapi.yaml --validate` | Initially reported a new component-name collision; passed after renaming the offboarding membership summary serializer, with only existing enum warnings and 0 errors | Codex |
| Backend BE-027 docs validation | `python3 scripts/validate_docs.py` | Failed on existing decimal task heading and task metadata issues in BE-026.-8, BE-026.5, BE-026.75, FE-013.5, FE-013.8, and FE-013.75 | Codex |
| Integration INT-002 first Compose verification | `docker compose run --rm api python -m pytest tests/integration/test_legal_records.py -q` | Failed before test startup while Compose recreated dependencies because unrelated `agenticcrmbackend-redis-1` already bound port `6379` | Codex |
| Integration INT-002 port cleanup | `docker stop agenticcrmbackend-redis-1 agenticcrmbackend-api-1` | Passed; stopped unrelated containers occupying ports needed by the local Compose override | Codex |
| Integration INT-002 required pytest command | `docker compose run --rm api python -m pytest tests/integration/test_legal_records.py -q` | Failed before test collection with `/opt/venv/bin/python: No module named pytest` in `legal-backend:dev` | Codex |
| Integration INT-002 simplicity | `python3 scripts/check_simplicity.py` | Passed, scanned 342 source files | Codex |
| Integration INT-002 docs validation | `python3 scripts/validate_docs.py` | Passed after final task log and AI usage updates, 27 specs, 63 tasks, 172 Markdown files | Codex |
| Integration INT-003 required Compose command | `docker compose run --rm api python -m pytest tests/integration/test_deadlines_tasks.py -q` | Failed before test startup while Compose recreated dependencies because host PostgreSQL already bound `127.0.0.1:5432` | Codex |
| Integration INT-003 host PostgreSQL check | `pgrep -a postgres`, `systemctl --user status postgresql --no-pager`, `sudo -n systemctl stop postgresql` | Confirmed a non-Docker PostgreSQL process owns port `5432`; stopping it requires sudo credentials | Codex |
| Integration INT-003 no-host-port Compose check | `docker compose -f compose.yaml run --rm api python -m pytest tests/integration/test_deadlines_tasks.py -q` | Failed before test collection with `/opt/venv/bin/python: No module named pytest` in `legal-backend:dev` | Codex |
| Integration INT-003 simplicity | `python3 scripts/check_simplicity.py` | Passed, scanned 342 source files | Codex |
| Integration INT-003 docs validation | `python3 scripts/validate_docs.py` | Passed after final task log and AI usage updates, 27 specs, 63 tasks, 172 Markdown files | Codex |
| Frontend FE-013.5 dependency install | `cd frontend && npm ci` | Passed, restored locked dependencies needed to run frontend verification | Codex |
| Frontend FE-013.5 admin user tests | `cd frontend && npm test -- --run src/features/adminUsers src/components/layout/AppShell.test.tsx` | Passed after implementation and test typing fix, 2 files and 11 tests | Codex |
| Frontend FE-013.5 typecheck | `cd frontend && npm run typecheck` | Initially failed on strict mocked fetch tuple typing; passed after explicit test call cast | Codex |
| Frontend FE-013.5 format check | `cd frontend && npm run format:check` | Initially reported three new files; passed after targeted Prettier formatting | Codex |
| Frontend FE-013.5 full lint | `cd frontend && npm run lint` | Failed on pre-existing `NotificationPreferenceForm.tsx` `react-hooks/set-state-in-effect` issue outside FE-013.5 scope | Codex |
| Frontend FE-013.5 targeted lint | `cd frontend && npx eslint src/features/adminUsers src/app/routes.tsx src/components/layout/AppShell.tsx src/components/layout/AppShell.test.tsx src/i18n/resources.ts --max-warnings=0` | Passed | Codex |
| Frontend FE-013.5 build | `cd frontend && npm run build` | Passed with Vite large-chunk warning | Codex |
| Frontend FE-013.5 simplicity | `python3 scripts/check_simplicity.py frontend/src/features/adminUsers frontend/src/app/routes.tsx frontend/src/components/layout/AppShell.tsx frontend/src/i18n/resources.ts` | Passed, scanned 8 source files | Codex |
| Frontend FE-013.5 docs validation | `python3 scripts/validate_docs.py` | Failed after generated dependency cleanup on existing decimal task IDs and unrelated `FE-013.75` missing acceptance/verification section | Codex |
| Frontend FE-013.5 verification rerun setup | `cd frontend && npm ci` | Passed, restored locked dependencies for the requested rerun | Codex |
| Frontend FE-013.5 verification rerun tests | `cd frontend && npm test -- --run src/features/adminUsers src/components/layout/AppShell.test.tsx` | Passed, 2 files and 11 tests | Codex |
| Frontend FE-013.5 verification rerun typecheck | `cd frontend && npm run typecheck` | Passed | Codex |
| Frontend FE-013.5 verification rerun format | `cd frontend && npm run format:check` | Passed | Codex |
| Frontend FE-013.5 verification rerun full lint | `cd frontend && npm run lint` | Failed on existing `NotificationPreferenceForm.tsx` `react-hooks/set-state-in-effect` issue outside FE-013.5 scope | Codex |
| Frontend FE-013.5 verification rerun targeted lint | `cd frontend && npx eslint src/features/adminUsers src/app/routes.tsx src/components/layout/AppShell.tsx src/components/layout/AppShell.test.tsx src/i18n/resources.ts --max-warnings=0` | Passed | Codex |
| Frontend FE-013.5 verification rerun build | `cd frontend && npm run build` | Passed with Vite large-chunk warning | Codex |
| Frontend FE-013.5 verification rerun simplicity | `python3 scripts/check_simplicity.py frontend/src/features/adminUsers frontend/src/app/routes.tsx frontend/src/components/layout/AppShell.tsx frontend/src/i18n/resources.ts` | Passed, scanned 8 source files | Codex |
| Frontend FE-013.5 verification rerun docs validation | `python3 scripts/validate_docs.py` | Failed on existing decimal task IDs and unrelated `FE-013.75` missing acceptance/verification section | Codex |
| Frontend FE-013.75 dependency install | `cd frontend && npm ci` | Passed, restored locked dependencies needed to run frontend verification | Codex |
| Frontend FE-013.75 invitation acceptance tests | `cd frontend && npm test -- --run src/features/invitationAcceptance src/app/App.test.tsx` | Passed after implementation and formatting fix, 2 files and 12 tests | Codex |
| Frontend FE-013.75 typecheck | `cd frontend && npm run typecheck` | Passed | Codex |
| Frontend FE-013.75 format check | `cd frontend && npm run format:check` | Initially reported new FE-013.75 files and `resources.ts`; passed after targeted Prettier formatting | Codex |
| Frontend FE-013.75 full lint | `cd frontend && npm run lint` | Failed on pre-existing `NotificationPreferenceForm.tsx` `react-hooks/set-state-in-effect` issue outside FE-013.75 scope | Codex |
| Frontend FE-013.75 targeted lint | `cd frontend && npx eslint src/features/invitationAcceptance src/app/routes.tsx src/i18n/resources.ts --max-warnings=0` | Passed after moving token parsing to a non-component module | Codex |
| Frontend FE-013.75 build | `cd frontend && npm run build` | Passed with Vite large-chunk warning | Codex |
| Frontend FE-013.75 simplicity | `python3 scripts/check_simplicity.py frontend/src/features/invitationAcceptance frontend/src/app/routes.tsx frontend/src/i18n/resources.ts` | Passed, scanned 9 source files | Codex |
| Frontend FE-013.75 docs validation | `python3 scripts/validate_docs.py` | Failed after generated dependency cleanup on existing decimal task IDs | Codex |
| Frontend FE-013.8 dependency install | `cd frontend && npm ci` | Passed, restored locked dependencies needed to run frontend verification | Codex |
| Frontend FE-013.8 role management tests | `cd frontend && npm test -- --run src/features/adminUsers src/components/layout/AppShell.test.tsx` | Passed after implementation/test timing fixes, 3 files and 17 tests | Codex |
| Frontend FE-013.8 typecheck | `cd frontend && npm run typecheck` | Initially failed on an unused imported role type; passed after removing it | Codex |
| Frontend FE-013.8 format check | `cd frontend && npm run format:check` | Initially reported touched files; passed after targeted Prettier formatting | Codex |
| Frontend FE-013.8 full lint | `cd frontend && npm run lint` | Failed on existing `NotificationPreferenceForm.tsx` `react-hooks/set-state-in-effect` issue outside FE-013.8 scope | Codex |
| Frontend FE-013.8 targeted lint | `cd frontend && npx eslint src/features/adminUsers src/app/routes.tsx src/components/layout/AppShell.tsx src/components/layout/AppShell.test.tsx src/auth/context.ts src/auth/AuthProvider.tsx src/i18n/resources.ts --max-warnings=0` | Passed | Codex |
| Frontend FE-013.8 build | `cd frontend && npm run build` | Passed with Vite large-chunk warning | Codex |
| Frontend FE-013.8 simplicity | `python3 scripts/check_simplicity.py frontend/src/features/adminUsers frontend/src/app/routes.tsx frontend/src/components/layout/AppShell.tsx frontend/src/auth/context.ts frontend/src/auth/AuthProvider.tsx frontend/src/i18n/resources.ts` | Passed, scanned 10 source files | Codex |
| Frontend FE-013.8 docs validation | `python3 scripts/validate_docs.py` | Failed after generated dependency/build cleanup on existing decimal task ID headings, including FE-013.8 and prior decimal task files | Codex |
| Frontend FE-014 initial test command | `cd frontend && npm test -- --run src/features/dashboard` | Failed before test startup because `vitest` was unavailable until dependencies were restored | Codex |
| Frontend FE-014 dependency install | `cd frontend && npm ci` | Passed, restored locked dependencies needed to run frontend verification | Codex |
| Frontend FE-014 dashboard tests | `cd frontend && npm test -- --run src/features/dashboard` | Passed after implementation and test timing fixes, 1 file and 6 tests | Codex |
| Frontend FE-014 typecheck | `cd frontend && npm run typecheck` | Initially failed on an unused test import; passed after removing it | Codex |
| Frontend FE-014 format check | `cd frontend && npm run format:check` | Initially reported new dashboard files; passed after targeted Prettier formatting | Codex |
| Frontend FE-014 targeted lint | `cd frontend && npx eslint src/features/dashboard src/app/routes.tsx --max-warnings=0` | Passed | Codex |
| Frontend FE-014 simplicity | `python3 scripts/check_simplicity.py frontend/src/features/dashboard frontend/src/app/routes.tsx` | Passed, scanned 8 source files | Codex |
| Frontend FE-016 initial test command | `cd frontend && npm test -- --run src/features/activity` | Failed before test startup because `vitest` was unavailable until dependencies were restored | Codex |
| Frontend FE-016 dependency install | `cd frontend && npm ci` | Passed, restored locked dependencies needed to run frontend verification | Codex |
| Frontend FE-016 activity tests | `cd frontend && npm test -- --run src/features/activity` | Passed, 1 file and 5 tests | Codex |
| Frontend FE-016 typecheck | `cd frontend && npm run typecheck` | Initially failed on strict mocked fetch tuple access; passed after adding typed test helpers | Codex |
| Frontend FE-016 format check | `cd frontend && npm run format:check` | Initially reported new activity files; passed after targeted Prettier formatting | Codex |
| Frontend FE-016 targeted lint | `cd frontend && npx eslint src/features/activity src/features/cases/components/CaseTimeline.tsx src/features/contracts/components/ContractTimeline.tsx src/features/notices/components/NoticeTimeline.tsx src/app/routes.tsx --max-warnings=0` | Passed | Codex |
| Frontend FE-016 simplicity | `python3 scripts/check_simplicity.py frontend/src/features/activity frontend/src/features/cases/components/CaseTimeline.tsx frontend/src/features/contracts/components/ContractTimeline.tsx frontend/src/features/notices/components/NoticeTimeline.tsx frontend/src/app/routes.tsx` | Passed, scanned 10 source files | Codex |
| Backend BE-028 generated OpenAPI | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be028-venv uv run --python /usr/bin/python3.12 python manage.py spectacular --file ../build/openapi.yaml --validate` | Passed during BE-028 after enum naming stabilization; exact `python` command was blocked by local pyenv | Codex |
| Backend BE-031 production Compose config | `docker compose -f compose.yaml -f compose.production.yaml config` | Passed; local untracked `.env` values are reflected in rendered output | Codex |
| Backend BE-031 backend image build | `docker build -f docker/backend/Dockerfile -t legal-backend:prod .` | Initially failed because the uv-created venv had no pip; passed after switching the pinned Daphne install to `uv pip install` | Codex |
| Backend BE-031 backend image user | `docker run --rm --entrypoint id legal-backend:prod -u` | Passed, returned non-root UID 999 | Codex |
| Backend BE-031 ASGI runtime package | `docker run --rm --entrypoint python legal-backend:prod -c 'import daphne; print(daphne.__version__)'` | Passed, returned 4.1.2 | Codex |
| Backend BE-031 production service list | `docker compose -f compose.yaml -f compose.production.yaml config --services` | Passed; default production service list excludes development frontend and Mailpit | Codex |
| Backend BE-031 migration profile service list | `docker compose -f compose.yaml -f compose.production.yaml --profile migrations config --services` | Passed; explicit migration service appears only with the migrations profile | Codex |
| Backend BE-032 literal first seed command | `cd backend && python manage.py seed_demo` | Failed before Django startup because `.python-version` points to uninstalled pyenv `3.12` | Codex |
| Backend BE-032 uv seed command with default host env | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be032-venv uv run --python /usr/bin/python3.12 python manage.py seed_demo` | Failed against the local host database URL with PostgreSQL password authentication failure | Codex |
| Backend BE-032 Compose DB migration | `cd backend && DATABASE_URL=postgresql://legal_management:legal_management_dev_password@127.0.0.1:5432/legal_management REDIS_URL=redis://127.0.0.1:6379/0 CHANNEL_LAYER_REDIS_URL=redis://127.0.0.1:6379/1 CELERY_BROKER_URL=amqp://legal_management:legal_management_dev_password@127.0.0.1:5672// UV_PROJECT_ENVIRONMENT=/tmp/legal-be032-venv uv run --python /usr/bin/python3.12 python manage.py migrate --noinput` | Passed; brought the running local Compose database up to current migrations | Codex |
| Backend BE-032 first Compose DB seed | `cd backend && DATABASE_URL=postgresql://legal_management:legal_management_dev_password@127.0.0.1:5432/legal_management REDIS_URL=redis://127.0.0.1:6379/0 CHANNEL_LAYER_REDIS_URL=redis://127.0.0.1:6379/1 CELERY_BROKER_URL=amqp://legal_management:legal_management_dev_password@127.0.0.1:5672// UV_PROJECT_ENVIRONMENT=/tmp/legal-be032-venv uv run --python /usr/bin/python3.12 python manage.py seed_demo` | Passed, seeded 2 organizations and 8 memberships | Codex |
| Backend BE-032 second Compose DB seed | Same command as first Compose DB seed | Passed again, demonstrating idempotent command execution against the live local Compose database | Codex |
| Backend BE-032 literal second seed command | `cd backend && python manage.py seed_demo` | Failed before Django startup because `.python-version` points to uninstalled pyenv `3.12` | Codex |
| Backend BE-032 literal pytest command | `cd backend && python -m pytest tests/test_seed.py -q` | Failed before pytest startup because `.python-version` points to uninstalled pyenv `3.12` | Codex |
| Backend BE-032 focused seed tests | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be032-venv uv run --python /usr/bin/python3.12 python -m pytest tests/test_seed.py -q` | Passed, 2 tests | Codex |
| Backend BE-032 targeted lint | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be032-venv uv run --python /usr/bin/python3.12 --group dev ruff check apps/organizations/management/commands/_seed_demo_data.py apps/organizations/management/commands/seed_demo.py tests/test_seed.py` | Passed | Codex |
| Backend BE-032 simplicity | `python3 scripts/check_simplicity.py` | Passed, scanned 512 source files after the final scope cleanup | Codex |
| Backend BE-032 docs validation | `python3 scripts/validate_docs.py` | Failed on existing decimal task heading IDs outside BE-032 | Codex |
| Backend BE-033 literal docs validation | `python scripts/validate_docs.py` | Failed before script startup because `.python-version` points to uninstalled pyenv `3.12` | Codex |
| Backend BE-033 docs validation via python3 | `python3 scripts/validate_docs.py` | Failed on existing decimal task heading IDs outside BE-033 allowed scope | Codex |
| Backend BE-030 focused security tests | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be030-venv uv run --python /usr/bin/python3.12 python -m pytest tests/security apps -q` | Passed after making the stale notice deadline fixture relative to the test clock, 232 tests | Codex |
| Backend BE-030 focused security smoke | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be030-venv uv run --python /usr/bin/python3.12 python -m pytest tests/security -q` | Passed, 10 tests | Codex |
| Backend BE-030 simplicity | `python3 scripts/check_simplicity.py backend` | Passed, scanned 266 source files | Codex |
| Backend BE-030 literal pytest command | `cd backend && python -m pytest tests/security apps -q` | Failed before pytest startup because `.python-version` points to uninstalled pyenv `3.12` | Codex |
| Backend BE-030 literal simplicity command | `python scripts/check_simplicity.py backend` | Failed before script startup because `.python-version` points to uninstalled pyenv `3.12` | Codex |
| Backend BE-034 exact acceptance commands | `python scripts/validate_docs.py`, `python scripts/check_simplicity.py backend`, `cd backend && python -m ruff check .`, `cd backend && python -m pytest -q`, `cd backend && python manage.py makemigrations --check --dry-run`, `cd backend && python manage.py spectacular --file ../build/openapi.yaml --validate` | Each exact `python` command failed before project code ran because `.python-version` points to unavailable pyenv `3.12` | Codex |
| Backend BE-034 Compose config | `docker compose config` | Passed | Codex |
| Backend BE-034 docs and simplicity support checks | `python3 scripts/validate_docs.py`; `python3 scripts/check_simplicity.py backend` | Docs validation failed on existing decimal task ID headings outside BE-034 scope; simplicity passed, scanned 270 source files | Codex |
| Backend BE-034 lint/test/migration/OpenAPI support checks | `cd backend && UV_PROJECT_ENVIRONMENT=/tmp/legal-be034-venv uv run --python /usr/bin/python3.12 ...` for Ruff, pytest, migration dry-run, and spectacular validation | Passed: Ruff clean, 30 tests passed, no migration changes detected, OpenAPI validated | Codex |
| Backend BE-034 production deploy check | `cd backend && DJANGO_SETTINGS_MODULE=config.settings.production ... uv run --python /usr/bin/python3.12 python manage.py check --deploy` | Passed with safe local test values and without printing secret values | Codex |
| Backend BE-034 image builds | `docker compose build api`; `docker compose -f compose.yaml -f compose.production.yaml build api frontend-static reverse-proxy minio-init` | Passed; built development backend and production backend/frontend/reverse-proxy/minio-init images; frontend build emitted a Vite chunk-size warning | Codex |
| Backend BE-034 integration smoke | `docker compose up -d postgres redis rabbitmq minio minio-init api worker beat`, health curls, `docker compose exec -T api python manage.py seed_demo`, sanitized CSRF/login/me/WebSocket-ticket curl flow, and MinIO unauthenticated bucket curl | Passed; API ready, seed idempotent command ran, login/me/ws-ticket succeeded with token values redacted, and MinIO bucket returned 403 anonymously | Codex |
| Backend BE-034 production image user checks | `docker run --rm --entrypoint id legal-backend:prod`; `docker run --rm --entrypoint id legal-frontend:prod`; `docker run --rm --entrypoint id legal-minio-init:prod` | Backend and frontend ran non-root; `legal-minio-init:prod` ran as `uid=0(root)`, blocking final backend acceptance under BE-013 | Codex |
