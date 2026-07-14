# FE-012: Frontend testing, Docker, and delivery documentation

- Status: Approved
- Priority: P0
- Requirements: ASSIGN-012, ARCH-008, ARCH-010
- Depends on: all frontend P0 specs

## Intent

Deliver a reproducible frontend build with focused behavior tests, a non-root production image, and clear setup/demo documentation.

## Test coverage priorities

- Authentication restore/single-flight refresh/logout.
- Role navigation and mutation controls.
- Case/contract/notice forms and version conflicts.
- Deadline tabs and task completion.
- Upload progress, completion, realtime, polling, and URL secrecy.
- Notifications/preferences/activity.
- Offboarding confirmation/idempotent retry.
- English/Persian, RTL, Jalali conversion, and basic accessibility.

## Docker

- Locked dependency install.
- Builder stage and minimal static runtime.
- Non-root runtime where supported.
- Build-time public API/WS origins only; no secrets.
- Development uses Vite; production does not.

## Documentation

Frontend README documents:

- installation and environment values;
- local and Docker commands;
- type/lint/test/build commands;
- OpenAPI type generation;
- authentication storage model;
- realtime fallback;
- localization behavior;
- known limitations.

## Acceptance criteria

- [ ] Type check, lint, tests, and production build pass.
- [ ] Production image builds without secrets and runs with intended non-root/static setup.
- [ ] No access token or presigned URL is stored in browser persistence in tests/manual inspection.
- [ ] P0 screens work in English and Persian.
- [ ] README and AI usage evidence are accurate.
- [ ] Simplicity guardrail review finds no generic CRUD engine, component hierarchy, or oversized unreviewed components.

## Related tasks

- FE-019, FE-020, FE-021
