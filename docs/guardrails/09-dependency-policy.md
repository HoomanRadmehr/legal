# Dependency policy

## Principles

- Add a dependency only when it replaces substantial risky code or provides a well-established framework integration.
- Pin dependencies through committed lock files.
- Prefer maintained, widely used packages with clear licensing.
- Do not add two libraries for the same concern.
- Do not add a package solely to avoid writing a small explicit function.

## Approved categories

Backend candidates include Django, Django REST Framework, Simple JWT, django-filter, drf-spectacular, psycopg, Celery, django-celery-beat if needed, Redis client, Django Channels, channels-redis, MinIO client, pytest, pytest-django, factory_boy, Ruff, and a static type checker if time permits.

Frontend candidates include React, TypeScript, Vite, React Router, TanStack Query, React Hook Form, Zod, i18next, a Jalali date library, Vitest, React Testing Library, and one UI component library.

## Approval rule

A new runtime dependency not already named in the technical docs requires a short note in the task execution log explaining:

- the problem solved;
- why standard library/framework code is insufficient;
- maintenance and security considerations; and
- why the package does not introduce unnecessary abstraction.
