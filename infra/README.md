# Infrastructure implementation target

The production shape is a reverse proxy in front of separate frontend and Django ASGI containers, plus Celery worker, Celery Beat, PostgreSQL, Redis, RabbitMQ, and MinIO.

Use one backend image for API, worker, Beat, and one-off migrations; only the command changes.
Use one frontend build image and a minimal static runtime image.
Only the reverse proxy exposes public ports in production.

Implementation is driven by `tasks/backend/BE-P0-foundation.md` and `tasks/backend/BE-P6-hardening-delivery.md`.
