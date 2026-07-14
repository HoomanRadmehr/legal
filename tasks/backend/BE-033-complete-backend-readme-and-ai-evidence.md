# BE-033: Complete backend README and AI evidence

Status: TODO
Priority: P0
Area: Backend
Related specs: BE-013
Depends on: BE-028, BE-031, BE-032

## Goal

Document setup, commands, architecture, demo users, security decisions, limitations, and actual AI usage.

## Allowed scope

- `backend/README.md`
- `README.md`
- `AI_USAGE.md`
- `docs/presentation/`

## Required reading

- `AGENTS.md`
- `backend/AGENTS.md` 
- `specs/backend/BE-013-security-deployment.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Write prerequisites and development/production Docker commands.
2. Document env keys without secrets.
3. Document migration, seed, test, lint, OpenAPI, Celery, and troubleshooting commands.
4. Explain services/selectors, Matter composition, JWT storage, uploads, WebSocket, outbox, and limitations.
5. Update AI_USAGE with actual prompts, at least two mistakes, corrections, and personal decisions.

## Acceptance criteria

- [ ] A new reviewer can start the backend from docs.
- [ ] No unverified feature claim is made.
- [ ] AI_USAGE meets assignment sections and is truthful.
- [ ] Known limitations are explicit.

## Verification commands

```bash
python scripts/validate_docs.py
```

## Out of scope

- Inventing AI mistakes or claiming commands not run.

## Codex execution log

- Started:
- Completed:
- Files changed:
- Commands run:
- Result:
- Deviations/questions:
