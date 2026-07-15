# Legal Management Module

This repository contains a specification-driven Legal Management Module implementation and the evidence trail used to build it one reviewable task at a time.

The backend is a Django modular monolith with DRF, Channels, Celery, PostgreSQL, Redis, RabbitMQ, and MinIO. The frontend is a React, TypeScript, Vite application. The project keeps the original specs, guardrails, atomic tasks, and AI usage evidence alongside the implementation so a reviewer can trace decisions and verification.

## Chosen architecture

- Modular monolith
- Django + Django REST Framework
- React + TypeScript + Vite
- PostgreSQL as the source of truth
- MinIO for private object storage with presigned uploads and downloads
- Redis for cache, throttling, short-lived WebSocket tickets, and the Channels layer
- RabbitMQ as the Celery broker
- Celery + Celery Beat for background and scheduled work
- Django Channels for server-to-client realtime status events
- JWT access tokens and rotated refresh tokens
- `django-filter` for explicit filtering
- `drf-spectacular` for OpenAPI, with schema declarations owned by each domain
- English and Persian localization; dates are stored in Gregorian/UTC form and displayed as Jalali where required

## Non-negotiable simplicity rules

This project prioritizes code that is obvious during review.

- No multiple inheritance.
- No polymorphic domain models or serializer hierarchies.
- No `GenericForeignKey` or Django content-types for domain relationships.
- No custom metaclasses, abstract factories, service containers, or auto-registration magic.
- No repository pattern, CQRS, event sourcing, or microservices.
- No Django signals for business workflows.
- Services and selectors are plain module-level functions.
- Domain classes extend exactly one project base class or one framework base class.
- Small, explicit duplication is preferred over a clever abstraction.
- Functions should normally be 25 lines or fewer and must not exceed 40 executable lines without an approved exception.

Read [AGENTS.md](AGENTS.md) before making changes.

## Reviewer Start Here

1. For backend setup and operations, read [backend/README.md](backend/README.md).
2. For frontend setup, delivery, auth storage, realtime, localization, and production image notes, read [frontend/README.md](frontend/README.md).
3. For AI usage, mistakes, corrections, and verification evidence, read [AI_USAGE.md](AI_USAGE.md).
4. For architecture and constraints, read [AGENTS.md](AGENTS.md), [backend/AGENTS.md](backend/AGENTS.md), [frontend/AGENTS.md](frontend/AGENTS.md), and [docs/tech/01-architecture.md](docs/tech/01-architecture.md).
5. For product scope, read [docs/business/06-mvp-scope.md](docs/business/06-mvp-scope.md).
6. For task traceability, read [tasks/ORDER.md](tasks/ORDER.md) and the relevant task file.

The repository contains 27 approved behavior specifications and the atomic backend, frontend, and integration tasks used during implementation.

## Repository map

```text
.
├── AGENTS.md                     Global Codex rules
├── CODEX_START_HERE.md           Safe prompts and working loop
├── AI_USAGE.md                   Required assignment evidence template
├── docs/
│   ├── business/                 Product requirements and workflows
│   ├── guardrails/               Simplicity, security, API, and testing rules
│   ├── tech/                     Architecture and implementation decisions
│   ├── decisions/                Accepted ADRs
│   ├── templates/                Spec, task, ADR, and review templates
│   └── traceability/             Requirement IDs and definition of done
├── specs/
│   ├── backend/                  Backend behavior specifications
│   └── frontend/                 Frontend behavior specifications
├── tasks/
│   ├── backend/                  Atomic backend tasks
│   ├── frontend/                 Atomic frontend tasks
│   └── integration/              Cross-stack verification tasks
├── backend/                      Django backend implementation and README
├── frontend/                     React frontend implementation
├── infra/                        Deployment support files
├── scripts/                      Documentation and simplicity checks
└── .codex/prompts/               Reusable Codex prompts
```

## MVP delivery order

The critical path is:

1. Repository foundation and CI
2. Authentication, organization membership, and permission boundaries
3. Cases, contracts, and notices
4. Deadlines and tasks
5. Presigned document upload and realtime status
6. Audit trail, notifications, dashboard, and offboarding
7. Security tests, OpenAPI validation, seed data, README, and presentation evidence

## Backend quality checks

A reviewer can run the backend checks below. In this local checkout, plain `python` may fail if pyenv does not have `3.12` installed; use `/usr/bin/python3.12` through `uv` as shown in [backend/README.md](backend/README.md).

```bash
python scripts/validate_docs.py
python scripts/check_simplicity.py backend
cd backend
uv sync --locked --all-groups
uv run ruff format --check .
uv run ruff check .
uv run python -m pytest -q
DJANGO_SETTINGS_MODULE=config.settings.test uv run python manage.py makemigrations --check --dry-run
DJANGO_SETTINGS_MODULE=config.settings.test uv run python manage.py spectacular --file ../build/openapi.yaml --validate
```

Production deploy checks also run in CI with safe placeholder environment values:

```bash
cd backend
DJANGO_SETTINGS_MODULE=config.settings.production uv run python manage.py check --deploy
```

## Frontend quality checks

A reviewer can run the frontend checks below. `npm run build` creates `frontend/dist/`; remove that generated directory before running the simplicity scan so the guard reviews source rather than bundled third-party code.

```bash
python scripts/validate_docs.py
cd frontend && npm ci
cd frontend && npm run lint
cd frontend && npm run typecheck
cd frontend && npm test -- --run
cd frontend && npm run build
rm -rf frontend/dist
python scripts/check_simplicity.py frontend
docker build -f docker/frontend/Dockerfile -t legal-frontend:prod .
docker compose -f compose.yaml -f compose.production.yaml config
```

## Source assignment coverage

The plans cover authentication and roles, legal cases, contracts, notices, deadlines, tasks, documents, audit logs, dashboard, reassignment/offboarding, Persian date handling, seed data, tests, setup instructions, and required AI usage documentation.
Discussions, financial records, OCR, semantic search, and enterprise workflow orchestration are explicitly deferred from the MVP.

## Evidence Notes

Task IDs use canonical integer forms such as `BE-036` and `FE-024`. Older decimal task IDs were renumbered during the Compose integration test-runner repair so `python scripts/validate_docs.py` can validate repository metadata without weakening the validator.
