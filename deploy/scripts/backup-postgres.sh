#!/usr/bin/env bash
set -Eeuo pipefail

umask 077

PROJECT_DIR="${PROJECT_DIR:-/opt/rsd}"
COMPOSE_FILE="${COMPOSE_FILE:-${PROJECT_DIR}/deploy/docker-compose.yaml}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/rsd-postgres}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
FINAL_DIR="${BACKUP_DIR}/${TIMESTAMP}"
WORK_DIR="${BACKUP_DIR}/.${TIMESTAMP}.tmp"

cleanup() {
  if [[ -d "${WORK_DIR}" ]]; then
    rm -rf -- "${WORK_DIR}"
  fi
}
trap cleanup EXIT

install -d -m 0700 "${BACKUP_DIR}"
mkdir -m 0700 "${WORK_DIR}"

compose=(docker compose --project-directory "${PROJECT_DIR}/deploy" -f "${COMPOSE_FILE}")

for service in db report_db; do
  if [[ "$("${compose[@]}" ps --status running --services "${service}")" != "${service}" ]]; then
    echo "PostgreSQL service is not running: ${service}" >&2
    exit 1
  fi
done

dump_database() {
  local service="$1"
  local output="$2"

  "${compose[@]}" exec -T "${service}" sh -eu -c \
    'pg_dump --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" --format=custom --compress=6 --no-owner --no-privileges' \
    > "${output}"

  test -s "${output}"
  "${compose[@]}" exec -T "${service}" pg_restore --list < "${output}" >/dev/null
}

dump_database db "${WORK_DIR}/rsd_db.dump"
dump_database report_db "${WORK_DIR}/rsd_reports.dump"

(
  cd "${WORK_DIR}"
  sha256sum rsd_db.dump rsd_reports.dump > SHA256SUMS
)

mv "${WORK_DIR}" "${FINAL_DIR}"
trap - EXIT

find "${BACKUP_DIR}" -mindepth 1 -maxdepth 1 -type d -name '20??????T??????Z' \
  -mtime "+${RETENTION_DAYS}" -exec rm -rf -- {} +

echo "PostgreSQL backup completed: ${FINAL_DIR}"
