# AI agent working rules

## Purpose

The assignment evaluates AI-assisted development quality, including verification and correction.
The agent must produce reviewable evidence rather than a large unverified code dump.

## Rules

- Work from one task ID.
- Read linked specs before editing.
- State the intended files before changing them.
- Do not invent unapproved architecture.
- Do not weaken a test to make generated code pass.
- Do not change acceptance criteria after implementation.
- Do not hide uncertainty about security or domain rules.
- Record significant prompts, corrections, and AI mistakes in `AI_USAGE.md`.
- Use comments only for decisions that are not evident from code.
- Prefer standard framework behavior over custom agent-generated frameworks.

## Required self-review

Before completing a task, the agent checks:

1. No multiple inheritance was added.
2. No polymorphic or generic relation was added.
3. Services/selectors are functions and stay within size limits.
4. Permission and organization scoping are visible.
5. Sensitive data is not logged.
6. Tests cover the acceptance criteria.
7. OpenAPI changes are declared in the domain.
8. The task did not modify unrelated files.

## Human evidence

The candidate should be able to explain:

- why the architecture was chosen;
- which AI suggestions were rejected;
- how authorization and deadlines were tested;
- why direct object storage upload remains safe;
- why the code avoids clever abstractions;
- what remains future work.
