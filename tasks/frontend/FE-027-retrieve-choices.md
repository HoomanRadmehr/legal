# FE-027: Implement searchable infinite-scroll form dropdowns

Status: BLOCKED
Priority: P0
Area: Frontend
Related specs: FE-002, FE-005, FE-006, FE-007, FE-008, FE-011, FE-012
Depends on: FE-002, FE-003, FE-006, BE-042

## Goal

Replace database-backed text and fixed-list relationship inputs with searchable dropdowns that load permitted choices incrementally.

Apply the new dropdown behavior to creation forms for:

```text
cases
contracts
notices
deadlines
tasks
documents
offboarding
```

Do not use infinite scrolling for static enums.

## Important distinction

Use a normal static Select for:

```text
status
priority
case type
contract type
notice status
language
role
document type
```

Use an async infinite-scroll dropdown for:

```text
owner
assignee
involved users
related Matter
replacement User
```

## Form mapping

### Case creation

```text
owner:
GET /api/v1/users/choices/?purpose=owner

involved_users:
GET /api/v1/users/choices/?purpose=participant
```

`involved_users` is a multi-select only when the existing data model supports multiple Users.

### Contract creation

```text
owner:
GET /api/v1/users/choices/?purpose=owner
```

Counterparty remains a text field unless an approved Counterparty model already exists.

Do not invent a new model in this task.

### Notice creation

```text
owner:
GET /api/v1/users/choices/?purpose=owner

related_matter:
GET /api/v1/matters/choices/?purpose=notice_relation
```

Sender remains text unless an approved Party model already exists.

### Deadline creation

```text
matter:
GET /api/v1/matters/choices/?purpose=deadline_create

assignee:
GET /api/v1/users/choices/?purpose=assignee
```

### Task creation

```text
matter:
GET /api/v1/matters/choices/?purpose=task_create

assignee:
GET /api/v1/users/choices/?purpose=assignee
```

### Document creation or upload

```text
matter:
GET /api/v1/matters/choices/?purpose=document_upload
```

Document upload continues using the direct presigned MinIO flow.

The dropdown selects the permitted `matter_id`.

The file must not be sent through Django.

### Offboarding

```text
replacement_user:
GET /api/v1/users/choices/
    ?purpose=offboarding_replacement
    &exclude_user_id={departing_user_id}
```

## Shared component

Create one small reusable component:

```text
frontend/src/components/forms/AsyncChoiceSelect.tsx
```

This is allowed because the interaction is identical across forms.

Do not create a form framework or schema renderer.

Suggested explicit props:

```typescript
type AsyncChoice = {
  id: string;
  label: string;
  secondaryLabel?: string;
};

type AsyncChoiceSelectProps = {
  label: string;
  value: AsyncChoice | null;
  onChange: (value: AsyncChoice | null) => void;
  loadPage: (input: {
    query: string;
    cursor?: string;
  }) => Promise<ChoicePage>;
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  placeholder?: string;
};
```

For multi-select, create a separate component only if required:

```text
AsyncChoiceMultiSelect.tsx
```

Do not create one component with many difficult conditional branches.

Both components must remain function components.

## Domain wrappers

Create small explicit wrappers:

```text
UserChoiceSelect
UserChoiceMultiSelect
MatterChoiceSelect
```

Examples:

```typescript
function OwnerChoiceSelect(...) {
  return (
    <UserChoiceSelect
      purpose="owner"
      {...props}
    />
  );
}
```

Keep wrappers small.

Do not create:

```text
ChoiceFactory
DropdownBuilder
FieldSchemaRenderer
RelationInputEngine
LookupProvider hierarchy
```

## Data loading

Use TanStack Query `useInfiniteQuery`.

Recommended query keys:

```typescript
["user-choices", purpose, query, excludeUserId]
```

```typescript
["matter-choices", purpose, kind, query]
```

Requirements:

1. Load the first page when the dropdown opens.
2. Load the next page when the User scrolls near the end.
3. Stop when `has_more=false`.
4. Pass `next_cursor` to the next request.
5. Deduplicate choices by ID.
6. Cancel or ignore stale search requests.
7. Reset pagination when the search text changes.
8. Do not load all pages automatically.
9. Do not copy choice results into global state.
10. Do not persist choice pages in localStorage or sessionStorage.

## Search behavior

Use a small debounce:

```text
250–400 milliseconds
```

Requirements:

1. Do not request on every keystroke without debounce.
2. Search remains server-side.
3. Whitespace-only search becomes an empty query.
4. Search errors do not destroy the entire form.
5. Empty search displays the first permitted choices.
6. Show a loading indicator while searching.
7. Show an explicit empty result message.
8. Keep already selected multi-select values visible.
9. Do not send untranslated labels back to the backend.

## Infinite-scroll behavior

Use either:

* the existing component library's list-end callback;
* a small `IntersectionObserver` sentinel;
* an explicit scroll-position check.

Prefer the mechanism already supported by the project's UI library.

Do not add an infinite-scroll package unless the existing component library cannot support it clearly.

Requirements:

1. Do not trigger duplicate page requests.
2. Do not request after `has_more=false`.
3. Show a bottom loading indicator.
4. Preserve keyboard navigation.
5. Preserve selected values.
6. Avoid scroll jumps when pages are appended.
7. Work in Persian RTL and English LTR modes.

## API functions

Add small explicit functions:

```typescript
async function listUserChoices(
  input: UserChoiceRequest,
): Promise<ChoicePage> {
  // ...
}
```

```typescript
async function listMatterChoices(
  input: MatterChoiceRequest,
): Promise<ChoicePage> {
  // ...
}
```

Do not create API service classes.

Do not accept an arbitrary endpoint URL from page components.

The API functions must use approved endpoint paths.

## Form submission

Dropdown components store the selected choice object for display.

Form payloads send only IDs:

```json
{
  "owner_id": "user-uuid",
  "matter_id": "matter-uuid",
  "assignee_id": "user-uuid",
  "involved_user_ids": [
    "user-uuid-1",
    "user-uuid-2"
  ]
}
```

Use actual backend field names from the approved OpenAPI schema.

Do not send:

```text
choice label
secondary label
role label
complete User object
complete Matter object
organization ID
permission metadata
```

## Permission behavior

Frontend does not calculate which records are available.

The backend returns permitted choices.

The frontend must:

1. Display only returned choices.
2. Handle `401`, `403` and `429`.
3. Never add hidden manually constructed options.
4. Never allow entering arbitrary UUID values.
5. Never reuse choice data from another organization session.
6. Clear choice queries after logout or organization-context change.

## Error handling

Handle:

```text
authentication_required
permission_denied
rate_limit_exceeded
network failure
unexpected server error
```

For `429`:

1. Read `Retry-After`.
2. Show localized retry guidance.
3. Avoid immediate repeated search requests.

Do not display raw backend stack traces.

## Localization

Provide English and Persian translations for:

```text
search
searching
no choices found
loading more
failed to load choices
retry
owner
assignee
involved users
related legal matter
replacement user
select an option
clear selection
```

Persian mode must be RTL.

Email addresses, UUIDs and reference codes may use local `dir="ltr"` containers.

Canonical values and IDs remain untranslated.

## Accessibility

1. Every dropdown has an accessible label.
2. Keyboard navigation works.
3. Enter selects an option.
4. Escape closes the dropdown.
5. Loading state is announced.
6. Empty state is announced.
7. Selected options are readable by screen readers.
8. Multi-select removal buttons have meaningful labels.
9. Infinite scrolling does not trap keyboard focus.
10. Status meaning does not depend only on color.

## Simplicity requirements

Do not introduce:

```text
class components
inheritance
higher-order components
form factories
field factories
schema-driven forms
generic CRUD generators
generic lookup engines
custom state-machine libraries
Redux solely for dropdown choices
```

Prefer:

```text
small function components
one simple shared async-select
small domain wrappers
TanStack Query
explicit API functions
explicit form integration
```

## Allowed scope

* Shared async choice components
* User and Matter choice API functions
* Creation forms for Case, Contract, Notice, Deadline, Task and Document
* Offboarding replacement field
* Persian and English translations
* Related tests
* Relevant specifications and task references

Do not redesign unrelated pages.

## Acceptance criteria

* [ ] Owner fields use server-backed searchable dropdowns.
* [ ] Assignee fields use server-backed searchable dropdowns.
* [ ] Matter fields use server-backed searchable dropdowns.
* [ ] Involved Users use multi-select when supported by the model.
* [ ] Offboarding replacement excludes the departing User.
* [ ] Static enums remain normal Select inputs.
* [ ] First page loads when dropdown opens.
* [ ] Search is debounced.
* [ ] Search is server-side.
* [ ] Scrolling loads the next cursor page.
* [ ] No request occurs after `has_more=false`.
* [ ] Duplicate page requests are prevented.
* [ ] Choices are deduplicated by ID.
* [ ] Selected values remain visible.
* [ ] Forms submit only IDs.
* [ ] Organization ID is never submitted.
* [ ] Arbitrary UUID entry is impossible.
* [ ] Backend permission results are authoritative.
* [ ] Logout clears permission-scoped choice caches.
* [ ] `429` uses `Retry-After`.
* [ ] Loading, empty and error states are localized.
* [ ] Persian mode is RTL.
* [ ] Dropdowns work with keyboard navigation.
* [ ] No generic form or lookup framework is introduced.
* [ ] Components remain small function components.
* [ ] No multiple inheritance, polymorphism or complex abstractions are introduced.

## Required tests

Add behavior tests for:

1. User dropdown first-page loading.
2. Matter dropdown first-page loading.
3. Dropdown does not load before opening when configured lazily.
4. Debounced search.
5. Whitespace search.
6. Stale search response ignored.
7. Load next page on scroll.
8. Stop at `has_more=false`.
9. Duplicate page request prevention.
10. Choice deduplication.
11. Loading-more indicator.
12. Empty state.
13. API error state.
14. Rate limit and retry guidance.
15. Keyboard selection.
16. Escape closes list.
17. Clear selection.
18. Selected value display.
19. Multi-select preservation.
20. Owner ID submission.
21. Assignee ID submission.
22. Matter ID submission.
23. Involved User IDs submission.
24. Organization ID absent.
25. Labels absent from mutation payload.
26. Case creation integration.
27. Contract creation integration.
28. Notice creation integration.
29. Deadline creation integration.
30. Task creation integration.
31. Document Matter selection integration.
32. Direct MinIO upload remains unchanged.
33. Offboarding replacement exclusion.
34. Static enum fields remain static.
35. English labels.
36. Persian labels.
37. Persian RTL.
38. LTR email and reference-code display.
39. Cache cleared after logout.
40. No arbitrary UUID input.
41. No security-sensitive value logged.

## Verification commands

```bash
cd frontend && npm run lint
cd frontend && npm run typecheck
cd frontend && npm run test -- --run
cd frontend && npm run build
python3 scripts/check_simplicity.py frontend
python3 scripts/validate_docs.py
```

## Out of scope

* Generic form generation.
* Generic lookup API.
* Loading every option.
* Client-side filtering of all database records.
* Creating new users from inside a dropdown.
* Creating new Matters from inside a dropdown.
* Recently used option ranking.
* Favorites.
* Virtualized lists unless performance evidence requires them.
* New Party or Counterparty model.
* Changes to direct MinIO upload transport.
* Custom state-machine library.

## Codex execution log

* Started:
* Completed: 2026-07-15 21:42 +0330
* Files changed: `docs/decisions/pending.md`, `tasks/frontend/FE-027-retrieve-choices.md`, `AI_USAGE.md`.
* Commands run: Required reading only plus local contract inspection using `rg "owner_id|assignee_id|replacement_membership_id|membership_id" backend/apps/cases backend/apps/deadlines backend/apps/tasks backend/apps/offboarding -n`; `python3 scripts/validate_docs.py`.
* Result: BLOCKED before product-code edits. FE-027/BE-042 define user choice `id` as `User.id` and instruct forms to submit that value for `owner_id`, `assignee_id`, and replacement user fields. The current backend services for cases, deadlines, tasks, and offboarding resolve these fields as active `Membership.id`, so wiring the dropdowns as specified would submit IDs the backend rejects or misinterprets.
* Deviations/questions: Added `PENDING-001` to `docs/decisions/pending.md` asking whether the public contract should use `User.id`, `Membership.id`, or both explicit IDs.
