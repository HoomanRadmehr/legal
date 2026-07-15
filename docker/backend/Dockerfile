# syntax=docker/dockerfile:1.7

FROM python:3.12-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_PROJECT_ENVIRONMENT=/opt/venv

WORKDIR /build/backend

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential ca-certificates libpq-dev \
    && rm -rf /var/lib/apt/lists/*

RUN python -m pip install --no-cache-dir uv==0.11.6

COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync --frozen --no-dev \
    && uv pip install --python /opt/venv/bin/python daphne==4.1.2

FROM python:3.12-slim AS runtime

ENV DJANGO_SETTINGS_MODULE=config.settings.production \
    PATH=/opt/venv/bin:$PATH \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app/backend

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates libpq5 \
    && groupadd --system app \
    && useradd --system --gid app --home-dir /app --shell /usr/sbin/nologin app \
    && mkdir -p /app/backend /app/backend/staticfiles \
    && chown -R app:app /app \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder --chown=app:app /opt/venv /opt/venv
COPY --chown=app:app backend/ ./

USER app

EXPOSE 8000

CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "config.asgi:application"]
