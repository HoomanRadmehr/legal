# INT-008: Final assignment delivery and presentation rehearsal

Status: TODO
Priority: P0
Area: Integration
Related specs: BE-013, FE-012
Depends on: BE-034, FE-021, INT-001, INT-002, INT-003, INT-004, INT-005, INT-006, INT-007

## Goal

Produce the final reproducible submission evidence and rehearse the 15-20 minute presentation.

## Allowed scope

- `README.md`
- `AI_USAGE.md`
- `docs/presentation/`
- `build/`
- `tasks/`

## Required reading

- `AGENTS.md`
- `backend/AGENTS.md`
- `frontend/AGENTS.md`
- `specs/backend/BE-013-security-deployment.md`
- `specs/frontend/FE-012-testing-delivery.md`
- `docs/traceability/definition-of-done.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Run docs, simplicity, backend, frontend, OpenAPI, Docker, and integration acceptance commands.
2. Confirm migrations, seed data, setup, and known limitations.
3. Review AI_USAGE for 5-10 real prompts, two real mistakes, and personal decisions.
4. Prepare presentation using outline and capture verification evidence.
5. Create final source archive excluding secrets/runtime volumes.

## Acceptance criteria

- [ ] All required deliverables exist.
- [ ] No secret or real legal data in archive.
- [ ] Presentation can explain architecture, AI corrections, verification, and future work.
- [ ] Any incomplete optional item is honestly documented.

## Verification commands

```bash
python scripts/validate_docs.py
python scripts/check_simplicity.py backend frontend
docker compose -f compose.yaml -f compose.production.yaml config
```

## Out of scope

- Adding last-minute features.

## Codex execution log

- Started:
- Completed:
- Files changed:
- Commands run:
- Result:
- Deviations/questions:
