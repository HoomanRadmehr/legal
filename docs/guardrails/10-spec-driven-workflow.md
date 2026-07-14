# Spec-driven workflow guardrail

## Artifact hierarchy

```text
Assignment and candidate constraints
    -> business rules and ADRs
    -> backend/frontend specifications
    -> atomic tasks
    -> implementation and tests
    -> acceptance evidence
```

A lower layer may not silently contradict a higher layer.

## Change rules

### Clarification without contract change

Update the task execution log or add a small code comment when the behavior is already determined by the spec.

### Behavior or API contract change

Update the owning spec first, including acceptance criteria and OpenAPI impact. Then update dependent tasks and the traceability matrix.
Do not change a spec merely because generated code chose a different behavior.

### Architecture or security boundary change

Create an ADR and obtain approval before implementation.
Examples: changing token storage, replacing Matter composition, introducing hard delete, adding a generic relationship, or bypassing the outbox.

## Test traceability

Each task test should name the behavior or stable requirement where practical.
A final reviewer should be able to map:

```text
Requirement ID -> Spec acceptance criterion -> Task -> Test -> Verification command
```

Do not create tests only to increase coverage numbers.

## Completion order

1. Read.
2. Plan one task.
3. Implement only that task.
4. Run task checks.
5. Review against guardrails.
6. Update task log and AI usage evidence.
7. Start the next task.

## Prohibited agent behavior

- Building several domains from one broad prompt.
- Changing requirements after seeing failing tests.
- Marking a task done based on generated code inspection only.
- Claiming integration, security, or Docker verification without running it.
- Adding an abstraction because it may be useful later.
