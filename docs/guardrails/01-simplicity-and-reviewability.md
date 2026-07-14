# Simplicity and reviewability guardrail

This document is mandatory. A task is not complete if the code works but violates these constraints.

## Core principle

A reviewer should be able to follow a request from URL to ViewSet, serializer, service or selector, model, and test without discovering hidden behavior.

## Prohibited patterns

- Multiple inheritance.
- Application-level polymorphic hierarchies.
- Polymorphic models, serializers, or ViewSets.
- Generic foreign keys.
- Custom metaclasses.
- Custom dependency injection.
- Repository, unit-of-work, CQRS, or event-sourcing frameworks.
- Django signals for business logic.
- Model methods that send notifications, write audit logs, or call external systems.
- Service or selector classes.
- Generic CRUD generators.
- Dynamic serializer factories.
- Runtime plugin or channel registries.
- Deep inheritance beyond the single framework -> project base -> domain class chain.
- Generic “base domain model” containing organization, owner, status, version, archive, and every possible field.

## Required patterns

### Backend

- One small `CommonModel` with only UUID and timestamps.
- Explicit `organization`, `owner`, `version`, and status fields on models that need them.
- One small `CommonModelViewSet` with standard transport behavior.
- One domain ViewSet per resource.
- ModelSerializers with explicit fields.
- Plain service and selector functions.
- Explicit `if` / `elif` dispatch is preferred over strategy subclasses for four notification channels.
- Clear transaction boundaries in service functions.

### Frontend

- Function components.
- Explicit pages per domain.
- Explicit domain API functions.
- Small visual components.
- No generic record-editor engine.
- No inheritance, HOC factories, render-prop frameworks, or excessive custom hooks.

## Measurable limits

- Target function length: 25 executable lines.
- Hard function limit: 40 executable lines unless the task documents why splitting would be less clear.
- Maximum nesting depth: 3.
- Target module size: below 400 lines.
- Target component size: below 200 lines.
- Cyclomatic complexity target: 8 or lower.
- Prefer seven or fewer parameters, using keyword-only service arguments.

## Duplication policy

Duplicate a small amount of straightforward code when sharing it would introduce:

- a generic configuration language;
- callbacks that hide control flow;
- multiple inheritance;
- conditional behavior for unrelated domains; or
- an abstraction with only one or two callers.

Refactor repeated code only after at least three stable uses and only when the shared name improves understanding.

## Review questions

1. Can the business write be found in one named service?
2. Can the read permission be found in one selector?
3. Does any method hide a database write or network call?
4. Is a class inherited from more than one base?
5. Is a generic relationship used instead of an explicit foreign key?
6. Can a new reviewer understand the function without knowing a custom framework?
7. Is duplication being removed at the cost of clarity?
