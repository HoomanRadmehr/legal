# Localization and date guardrail

## Backend

- Use `from django.utils.translation import gettext_lazy as _` for model verbose names, enum labels, serializer validation messages, permission messages, and notification labels.
- Enable `LocaleMiddleware` in the documented order.
- Support `en` and `fa` through `LANGUAGES`.
- Select API response language with `Accept-Language`.
- Store canonical enum values such as `open`, `high`, and `legal_admin`.
- Do not store translated labels in business columns.

## Dates and timezones

- Store date-only values as PostgreSQL `DATE`.
- Store timestamps as timezone-aware UTC values.
- Define an organization timezone and use it for “today” and overdue calculations.
- The frontend converts Jalali input to ISO Gregorian before sending.
- The frontend converts ISO dates to Jalali for Persian presentation.
- Do not store Jalali strings as canonical dates.

## Frontend

- Use explicit translation keys grouped by feature.
- Support RTL direction for Persian.
- Mirror layout carefully but do not reverse identifiers, dates, code values, or file names incorrectly.
- Use accessible labels in both languages.
- API enum values remain unchanged; only their display labels are translated.

## Tests

- Backend enum labels and selected errors respond in Persian when requested.
- “Today” boundary uses organization timezone.
- Frontend switches direction and language.
- Jalali input round-trips to the expected ISO date.
