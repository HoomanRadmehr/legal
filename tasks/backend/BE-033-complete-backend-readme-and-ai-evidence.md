# BE-033: Complete backend README and AI evidence

Status: DONE
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

- [x] A new reviewer can start the backend from docs.
- [x] No unverified feature claim is made.
- [x] AI_USAGE meets assignment sections and is truthful.
- [x] Known limitations are explicit.

## Verification commands

```bash
python scripts/validate_docs.py
```

## Out of scope

- Inventing AI mistakes or claiming commands not run.

## Codex execution log

- Started: 2026-07-15 17:28 +0330
- Completed: 2026-07-15 17:32 +0330
- Files changed:
  - `backend/README.md`
  - `README.md`
  - `AI_USAGE.md`
  - `docs/presentation/backend-evidence.md`
  - `tasks/backend/BE-033-complete-backend-readme-and-ai-evidence.md`
- Commands run:
  - `python scripts/validate_docs.py` (failed before script startup because repository pyenv `3.12` is not installed)
  - `python3 scripts/validate_docs.py` (failed on existing decimal task heading IDs outside BE-033: `BE-026.-8`, `BE-026.5`, `BE-026.75`, `FE-013.5`, `FE-013.75`, `FE-013.8`)
- Result: Completed backend README handoff documentation, refreshed root reviewer entry points, added backend presentation evidence, removed AI usage placeholders, added BE-033 AI usage evidence, and documented known limitations and command deviations truthfully.
- Deviations/questions: The exact verification command is blocked by local pyenv before validation starts. The validator itself still fails under `python3` on pre-existing decimal task heading IDs outside BE-033's allowed scope, so those unrelated task files were not edited.
