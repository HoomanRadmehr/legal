# Domain rules

These IDs are stable and are referenced by specs and tests.

## Organization and identity

- **BR-001** Every legal record belongs to exactly one organization.
- **BR-002** A user must have an active membership to access organization data.
- **BR-003** A membership has exactly one role in the MVP.
- **BR-004** Organization and role values are derived or validated by the backend, never trusted from arbitrary client input.

## Matters and access

- **BR-005** Each case, contract, and notice has one concrete `Matter` record.
- **BR-006** Case, contract, and notice models use composition, not model inheritance.
- **BR-007** A matter reference code is unique within an organization.
- **BR-008** Matter visibility is granted by admin/manager role, ownership, or explicit active access.
- **BR-009** Core matter records are not hard-deleted through normal APIs.
- **BR-010** Updates use a version value; stale writes return `409`.

## Cases, contracts, and notices

- **BR-011** A case records type, status, priority, owner, description, relevant dates, and involved parties.
- **BR-012** A contract expiration date cannot be before its effective date.
- **BR-013** A contract renewal date, when present, must follow the effective date and normally cannot follow expiration without an explicit validation rule.
- **BR-014** A notice received date and response deadline are required for active notice intake.
- **BR-015** Notice response deadline changes update the linked deadline in the same service transaction.
- **BR-016** Matter-to-matter relationships use an explicit `MatterRelation`; no generic foreign key is allowed.

## Deadlines and tasks

- **BR-017** An open deadline is overdue when `due_at` is before the organization's current local time.
- **BR-018** “Today” is calculated in the organization's configured timezone, not server local time.
- **BR-019** A completed or cancelled deadline is not overdue.
- **BR-020** Assigned-to-me shows only open items assigned to the authenticated user and already visible through matter access.
- **BR-021** Tasks and deadlines cannot be assigned to inactive or cross-organization memberships.

## Documents

- **BR-022** MinIO buckets are private.
- **BR-023** A presigned URL is issued only after matter permission, file policy, quota, and rate-limit checks.
- **BR-024** An upload completion request is not trusted; the backend verifies the object directly from MinIO.
- **BR-025** A document is downloadable only when its status is `available`.
- **BR-026** Object keys are generated UUID-based paths and do not rely on the original filename.
- **BR-027** Upload completion and document download are auditable actions.

## Audit, events, and notifications

- **BR-028** Activity logs are append-only through normal application APIs.
- **BR-029** Critical mutations write an activity log and outbox event in the same database transaction.
- **BR-030** Notification delivery is asynchronous and idempotent.
- **BR-031** User notification preferences are evaluated before each channel delivery.
- **BR-032** In-app, email, SMS, and push are represented as explicit channel values; channel dispatch uses simple explicit functions, not a class strategy hierarchy.

## Offboarding

- **BR-033** Only a Legal Admin can execute offboarding.
- **BR-034** A replacement must be an active member of the same organization.
- **BR-035** Offboarding preview does not mutate data.
- **BR-036** Offboarding execution is atomic for database changes.
- **BR-037** An idempotency key prevents duplicate execution.

## Localization

- **BR-038** Canonical dates are stored as PostgreSQL dates or UTC timestamps.
- **BR-039** Jalali conversion occurs at the user-interface boundary or in explicit presentation fields.
- **BR-040** Canonical enum values are not translated in storage.
