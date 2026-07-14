# Legal Management Module - Codex Starter

This repository is a **specification-first implementation starter** for the Legal Management Module coding assignment.
It intentionally contains plans, constraints, acceptance criteria, task breakdowns, and repository guardrails rather than a generated application.
The goal is to let Codex implement the system one small, reviewable task at a time.

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

## Start here

1. Read [CODEX_START_HERE.md](CODEX_START_HERE.md).
2. Read the root [AGENTS.md](AGENTS.md), then the nested `AGENTS.md` for the area being changed.
3. Read [docs/business/06-mvp-scope.md](docs/business/06-mvp-scope.md).
4. Read [tasks/README.md](tasks/README.md), [tasks/ORDER.md](tasks/ORDER.md), and [tasks/INDEX.md](tasks/INDEX.md).
5. Execute exactly one task at a time.
6. Update the task status and `AI_USAGE.md` after each completed task.

The starter contains 27 approved behavior specifications and 63 atomic backend, frontend, and integration tasks.

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
├── backend/                      Backend implementation target
├── frontend/                     Frontend implementation target
├── infra/                        Docker and deployment target
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

The backend CI runs the same explicit checks a reviewer can run locally:

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

## Source assignment coverage

The plans cover authentication and roles, legal cases, contracts, notices, deadlines, tasks, documents, audit logs, dashboard, reassignment/offboarding, Persian date handling, seed data, tests, setup instructions, and required AI usage documentation.
Discussions, financial records, OCR, semantic search, and enterprise workflow orchestration are explicitly deferred from the MVP.
