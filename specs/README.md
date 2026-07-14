# Specifications

Specifications define observable behavior and acceptance criteria. Tasks define implementation steps.
Do not change a spec merely to match an implementation. A contract change requires review and, when architectural, an ADR.

- Backend specs: `specs/backend/`
- Frontend specs: `specs/frontend/`
- Stable business rules: `docs/business/05-domain-rules.md`
- Requirement mapping: `docs/traceability/matrix.md`

Status meanings:

- `Approved`: implementation may begin.
- `Implemented`: all related P0 tasks and acceptance checks pass.
- `Deferred`: not part of the current MVP.
