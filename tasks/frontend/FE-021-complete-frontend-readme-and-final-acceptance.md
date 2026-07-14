# FE-021: Complete frontend README and final acceptance

Status: TODO
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

- Started:
- Completed:
- Files changed:
- Commands run:
- Result:
- Deviations/questions:
