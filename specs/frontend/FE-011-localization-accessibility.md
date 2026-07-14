# FE-011: English/Persian localization, Jalali dates, RTL, and accessibility

- Status: Approved
- Priority: P0
- Requirements: ASSIGN-011, ARCH-009
- Depends on: FE-000 and all feature screens

## Intent

Support a usable English and Persian interface without changing canonical API values or date storage semantics.

## Localization

- Translation resources grouped by common and feature namespaces.
- Locale switch updates text, direction, date presentation, and preferred language where persisted.
- API requests send `Accept-Language`.
- Canonical values such as `open` remain unchanged in state and requests.

## RTL

- Root `dir` changes between `ltr` and `rtl`.
- Navigation, forms, tables, dialogs, icons, and spacing are reviewed.
- Reference codes, UUIDs, email addresses, and technical values use appropriate direction isolation.

## Jalali dates

- Persian locale date picker/display uses Jalali.
- Conversion to ISO Gregorian occurs before API submission.
- ISO API values convert back without date shift.
- Timestamp display uses organization/user timezone as documented.
- Deadline category is accepted from backend; frontend does not reclassify with a conflicting local timezone.

## Accessibility

- Keyboard navigation for menus, forms, dialogs, tabs, and tables.
- Visible focus.
- Labels and validation descriptions.
- Status/urgency not conveyed by color alone.
- Upload progress and realtime state announced appropriately.
- Confirmation dialogs focus and return focus correctly.

## Acceptance criteria

- [ ] English and Persian routes/screens render without missing keys in P0 flows.
- [ ] Direction switches correctly and technical values remain legible.
- [ ] Jalali create/edit round-trip produces expected ISO date.
- [ ] Backend localized errors are displayed safely.
- [ ] Critical screens pass basic automated accessibility checks if selected tooling is available and manual keyboard checklist.
- [ ] No canonical enum is translated before API submission.

## Required tests

- Locale/direction switch.
- Missing-key policy.
- Jalali/ISO round-trip including boundary dates.
- Technical identifier direction.
- Keyboard/dialog/form labels.

## Related tasks

- FE-006, FE-018
