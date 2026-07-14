# FE-002: Implement typed API client and error contract

Status: DONE
Priority: P0
Area: Frontend
Related specs: FE-000
Depends on: FE-001

## Goal

Create a small fetch client, backend error parser, query key conventions, and OpenAPI schema type generation.

## Allowed scope

- `frontend/src/api/`
- `frontend/scripts/`
- `frontend/package.json`
- `frontend/src/test/`

## Required reading

- `AGENTS.md`
- `frontend/AGENTS.md` 
- `specs/frontend/FE-000-foundation.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Implement typed fetch wrapper with base URL and optional access token provider.
2. Parse standard error envelope, Retry-After, and request ID.
3. Set conservative GET retry integration points; do not auto-retry writes.
4. Configure OpenAPI type generation into `src/api/generated`.
5. Add unit tests without logging bodies/tokens.

## Acceptance criteria

- [x] Runtime client is handwritten and readable.
- [x] Generated output contains types only.
- [x] Error parser handles JSON and safe fallback.
- [x] No sensitive value is logged or persisted.

## Verification commands

```bash
cd frontend && npm run typecheck
cd frontend && npm test -- --run src/api
```

## Out of scope

- Authentication refresh orchestration.

## Codex execution log

- Started: 2026-07-14
- Completed: 2026-07-14
- Files changed:
  - `frontend/package.json`
  - `frontend/package-lock.json`
  - `frontend/scripts/generate-openapi-types.mjs`
  - `frontend/src/api/client.ts`
  - `frontend/src/api/errors.ts`
  - `frontend/src/api/queryKeys.ts`
  - `frontend/src/api/generated/schema.ts`
  - `frontend/src/api/generated/index.ts`
  - `frontend/src/api/client.test.ts`
  - `frontend/src/api/errors.test.ts`
  - `frontend/src/api/queryKeys.test.ts`
  - `frontend/src/api/generated/schema.test.ts`
  - `tasks/frontend/FE-002-implement-typed-api-client-and-error-contract.md`
  - `AI_USAGE.md`
- Commands run:
  - `cd frontend && npm install`
  - `cd frontend && npm run format`
  - `cd frontend && npm run typecheck` (initial strict test mock typing issue fixed and rerun)
  - `cd frontend && npm test -- --run src/api`
  - `cd frontend && npm ci`
  - `cd frontend && npm run lint` (initial unused test mock arguments fixed and rerun)
  - `cd frontend && npm run typecheck`
  - `cd frontend && npm test -- --run src/api`
  - `cd frontend && npm run lint`
  - `cd frontend && npm run format:check`
  - `cd frontend && npm run build`
  - `/usr/bin/python3 scripts/check_simplicity.py frontend`
  - `rg -n "\b(function|class|const|let|var|fetch|client)\b" src/api/generated/schema.ts src/api/generated/index.ts`
  - `/usr/bin/python3 scripts/validate_docs.py`
- Result: Passed. API test run covered 4 files and 10 tests; generated source files are types-only; frontend simplicity check scanned 13 source files.
- Deviations/questions: Added the dev-only `openapi-typescript` dependency and updated `package-lock.json` so OpenAPI type generation is reproducible. No runtime SDK was generated, and no unresolved questions remain.
