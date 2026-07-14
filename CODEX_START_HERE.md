# Codex start guide

## 1. Open the repository

Unzip the starter, open the repository root in Codex, and do not ask Codex to build the full application in one prompt.
The task files are designed to keep each change small enough for review.

## 2. First read-only prompt

Use this prompt before implementation:

```text
Read AGENTS.md, CODEX_START_HERE.md, docs/business/06-mvp-scope.md,
docs/guardrails/01-simplicity-and-reviewability.md, docs/guardrails/02-security.md,
docs/tech/01-architecture.md, and tasks/ORDER.md.
Do not edit files. Summarize the architecture, prohibited patterns, MVP critical path,
and the exact next task. Call out any contradictions.
```

## 3. Task implementation prompt

Replace `<TASK-ID>` with one ID from `tasks/ORDER.md`:

```text
Implement only <TASK-ID>.
First read the root and nearest nested AGENTS.md, the task file, every linked spec,
and the relevant guardrails. Before editing, provide a concise implementation plan and
list the files you expect to change. Keep the implementation explicit and standard:
no multiple inheritance, no polymorphic domain code, no GenericForeignKey, no signals
for business workflows, no service classes, and no complex functions. Run every command
listed in the task's verification section. Update the task execution note and AI_USAGE.md.
Do not start another task.
```

## 4. Review prompt

After a task is implemented, use a separate Codex review pass:

```text
Review the changes for <TASK-ID> against its linked specs and acceptance criteria.
Do not redesign the system. Focus on authorization, tenant isolation, transaction boundaries,
rate limiting, sensitive logging, idempotency, test quality, and the simplicity rules in AGENTS.md.
Report findings by severity with file and line references. Fix only confirmed issues that are
inside this task's scope, then rerun the required checks.
```

## 5. Security review prompt

Use before final delivery:

```text
Perform a security-focused review using docs/guardrails/02-security.md and
specs/backend/BE-013-security-deployment.md. Check JWT lifecycle, CSRF, CORS,
object-level authorization, cross-organization access, presigned URL issuance,
upload completion verification, WebSocket ticket reuse, rate-limit responses,
secret handling, and sensitive logs. Add tests for confirmed gaps. Do not add new architecture.
```

## 6. Safe parallel work

Parallel Codex sessions are allowed only when their tasks modify disjoint directories and neither task changes shared contracts.
Do not run backend and frontend tasks in parallel while the OpenAPI contract is changing.
Do not run two migration-producing backend tasks concurrently.
Do not run two tasks that both edit `common/`, settings, authentication, or shared API types.

## 7. Task status convention

Each task starts with one of:

```text
Status: TODO
Status: IN PROGRESS
Status: BLOCKED
Status: DONE
```

Codex may change `TODO` to `IN PROGRESS` at the start and to `DONE` only after all acceptance checks pass.
Use the execution log at the bottom of the task file. Never rewrite the acceptance criteria after implementation.

## 8. Decision handling

- Small implementation detail: choose the most explicit standard approach and record it in the execution log.
- Contract, security, or data-model ambiguity: add an entry to `docs/decisions/pending.md` and stop.
- Architectural change: create an ADR using `docs/templates/ADR_TEMPLATE.md`; do not implement until approved.

## 9. First tasks

Start with `BE-001` and `FE-001` only after the read-only pass.
The backend foundation should normally be completed before frontend API integration begins.
