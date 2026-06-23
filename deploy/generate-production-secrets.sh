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

USER_JWT_SECRET="$(openssl rand -base64 48 | tr -d '\n')"
SERVICE_JWT_SECRET="$(openssl rand -base64 48 | tr -d '\n')"

# DB passwords are hardcoded in docker-compose.yaml to match these defaults.
# Change both here AND in docker-compose.yaml if you need different passwords.
DB_PASSWORD="appsecret"
REPLICA_READONLY_PASSWORD="reportreadersecret"
REPORT_DB_PASSWORD="reportsecret"

cat >"$OUTPUT" <<EOF
# Generated: $(date '+%Y-%m-%d %H:%M:%S %z')
# Do not commit — gitignored.

environment: production
log_level: INFO

database:
  host: db
  port: 5432
  user: app
  password: ${DB_PASSWORD}
  database: rsd_db
  echo: false

# Replica is enabled in prod — db_replica service runs in docker-compose.yaml.
# report_reader user is created automatically by deploy/docker/init-main-db.sh.
main_replica_database:
  enabled: true
  host: db_replica
  port: 5432
  user: report_reader
  password: ${REPLICA_READONLY_PASSWORD}
  database: rsd_db
  echo: false

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
  kafka:
    bootstrap_servers: kafka:9092
    consumer_group: rsd-backend-production-group
    max_request_size: 25165824
  s3:
    endpoint_url: https://s3.cloud.ru
    tenant_id: ""
    key_id: REPLACE_WITH_ACCESS_KEY
    secret_key: REPLACE_WITH_SECRET_KEY
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
    host: report_db
    port: 5432
    user: report_service
    password: ${REPORT_DB_PASSWORD}
    database: rsd_reports
    echo: false
  kafka:
    consumer_group: rsd-report-service-production-group
EOF

chmod 600 "$OUTPUT"

echo "Written: $OUTPUT"
echo ""
echo "Random secrets generated (save these):"
echo "  USER_JWT_SECRET    = ${USER_JWT_SECRET}"
echo "  SERVICE_JWT_SECRET = ${SERVICE_JWT_SECRET}"
