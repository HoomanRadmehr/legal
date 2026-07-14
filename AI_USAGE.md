# AI usage record

This file is required by the assignment. Record only tools and prompts actually used.
Do not claim that a tool verified code unless its output was reviewed.

## 1. Tools used

| Tool | Purpose | Where used |
|---|---|---|
| Codex | Read task/spec guardrails, scaffolded backend and frontend foundations, generated lock files, implemented settings validation, common API primitives, health endpoints, OpenAPI components, logging redaction, Docker Compose infrastructure, backend CI, guard checks, the custom user model, organization tenancy models, explicit role and matter permission functions, JWT auth endpoints, authentication throttles, one-time WebSocket tickets, the typed frontend API client, the frontend app shell providers/router/states, and the localization/component foundation, and reviewed verification output | BE-001 through BE-011 backend foundation; FE-001 through FE-003 and FE-006 frontend foundation |
| ChatGPT | Requirements and architecture planning | Initial specification starter |
| Other | TODO | TODO |

## 2. Development workflow

Describe the actual workflow. Suggested headings:

1. Requirement breakdown
2. Architecture and schema planning
3. Task-by-task implementation
4. Review of generated code
5. Testing and verification
6. Refactoring decisions

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

FE-006 update: Codex read the root/frontend AGENTS files, `FE-000`, `FE-011`, and relevant frontend architecture/security/testing/dependency/workflow docs; added i18next common namespace resources, document language/direction switching, an `Accept-Language` helper, technical value direction isolation, and small visual page header, table, badge, dialog, and form error components; and reviewed verification output before marking the task done.

BE-008 update: Codex read the root/backend AGENTS files, `BE-002`, `BE-013`, and relevant backend architecture/data-model/security/tenancy/localization/testing/common-base docs; added explicit organization and membership models, canonical choices, timezone validation, organization-scoped selectors, factories, migration, and focused tests; and reviewed verification output before marking the task done.

BE-009 update: Codex read the root/backend AGENTS files, `BE-001`, and relevant JWT/security/API/testing/localization/OpenAPI docs; added CSRF bootstrap, login, refresh rotation, logout, and current-user endpoints; wired Simple JWT blacklist support, refresh cookie attributes, URL routing, stable auth error codes, OpenAPI declarations, and focused auth API tests; and reviewed verification output before marking the task done.

BE-010 update: Codex read the root/backend AGENTS files, `BE-001`, `BE-009`, and relevant JWT/realtime/rate-limiting/security/API/testing/localization docs; added explicit login, refresh, and WebSocket ticket throttles; added short-lived one-time WebSocket ticket helpers; documented 429 responses and `Retry-After`; added focused auth tests for throttle envelopes, hashed login identifiers, ticket entropy/TTL, one-time consumption, and JWT exclusion from ticket URLs; and reviewed verification output before marking the task done.

BE-011 update: Codex read the root/backend AGENTS files, `BE-002`, and relevant backend architecture/data-model/security/API-error/testing/localization/common-base docs; added a small common permission base, explicit organization role helpers, an active membership resolver wrapper, matter visibility/edit permission functions, a matter permission class that returns not-visible behavior for hidden matters, and role matrix tests with two organizations; and reviewed verification output before marking the task done.

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
Implement only [BE-011-implement-explicit-role-and-matter-permission-functions.md](tasks/backend/BE-011-implement-explicit-role-and-matter-permission-functions.md) 
First read the root and nearest nested AGENTS.md, the task file, every linked spec,
and the relevant guardrails. Before editing, provide a concise implementation plan and
list the files you expect to change. Keep the implementation explicit and standard:
no multiple inheritance, no polymorphic domain code, no GenericForeignKey, no signals
for business workflows, no service classes, and no complex functions. Run every command
listed in the task's verification section. Update the task execution note and AI_USAGE.md.
Do not start another task.
```

**Result used:** Added BE-011 explicit role and matter permission functions only, with focused role matrix and not-visible behavior tests.

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

## 5. Decisions made personally

Document professional judgment that was not delegated to the AI. Examples may include:

- Selecting a modular monolith for the 1-2 day timebox.
- Rejecting Qdrant, Temporal, LangGraph, microservices, and generic relation frameworks.
- Requiring explicit permission-scoped selectors.
- Choosing direct MinIO uploads with short-lived presigned URLs.
- Choosing plain function-based services and selectors.
- Choosing simple code over maximum abstraction.

Replace examples with the candidate's actual decisions and reasoning.

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
| OpenAPI validation | TODO | TODO | TODO |
| Docker build | TODO | TODO | TODO |
| Security tests | TODO | TODO | TODO |
