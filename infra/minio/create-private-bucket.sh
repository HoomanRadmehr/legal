set -eu

endpoint_url="http://${MINIO_ENDPOINT}"
bucket_name="${MINIO_BUCKET_DOCUMENTS}"

mc alias set local "${endpoint_url}" "${MINIO_ACCESS_KEY}" "${MINIO_SECRET_KEY}"
mc mb --ignore-existing "local/${bucket_name}"
mc anonymous set none "local/${bucket_name}"
if mc cors --help >/dev/null 2>&1; then
  mc cors set "local/${bucket_name}" /etc/minio/cors-dev.json
else
  echo "mc cors command is unavailable; using MINIO_API_CORS_ALLOW_ORIGIN on the MinIO server."
fi
mc stat "local/${bucket_name}" >/dev/null
