# Requirement catalog

## Assignment requirements

- **ASSIGN-001** Support Legal Admin, Legal Manager, Legal Counsel / Case Lead, and Viewer with clear boundaries.
- **ASSIGN-002** Manage legal cases with title, reference, type, status, priority, owner, parties, description, dates, documents, and timeline.
- **ASSIGN-003** Manage contracts with title, type, counterparty, status, owner, effective/expiration/renewal dates, documents, and key terms.
- **ASSIGN-004** Manage legal notices with sender, received date, response deadline, status, and related entities.
- **ASSIGN-005** Provide deadline views for upcoming, overdue, today, and assigned-to-me.
- **ASSIGN-006** Manage linked tasks with assignee, due date, and status.
- **ASSIGN-007** Store document metadata and enforce record permissions.
- **ASSIGN-008** Log critical actions with actor and timestamp.
- **ASSIGN-009** Provide a permission-aware dashboard.
- **ASSIGN-010** Support reassignment and preferably bulk offboarding.
- **ASSIGN-011** Support Persian date handling where relevant.
- **ASSIGN-012** Include setup, seed data, migrations/schema, tests, README, and AI usage evidence.

## Candidate architecture requirements

- **ARCH-001** Modular monolith.
- **ARCH-002** Django/DRF, React/TypeScript, PostgreSQL, MinIO, Redis, RabbitMQ, Celery, and Channels.
- **ARCH-003** JWT authentication.
- **ARCH-004** ModelViewSets, ModelSerializers, django-filter, and project-owned base classes.
- **ARCH-005** Function-based services and selectors.
- **ARCH-006** Domain-owned OpenAPI declaration files.
- **ARCH-007** Direct MinIO upload through presigned URLs and realtime status through WebSocket.
- **ARCH-008** Development and production settings modules plus one environment key set.
- **ARCH-009** Localization using lazy backend translations and English/Persian frontend support.
- **ARCH-010** No multiple inheritance, complex function frameworks, or polymorphic domain code.

See `docs/business/05-domain-rules.md` for BR-001 through BR-040.
