# AGENTS.md - Global implementation contract

This file is binding for every Codex task in this repository.
Nested `AGENTS.md` files may add stricter rules but may not weaken these rules.

## 1. Mission

Implement a secure and auditable Legal Management Module as a modular monolith.
Optimize for correctness, confidentiality, deadline reliability, clear permission checks, and code that a reviewer can understand quickly.

## 2. Required reading before any edit

Read, in order:

1. This file.
2. The nearest nested `AGENTS.md` for the files you will change.
3. The assigned task file.
4. Every spec linked by that task.
5. Relevant files in `docs/guardrails/` and `docs/tech/`.

Do not edit code before completing this reading pass.

## 3. One-task rule

- Implement exactly one task ID per Codex run unless the task explicitly names subtasks.
- Do not opportunistically refactor unrelated code.
- Do not create a second architecture beside the documented architecture.
- If a requirement is unclear, add a short question to `docs/decisions/pending.md` and stop before guessing about security or data behavior.
- At completion, update the task checkbox, add an execution note, list tests run, and record meaningful AI usage in `AI_USAGE.md`.

## 4. Hard simplicity constraints

The following are prohibited:

- Multiple inheritance in application code.
- Domain polymorphism, polymorphic serializers, polymorphic viewsets, or model downcasting helpers.
- `GenericForeignKey`, `GenericRelation`, or content-type based domain associations.
- Custom metaclasses or runtime class generation.
- Abstract factory, factory-of-factories, service-locator, dependency-injection container, plugin registry, or auto-discovery framework.
- Repository pattern, unit-of-work framework, CQRS, event sourcing, or a custom ORM layer.
- Django signals for business operations, audit creation, notifications, or permission changes.
- Model `save()` overrides that trigger business workflows or network calls.
- Large service classes. Services and selectors must be plain functions.
- Dynamic imports for normal application behavior.
- Clever decorators that hide database writes, authorization, or network calls.
- Broad `except Exception` blocks unless the exception is re-raised after safe logging at a process boundary.
- Boolean parameters that substantially change a function's behavior. Use separate named functions.
- Generic `utils.py` dumping grounds.
- Premature base classes. A shared abstraction requires at least three clear, identical uses and must remain easy to read.

Permitted inheritance is deliberately narrow:

- A project base class may inherit one framework class.
- A domain class may inherit one project base class.
- A custom Django `User` may inherit only `AbstractUser`.
- Do not combine mixins through multiple inheritance.

Examples of the intended chains:

```text
models.Model -> CommonModel -> Contract
serializers.ModelSerializer -> CommonModelSerializer -> ContractDetailSerializer
viewsets.ModelViewSet -> CommonModelViewSet -> ContractViewSet
permissions.BasePermission -> CommonPermission -> ContractPermission
FilterSet -> CommonFilterSet -> ContractFilter
AsyncJsonWebsocketConsumer -> CommonJsonConsumer -> UserEventsConsumer
```

Each class has one direct base only.

## 5. Function and module constraints

- Prefer a target of 25 executable lines per function.
- A function must not exceed 40 executable lines without a documented exception in the task.
- Keep nesting at three levels or fewer.
- Use keyword-only arguments for service and selector functions.
- Prefer seven or fewer parameters. When input is large, pass validated dictionaries rather than inventing a framework.
- Keep modules focused. Split a module around 400 lines unless keeping it together is clearly easier to review.
- Use descriptive names. Do not use one-letter names except in trivial comprehensions.
- Small duplication is acceptable when it makes domain behavior explicit.

## 6. Required backend flow

Read operations:

```text
ViewSet -> selector function -> permission-scoped QuerySet -> serializer
```

Write operations:

```text
ViewSet -> ModelSerializer validation -> service function -> database transaction
        -> audit event + outbox event -> output serializer
```

Rules:

- Selectors perform reads only and return QuerySets or model instances.
- Services perform mutations only and own transaction boundaries.
- Serializers validate transport data. They do not contain business workflows.
- ViewSets handle HTTP concerns. They do not contain domain rules.
- Permission-scoped querysets are mandatory for list and retrieve operations.
- Network calls occur after the database transaction commits, normally in Celery.

## 7. Required frontend flow

```text
Route/page -> feature hook -> typed API function -> backend
Component -> form schema -> feature mutation -> query invalidation
WebSocket event -> event handler -> targeted query invalidation/status update
```

Rules:

- Use function components only.
- Do not use class components, component inheritance, HOC factories, or generic CRUD screen generators.
- Keep domain pages explicit. Shared components must remain small and visual rather than business-aware.
- Backend authorization is authoritative. Frontend permission checks are only for user experience.

## 8. Security invariants

- Every organization-owned query must be organization-scoped.
- Every matter query must be permission-scoped before object retrieval.
- Unauthorized confidential records should usually appear as `404`, not reveal existence through `403`.
- Refresh tokens must not be stored in browser local storage.
- Do not log passwords, JWTs, refresh cookies, presigned URLs, MinIO credentials, document contents, or full sensitive request bodies.
- MinIO buckets are private. Upload and download URLs are short-lived and issued only after permission checks.
- Rate limits apply at the reverse proxy and DRF levels.
- Critical writes use transactions, idempotency where required, and audit entries.
- Core legal records are archived or status-changed; they are not hard-deleted through normal APIs.

## 9. Testing requirements

Every task that changes behavior must add or update tests.
Prioritize permission boundaries, tenant isolation, deadline calculations, token lifecycle, upload validation, audit creation, idempotency, and offboarding atomicity.
Do not mark a task complete with failing tests, skipped relevant tests, or an invalid OpenAPI schema.

## 10. Completion response format

At the end of a Codex task, report:

1. Task ID and result.
2. Files changed.
3. Behavior implemented.
4. Tests and validation commands run.
5. Security considerations verified.
6. Any deviations or unresolved questions.

Do not claim a command passed unless it was actually run.
