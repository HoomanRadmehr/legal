# Implement one task

Replace `<TASK-ID>` and paste into Codex:

```text
Implement only <TASK-ID>.
Read AGENTS.md, the nearest nested AGENTS.md, the task file, all linked specs,
and relevant guardrails before editing. State a concise plan and expected files first.
Follow the strict simplicity contract: no multiple inheritance, no polymorphic domain code,
no GenericForeignKey, no signals for business workflows, no service/selector classes,
no generic CRUD generator, and no function over the documented limit.
Run every verification command in the task. Update the task execution log and AI_USAGE.md.
Stop after this task and report files, behavior, tests, security checks, and deviations.
```
