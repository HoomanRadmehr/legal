# Testing and quality tooling

## Backend

- Ruff for formatting/linting or an equally simple single-tool policy.
- Static type checking may be introduced incrementally but must not delay core security tests.
- pytest and pytest-django.
- factory_boy or small explicit factories.
- Coverage report focused on critical modules, not a vanity target.

## Frontend

- TypeScript strict check.
- ESLint with a small standard configuration.
- Prettier or the selected formatter.
- Vitest and React Testing Library.
- Production build as a required CI check.

## Shared checks

- `scripts/validate_docs.py` validates required files, task IDs, and links.
- `scripts/check_simplicity.py` detects multiple inheritance and selected prohibited Python patterns.
- OpenAPI generation and validation.
- Docker image build.
- Secret scan if available in the CI environment.

## CI stages

1. Documentation and guardrail checks.
2. Backend lint/type/test/OpenAPI.
3. Frontend lint/type/test/build.
4. Docker build.
5. Optional integration profile for PostgreSQL, Redis, RabbitMQ, and MinIO.
