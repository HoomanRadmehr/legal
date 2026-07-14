# Infrastructure AGENTS.md

- Use multi-stage images.
- Run application containers as non-root.
- Pin dependency versions through lock files.
- Do not bake secrets into images or commit `.env` files.
- Use exec-form commands and support graceful shutdown.
- Keep build and runtime dependencies separate.
- Use health checks and dependency health conditions in development Compose.
- Run migrations as an explicit one-off service, never from every API replica.
- Run exactly one Celery Beat replica.
- Keep PostgreSQL, Redis, RabbitMQ, and MinIO on private networks in production.
- Do not expose the MinIO administrative console publicly.
- Production Django security settings are hardcoded in `production.py`; they are not optional environment toggles.
- Development and production select different Django settings modules while sharing one consistent `.env` key set.
