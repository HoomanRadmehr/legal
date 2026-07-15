# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS builder

WORKDIR /build/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/index.html frontend/tsconfig.json frontend/vite.config.ts ./
COPY frontend/src/ ./src/
COPY frontend/scripts/ ./scripts/

ARG VITE_API_BASE_URL=/api/v1
ARG VITE_WS_BASE_URL=/ws/v1
ARG VITE_DEFAULT_LOCALE=en

ENV VITE_API_BASE_URL=${VITE_API_BASE_URL} \
    VITE_WS_BASE_URL=${VITE_WS_BASE_URL} \
    VITE_DEFAULT_LOCALE=${VITE_DEFAULT_LOCALE}

RUN npm run build

FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime

COPY docker/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder --chown=101:101 /build/frontend/dist/ /usr/share/nginx/html/

USER 101

EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=3s --retries=5 \
    CMD wget -qO- http://127.0.0.1:8080/health/live/ >/dev/null || exit 1
