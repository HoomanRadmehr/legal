# BE-011: Reassignment and offboarding

- Status: Approved
- Priority: P0
- Requirements: ASSIGN-010, BR-033 through BR-037
- Depends on: BE-002, BE-006, BE-008, BE-009

## Intent

Allow safe preview and atomic transfer of a departing user's legal work without orphaning matters, tasks, deadlines, or access.

## API

```text
POST /api/v1/offboarding/preview/
POST /api/v1/offboarding/execute/
GET  /api/v1/offboarding/{run_id}/
```

## Preview input

Departing membership ID and replacement membership ID.

## Preview output

- departing and replacement safe identity;
- count and IDs/reference summaries for owned active matters;
- open assigned tasks;
- open assigned deadlines;
- active MatterAccess grants;
- warnings;
- a preview fingerprint/version used to detect stale execution.

Preview performs no mutation and is Admin-only.

## Execute

Requires:

- Legal Admin;
- same-organization active replacement;
- `Idempotency-Key`;
- preview fingerprint or expected counts/version according to implementation;
- explicit confirmation value.

Database transaction:

1. Lock relevant memberships and records in a documented order.
2. Reassign owned matters.
3. Reassign open tasks and deadlines.
4. Revoke or transfer explicit access according to the documented policy.
5. Mark departing membership offboarded.
6. Write activity rows and outbox events.
7. Mark `OffboardingRun` completed.

Provider notifications occur after commit.

## Failure behavior

Any database failure rolls back all reassignment and membership changes.
Conflicting replay returns the prior result or `409` according to idempotency rules.
Stale preview returns `offboarding_preview_stale` with `409` and requires a new preview.

## Acceptance criteria

- [ ] Only Admin can preview or execute.
- [ ] Preview is read-only and permission-safe.
- [ ] Replacement must be active and same organization.
- [ ] Execute is atomic and idempotent.
- [ ] No active matter remains owned by the offboarded membership.
- [ ] Open tasks/deadlines are reassigned according to preview.
- [ ] Membership is deactivated only after successful transfer.
- [ ] Activity/outbox provide clear evidence without secret data.
- [ ] Repeated execution cannot duplicate notifications or transfers.

## Required tests

- Role denial.
- Cross-organization/inactive replacement.
- Preview no mutation.
- Stale preview.
- Transaction rollback at each major stage.
- Matching/conflicting idempotent replay.
- Final ownership/task/deadline/access state.

## OpenAPI ownership

`apps/offboarding/api/v1/openapi.py`

## Related tasks

- BE-027
