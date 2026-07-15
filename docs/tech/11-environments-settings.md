# Environments and Django settings

## Settings modules

```text
config/settings/base.py
config/settings/development.py
config/settings/production.py
config/settings/test.py
```

Deployment selects a module through `DJANGO_SETTINGS_MODULE`.
The test module is for automated tests and is not a separate deployment environment.

## One environment key set

Use one `.env.example` key set for infrastructure and deployment-specific values:

- database URL and credentials;
- Redis/RabbitMQ URLs;
- MinIO internal endpoint, public endpoint, region, and credentials;
- allowed hosts and trusted origins;
- provider endpoints and credentials;
- token durations and storage limits.

A real `.env` is never committed.
Production secrets should come from the deployment secret mechanism even though Compose can use an env file for the assignment demonstration.

## Security behavior by module

`development.py`:

- `DEBUG=True`;
- local origins and relaxed HTTPS requirements;
- console or Mailpit email;
- developer-friendly logging.

`production.py`:

- `DEBUG=False` hardcoded;
- HTTPS redirect;
- Secure cookies;
- HSTS after deployment readiness;
- frame denial and content-type protection;
- explicit allowed hosts/origins;
- production logging;
- startup failure for missing or unsafe critical settings.

Do not expose production security invariants as optional booleans that can accidentally be disabled by `.env`.
Host-dependent values such as `ALLOWED_HOSTS` and trusted origins remain environment-provided.

## Checks

- Run Django system checks.
- Run `check --deploy` against production settings in CI.
- Validate required variables at startup with clear non-secret error messages.
