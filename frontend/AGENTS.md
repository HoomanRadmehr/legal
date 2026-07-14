# Frontend AGENTS.md

This file supplements the root `AGENTS.md` for all frontend changes.

## Required style

- React function components only.
- TypeScript strict mode.
- No class components or component inheritance.
- No higher-order component factories, generic CRUD page generators, or schema-driven UI engines.
- Do not create a shared component until at least three concrete screens need the same visual behavior.
- Keep business behavior inside feature hooks and explicit API functions, not generic component props.
- Small duplication between case, contract, and notice forms is acceptable.

## Feature layout

```text
src/features/cases/
├── api.ts
├── components/
├── hooks.ts
├── pages/
├── schemas.ts
├── types.ts
└── tests/
```

Use the same explicit layout for contracts, notices, deadlines, tasks, documents, notifications, activity, dashboard, and offboarding.

## Data access

- Use TanStack Query for server state.
- Use a small typed fetch client for HTTP transport.
- Generate TypeScript schema types from OpenAPI, but write readable domain API functions by hand.
- Do not generate opaque runtime clients or generic endpoint wrappers.
- Backend errors use the documented error envelope and stable `code` values.
- Retry GET requests conservatively; do not automatically retry non-idempotent writes.

## Authentication

- Keep the access token in memory, never local storage.
- The refresh token is an HttpOnly cookie and is not read by JavaScript.
- On initial load, ensure the CSRF cookie exists, then call the refresh endpoint once to restore a session.
- Use a single-flight refresh mechanism so parallel 401 responses do not trigger multiple refresh calls.
- Frontend permission checks hide or disable controls, but never replace backend checks.

## Realtime

- Request a one-time WebSocket ticket over authenticated HTTP.
- Connect to one user event stream.
- Treat WebSocket messages as hints; the backend API remains authoritative.
- On reconnect, refetch affected queries.
- Provide polling fallback for upload status.

## Forms and localization

- Use React Hook Form and explicit Zod schemas.
- Keep create and update schemas separate when required fields differ.
- Use i18next for English and Persian.
- Support RTL layout and Jalali display/input at the UI boundary.
- Send ISO Gregorian dates and UTC timestamps to the backend.
- Use translated labels; never translate canonical API enum values in state.

## Testing

Use Vitest and React Testing Library.
Test behavior visible to a user: permission-aware actions, validation, rate-limit messages, token refresh, upload state, realtime reconnect, RTL rendering, and offboarding confirmation.
Avoid implementation-detail tests.
