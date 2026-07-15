# syntax=docker/dockerfile:1.7

FROM minio/mc:RELEASE.2024-07-15T17-46-06Z-cpuv1

COPY infra/minio/create-private-bucket.sh /scripts/create-private-bucket.sh

ENTRYPOINT ["/bin/sh", "/scripts/create-private-bucket.sh"]
