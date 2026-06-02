#!/usr/bin/env bash
# Generates deploy/production-secrets.txt for pasting into deploy/.env.production
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT="${SCRIPT_DIR}/production-secrets.txt"

gen_alnum() {
  local len=$1
  # macOS: head closes the pipe early; with pipefail the script exits 141
  openssl rand -hex 32 | tr -dc 'a-zA-Z0-9' | cut -c1-"$len"
}

DB_PASSWORD="$(gen_alnum 6)"
REDIS_PASSWORD="$(gen_alnum 8)"
JWT_SECRET="$(openssl rand -base64 48 | tr -d '\n')"

cat >"$OUTPUT" <<EOF
# Generated: $(date '+%Y-%m-%d %H:%M:%S %z')
# Copy into deploy/.env.production on the server. Do not commit.

# === Domains for Nginx ===
FRONTEND_DOMAIN=rsdobin.ru
API_DOMAIN=rsdobin.ru
SSL_CERT_PATH=/etc/nginx/certs/live/rsdobin.ru/fullchain.pem
SSL_CERT_KEY_PATH=/etc/nginx/certs/live/rsdobin.ru/privkey.pem

# === Database ===
DB_HOST=db
DB_PORT=5432
DB_USER=app
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=rsd_db

# === Redis ===
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=${REDIS_PASSWORD}

# === Kafka ===
KAFKA_BOOTSTRAP_SERVERS=kafka:9092

# === Security ===
JWT_SECRET=${JWT_SECRET}
JWT_ALGORITHM=HS256
CORS_ORIGINS=https://rsdobin.ru

# === Environment ===
ENVIRONMENT=production
RUN_DEMO_SEED=false
LOG_LEVEL=INFO
EOF

chmod 600 "$OUTPUT"

echo "Written: $OUTPUT"
echo ""
echo "Remember these (DB is 6 chars on purpose):"
echo "  DB_PASSWORD=${DB_PASSWORD}"
echo "  REDIS_PASSWORD=${REDIS_PASSWORD}"
echo "  JWT_SECRET=<48 chars in file>"
