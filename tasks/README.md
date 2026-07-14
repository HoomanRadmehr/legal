# Task system

Tasks are implementation units. Specifications define behavior; tasks may not silently change it.

## Rules

- Work on one task ID at a time.
- Read root and nested `AGENTS.md` plus linked specs first.
- Change task status to `IN PROGRESS` before edits and `DONE` only after verification.
- Keep acceptance criteria unchanged.
- Add exact commands and results to the execution log.
- Record meaningful AI prompts/corrections in `AI_USAGE.md`.
- A blocked security or data-model ambiguity goes to `docs/decisions/pending.md`.

Use `python scripts/list_tasks.py` to list status.
Use `tasks/ORDER.md` for the recommended critical path.
