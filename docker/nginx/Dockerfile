# syntax=docker/dockerfile:1.7

FROM nginxinc/nginx-unprivileged:1.27-alpine

COPY docker/nginx/templates/ /etc/nginx/templates/

EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=3s --retries=5 \
    CMD wget -qO- http://127.0.0.1:8080/health/live/ >/dev/null || exit 1
