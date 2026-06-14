#!/usr/bin/env bash
# Generates backend/shared/settings/config.production.yaml with random secrets.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
OUTPUT="${ROOT_DIR}/backend/shared/settings/config.production.yaml"

gen_alnum() {
  local len=$1
  openssl rand -hex 32 | tr -dc 'a-zA-Z0-9' | cut -c1-"$len"
}

DB_PASSWORD="$(gen_alnum 16)"
REPORT_DB_PASSWORD="$(gen_alnum 16)"
USER_JWT_SECRET="$(openssl rand -base64 48 | tr -d '\n')"
SERVICE_JWT_SECRET="$(openssl rand -base64 48 | tr -d '\n')"
REDIS_PASSWORD="$(gen_alnum 16)"

cat >"$OUTPUT" <<EOF
# Generated: $(date '+%Y-%m-%d %H:%M:%S %z')
# Mount or copy to server; do not commit.

environment: production
log_level: INFO

database:
  host: db
  port: 5432
  user: app
  password: ${DB_PASSWORD}
  database: rsd_db
  echo: false

main_replica_database:
  enabled: false
  host: db
  port: 5432
  user: app_readonly
  password: ${DB_PASSWORD}
  database: rsd_db

backend:
  jwt:
    secret: ${USER_JWT_SECRET}
    algorithm: HS256
    access_expire_seconds: 900
    refresh_expire_seconds: 259200
    rsa_private_key_pem: null
    rsa_key_size: 2048
  redis:
    host: redis
    port: 6379
    db: 0
    password: ${REDIS_PASSWORD}
  kafka:
    bootstrap_servers: kafka:9092
    consumer_group: rsd-backend-production-group
    max_request_size: 10485760
  s3:
    endpoint_url: http://minio:9000
    tenant_id: ""
    key_id: minioadmin
    secret_key: minioadmin
    bucket_name: rsd-bucket
    region: ru-central-1
    verify: true

inter_service_auth:
  jwt:
    secret: ${SERVICE_JWT_SECRET}
    algorithm: HS256
    issuer: rsd-backend
    audience: rsd-report-service
    expire_seconds: 300
    allowed_subjects:
      - backend

services:
  report_service:
    enabled: true
    base_url: http://report_service:8000
    timeout_seconds: 120

report_service:
  database:
    host: db
    port: 5432
    user: report_app
    password: ${REPORT_DB_PASSWORD}
    database: rsd_reports
    echo: false
  kafka:
    consumer_group: rsd-report-service-production-group
EOF

chmod 600 "$OUTPUT"

echo "Written: $OUTPUT"
echo ""
echo "Remember these:"
echo "  DB_PASSWORD=${DB_PASSWORD}"
echo "  REPORT_DB_PASSWORD=${REPORT_DB_PASSWORD}"
echo "  REDIS_PASSWORD=${REDIS_PASSWORD}"
