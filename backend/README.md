# Backend implementation target

Codex will create the Django project here through the backend tasks.
Do not generate the entire backend at once.

Expected top-level shape after foundation tasks:

```text
backend/
├── AGENTS.md
├── manage.py
├── pyproject.toml
├── uv.lock or another committed lock file
├── config/
│   ├── settings/
│   │   ├── base.py
│   │   ├── development.py
│   │   ├── production.py
│   │   └── test.py
│   ├── asgi.py
│   ├── celery.py
│   ├── routing.py
│   └── urls.py
├── common/
└── apps/
```

Use the task order in `../tasks/backend/`.

## Local settings

The backend uses explicit settings modules selected by `DJANGO_SETTINGS_MODULE`:

- `config.settings.development` for local development.
- `config.settings.production` for deployed services.
- `config.settings.test` for pytest.

Production settings intentionally fail at import time when required infrastructure or host
values are missing or unsafe. Security invariants such as `DEBUG=False`, secure cookies, HTTPS
redirect, HSTS, content sniffing protection, and frame denial are hardcoded in production settings
rather than controlled by environment booleans.

For a local production-settings check, export the required values from `.env.example` with real
deployment-safe replacements, then run:

```bash
cd backend
DJANGO_SETTINGS_MODULE=config.settings.production python manage.py check --deploy
```
