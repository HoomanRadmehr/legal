# FE-021: Complete frontend README and final acceptance

Status: BLOCKED
Priority: P0
Area: Frontend
Related specs: FE-012
Depends on: FE-019, FE-020

## Goal

Document and run the complete frontend delivery gate.

## Allowed scope

- `frontend/README.md`
- `README.md`
- `AI_USAGE.md`
- `tasks/frontend/FE-021-final-frontend-acceptance.md`

## Required reading

- `AGENTS.md`
- `frontend/AGENTS.md` 
- `specs/frontend/FE-012-testing-delivery.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Document install/env/start/type/lint/test/build/OpenAPI generation/auth/realtime/i18n.
2. Record actual AI prompts/corrections.
3. Run lint, typecheck, full tests, build, docs/simplicity checks, and image build.
4. Record exact results and limitations.

## Acceptance criteria

- [ ] A new reviewer can run frontend from docs.
- [ ] All commands pass or a real blocker is documented without claiming done.
- [ ] No unverified feature claim or secret.
- [ ] AI_USAGE remains truthful.

## Verification commands

```bash
python scripts/validate_docs.py
cd frontend && npm run lint
cd frontend && npm run typecheck
cd frontend && npm test -- --run
cd frontend && npm run build
python scripts/check_simplicity.py frontend
```

## Out of scope

- New features.

## Codex execution log

- Started: 2026-07-15 18:03 +0330
- Completed: 2026-07-15 18:06 +0330
- Files changed:
  - `frontend/README.md`
  - `README.md`
  - `tasks/frontend/FE-021-complete-frontend-readme-and-final-acceptance.md`
  - `AI_USAGE.md`
- Commands run:
  - `python scripts/validate_docs.py` (failed before script startup because local pyenv `3.12` is not installed)
  - `cd frontend && npm run lint` (passed)
  - `cd frontend && npm run typecheck` (passed)
  - `cd frontend && npm test -- --run` (passed, 46 test files and 169 tests)
  - `cd frontend && npm run build` (passed with existing Vite large chunk warning)
  - `python scripts/check_simplicity.py frontend` (failed before script startup because local pyenv `3.12` is not installed)
  - `python3 scripts/validate_docs.py` after removing generated `frontend/node_modules` and `frontend/dist` (failed on existing decimal task ID headings outside FE-021 scope)
  - `python3 scripts/check_simplicity.py frontend` after removing generated frontend artifacts (passed, scanned 245 source files)
  - `docker build -f docker/frontend/Dockerfile -t legal-frontend:prod .` (passed)
- Result: Completed frontend and root README delivery documentation for install, environment, start, quality commands, OpenAPI type generation, authentication storage, realtime recovery, localization/Jalali behavior, production image, and known limitations. Frontend lint, typecheck, tests, build, source simplicity support check, and production frontend image build passed. Final acceptance remains blocked by documentation validation failures outside FE-021 scope.
- Deviations/questions: The task allowed scope names `tasks/frontend/FE-021-final-frontend-acceptance.md`, but the assigned file is `tasks/frontend/FE-021-complete-frontend-readme-and-final-acceptance.md`; this execution log was added to the assigned file. Documentation validation still rejects existing decimal task IDs: `BE-038`, `BE-036`, `BE-037`, `FE-022`, `FE-023`, and `FE-024`.
