# BE-013: Security hardening, Docker, seed data, and delivery

- Status: Approved
- Priority: P0
- Requirements: ASSIGN-012, ARCH-008, all security BRs
- Depends on: all backend P0 specs

## Intent

Deliver a reproducible, secure, reviewable backend that starts through Docker, demonstrates roles and data, and passes focused security verification.

## Docker and settings

- Multi-stage non-root backend image.
- One image reused by API, worker, Beat, and migration commands.
- Development and production Compose overlays.
- Explicit one-off migration service.
- One Beat replica.
- Health checks and private infrastructure networks.
- Production settings hardcode secure behavior.
- `check --deploy` passes for production settings with valid test environment values.

## Seed data

An idempotent management command creates:

- one primary organization and one second isolation-test/demo organization;
- Admin, Manager, Counsel owner, Counsel grantee, Viewer, and unrelated users;
- representative cases, contracts, notices, deadlines, tasks, upload/document metadata where safe, activity, and notification preferences;
- credentials documented only as development/demo values.

Do not seed real personal or legal information.

## Security verification

- Cross-organization IDOR suite.
- Role matrix.
- JWT rotation/logout/CSRF.
- Rate limits.
- Presigned upload/download policy.
- WebSocket one-time ticket and origin/group isolation.
- Sensitive logging review.
- Offboarding rollback and idempotency.
- Dependency and secret checks where available.

## Documentation

Backend README includes:

- prerequisites;
- environment setup;
- Docker and local commands;
- migration and seed commands;
- test/lint/OpenAPI commands;
- architecture summary;
- demo accounts;
- security decisions and known limitations.

## Acceptance criteria

- [ ] Development stack starts from documented commands.
- [ ] Production images build and run as non-root.
- [ ] API, worker, Beat, PostgreSQL, Redis, RabbitMQ, and MinIO health behavior is documented/tested.
- [ ] Seed command is repeatable.
- [ ] Full backend suite, OpenAPI validation, simplicity check, and deploy checks pass.
- [ ] No secret or `.env` is committed.
- [ ] README and AI usage evidence are complete and truthful.
- [ ] Known limitations explicitly include no malware scanner, legal hold, semantic search, or production SMS/push unless actually implemented.

## Related tasks

- BE-005, BE-006, BE-030, BE-031, BE-032, BE-033, BE-034, BE-042
