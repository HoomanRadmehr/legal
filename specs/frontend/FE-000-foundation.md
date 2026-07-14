# FE-000: Frontend foundation and code structure

- Status: Approved
- Priority: P0
- Requirements: ARCH-001, ARCH-002, ARCH-006, ARCH-008, ARCH-010, ASSIGN-012
- Depends on: BE-000 contract conventions

## Intent

Create a strict TypeScript React foundation that keeps domain screens explicit, consumes the OpenAPI contract safely, and remains easy to review.

## In scope

- Vite React TypeScript project under `frontend/`.
- Strict TypeScript, routing, app providers, TanStack Query, React Hook Form, Zod, i18next, one UI library, test setup, and production build.
- Typed fetch client and standard backend error parser.
- Generated OpenAPI schema types only; explicit handwritten domain API functions.
- Feature folder convention.
- Development and production Docker boundaries.

## Structure

```text
src/
├── app/
├── api/
├── auth/
├── components/
├── features/
├── i18n/
└── test/
```

## Simplicity constraints

- Function components only.
- No component inheritance, class components, HOC factories, render-prop frameworks, or generic CRUD screen generator.
- No second global store for server records.
- No generated opaque runtime API SDK.
- Shared components remain visual and have at least three clear uses.
- Feature API functions and pages remain explicit.

## API client

- Configured base URL.
- Attaches in-memory access token.
- Sends credentials for CSRF bootstrap/login/refresh/logout and normal same-site cookie needs according to backend configuration.
- Parses the standard error envelope.
- Includes request ID in diagnostic UI/log metadata without exposing secrets.
- Does not automatically retry non-idempotent writes.

## Acceptance criteria

- [ ] Strict type check, lint, unit test, and production build commands pass.
- [ ] Router displays public login and protected app shell placeholders.
- [ ] Query client has bounded retry defaults.
- [ ] API client parses normal and error responses without logging tokens or sensitive bodies.
- [ ] OpenAPI schema types can be generated from the backend artifact.
- [ ] No generic CRUD/UI framework or class component exists.
- [ ] Frontend container/build plan is documented.

## Required tests

- API error parsing.
- Provider/router smoke test.
- Query retry policy.
- Environment variable validation.

## Related tasks

- FE-001, FE-002, FE-003, FE-006
