set -eu

endpoint_url="http://${MINIO_ENDPOINT}"
bucket_name="${MINIO_BUCKET_DOCUMENTS}"

mc alias set local "${endpoint_url}" "${MINIO_ACCESS_KEY}" "${MINIO_SECRET_KEY}"
mc mb --ignore-existing "local/${bucket_name}"
mc anonymous set none "local/${bucket_name}"
mc cors set "local/${bucket_name}" /etc/minio/cors-dev.json
mc stat "local/${bucket_name}" >/dev/null
