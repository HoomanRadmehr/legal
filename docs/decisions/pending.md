# Pending decisions

Add only questions that block implementation because they change a public contract, security boundary, transaction boundary, or data model.

| ID | Date | Task | Question | Options | Status |
|---|---|---|---|---|---|
| PENDING-000 | - | - | No pending decisions. | - | Closed |
| PENDING-001 | 2026-07-15 | FE-027 | Should user choice endpoints return and forms submit `User.id` or `Membership.id` for owner, assignee, participant, and offboarding replacement fields? FE-027/BE-042 say `User.id`, but current backend case/deadline/task/offboarding services validate `Membership.id`. | A: Change backend mutations/serializers to accept `User.id`; B: Change BE-042/FE-027 choice contracts to return `Membership.id` for role-scoped user choices; C: Return both IDs with explicit field names and update form contracts. | Open |
