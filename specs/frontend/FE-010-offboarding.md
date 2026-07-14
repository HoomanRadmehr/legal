# FE-010: Reassignment and offboarding UI

- Status: Approved
- Priority: P0
- Requirements: ASSIGN-010
- Depends on: FE-002, BE-011

## Intent

Give Legal Admin a careful preview-and-confirm workflow for transferring a user's work, with clear atomic result and no accidental duplicate submission.

## Route

```text
/admin/offboarding
/admin/offboarding/:runId
```

Only Admin navigation exposes the route.
Backend remains authoritative for direct access.

## Flow

1. Select departing active membership.
2. Select same-organization active replacement.
3. Request preview.
4. Display matters, open tasks, open deadlines, access grants, and warnings.
5. Require explicit confirmation text or checkbox.
6. Execute with preview fingerprint and stable idempotency key.
7. Disable duplicate submit while pending.
8. Show completed state and links to affected records.
9. Handle stale preview by requiring refresh.

## Realtime

An offboarding status event may update progress, but the run endpoint is authoritative.
The MVP database transaction may complete quickly; do not invent granular progress stages not supplied by backend.

## Acceptance criteria

- [ ] Non-Admin does not see route/action and denial is handled safely.
- [ ] Preview causes no client assumption of mutation.
- [ ] Execute cannot run without explicit confirmation.
- [ ] One idempotency key is reused for a retry of the same confirmation, not regenerated on every network retry.
- [ ] Stale preview `409` returns user to preview step.
- [ ] Success shows affected counts and final membership state.
- [ ] Double-click or reconnect cannot trigger a second logical execution.

## Required tests

- Role route matrix.
- Preview rendering.
- Confirmation enforcement.
- Idempotency key persistence during retry.
- Stale preview and success.
- Duplicate submit prevention.

## Related tasks

- FE-017
