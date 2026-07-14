# Starter manifest

## Purpose

This archive is a specification-and-task starter for Codex. It intentionally does not contain a pre-generated Django or React implementation.
Codex should start with `BE-001` and `FE-001` after reading the agent instructions.

## Contents

- Root and nested `AGENTS.md` instruction hierarchy
- Codex start guide and reusable prompts
- Business brief, glossary, role matrix, workflows, domain rules, MVP scope, and demo script
- Simplicity, security, data, API, testing, realtime/upload, localization, dependency, and spec-workflow guardrails
- Technical architecture, data model, JWT, MinIO, WebSocket, Celery/outbox, notifications, OpenAPI, settings, Docker, observability, rate limits, and base class contracts
- Eight accepted architecture decision records
- 14 backend specifications
- 13 frontend specifications
- 34 backend tasks
- 21 frontend tasks
- 8 integration tasks
- One- to two-day task plan and task index
- AI usage evidence template
- Documentation validator, task lister, next-task helper, and simplicity scanner

## Validation performed before packaging

```text
python scripts/validate_docs.py
python scripts/check_simplicity.py backend frontend
python -m py_compile scripts/*.py
```

The source implementation directories are intentionally empty except for README/AGENTS placeholders. The first implementation tasks create locked backend and frontend projects.
