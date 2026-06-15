#!/usr/bin/env bash
# Demo 1 local stack: infra → migrations → seed → backend + report_service + frontend_demos.
#
# Usage:
#   ./scripts/demo1-local.sh           # full start
#   ./scripts/demo1-local.sh --fresh   # reset main DB, then seed
#   ./scripts/demo1-local.sh --no-seed # skip seed (keep existing data)
#   ./scripts/demo1-local.sh --setup-only  # infra + migrate + seed, no app processes
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

COMPOSE="docker compose -f docker-compose.local.yml"
PYTHON="${PYTHON:-$ROOT/backend/venv/bin/python}"
CONFIG_DEMO="backend/shared/settings/config.demo.yaml"
DATABASE_URL="${LOCAL_DATABASE_URL:-postgresql+asyncpg://app:appsecret@localhost:5437/rsd_db}"
VITE_API_URL="${VITE_API_URL:-http://localhost:8000/api/v1}"
LOG_DIR="${TMPDIR:-/tmp}/rsd-demo1-logs-$$"

FRESH=0
SEED=1
SETUP_ONLY=0

for arg in "$@"; do
  case "$arg" in
    --fresh) FRESH=1 ;;
    --no-seed) SEED=0 ;;
    --setup-only) SETUP_ONLY=1 ;;
    -h|--help)
      sed -n '2,9p' "$0"
      exit 0
      ;;
    *)
      echo "Unknown option: $arg" >&2
      exit 1
      ;;
  esac
done

PIDS=()

log() {
  printf '\n\033[1;36m▶ %s\033[0m\n' "$*"
}

die() {
  printf '\033[1;31m✗ %s\033[0m\n' "$*" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Missing command: $1"
}

cleanup() {
  if ((${#PIDS[@]} > 0)); then
    log "Stopping app processes..."
    for pid in "${PIDS[@]}"; do
      kill "$pid" 2>/dev/null || true
    done
  fi
}
trap cleanup EXIT INT TERM

wait_for_postgres() {
  local service="$1"
  local user="$2"
  local db="$3"
  local attempts=30
  while ((attempts > 0)); do
    if $COMPOSE exec -T "$service" pg_isready -U "$user" -d "$db" >/dev/null 2>&1; then
      return 0
    fi
    attempts=$((attempts - 1))
    sleep 1
  done
  die "Postgres not ready: $service ($db)"
}

start_background() {
  local name="$1"
  shift
  mkdir -p "$LOG_DIR"
  local logfile="$LOG_DIR/$name.log"
  "$@" >"$logfile" 2>&1 &
  local pid=$!
  PIDS+=("$pid")
  printf '  • %s (pid %s, log %s)\n' "$name" "$pid" "$logfile"
}

require_cmd docker
docker info >/dev/null 2>&1 || die "Docker is not running"

if [[ ! -x "$PYTHON" ]]; then
  die "Python venv not found at $PYTHON — run: cd backend && python3 -m venv venv && pip install -r requirements.txt"
fi

log "Starting infrastructure (Postgres, Redis, Kafka, report_db, replica)..."
$COMPOSE up -d

log "Waiting for databases..."
wait_for_postgres db app rsd_db
wait_for_postgres report_db report_service rsd_reports

if ((FRESH)); then
  log "Resetting main database..."
  just db-rebuild
else
  log "Applying main database migrations..."
  DATABASE_URL="$DATABASE_URL" "$PYTHON" -m alembic upgrade head
fi

log "Applying report_service migrations..."
(
  cd "$ROOT/backend/report_service"
  env -u DATABASE_URL CONFIG_PATH="../shared/settings/config.demo.yaml" PYTHONPATH=".." \
    "$PYTHON" -m alembic upgrade head
)

if ((SEED)); then
  log "Seeding Demo 1 dataset..."
  CONFIG_PATH="$CONFIG_DEMO" DATABASE_URL="$DATABASE_URL" \
    "$PYTHON" "$ROOT/scripts/seed_demo1.py"
else
  log "Skipping seed (--no-seed)"
fi

if ((SETUP_ONLY)); then
  log "Setup complete (--setup-only). Apps were not started."
  exit 0
fi

if [[ ! -d "$ROOT/frontend_demos/node_modules" ]]; then
  log "Installing frontend_demos dependencies..."
  (cd "$ROOT/frontend_demos" && npm install)
fi

log "Starting application processes..."
start_background backend \
  env CONFIG_PATH="$CONFIG_DEMO" PYTHONPATH="$ROOT/backend" \
  "$PYTHON" -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

start_background report_service \
  env CONFIG_PATH="$CONFIG_DEMO" PYTHONPATH="$ROOT/backend" \
  "$PYTHON" -m uvicorn report_service.app.main:app --reload --host 0.0.0.0 --port 8001

start_background frontend_demos \
  env VITE_API_URL="$VITE_API_URL" VITE_DEMO1_MODE=true VITE_DEMO_MODE=true \
  npm --prefix "$ROOT/frontend_demos" run dev

sleep 2

cat <<EOF

══════════════════════════════════════════════════════════════
  Demo 1 is running. Press Ctrl+C to stop everything.
══════════════════════════════════════════════════════════════
  UI:              http://localhost:5173  (see frontend log if port differs)
  Backend API:     http://localhost:8000/api/v1/health
  Report service:  http://localhost:8001/api/v1/health

  Login: staff_admin_001 / Password123!  (see backend/scripts/demo_accounts.json)
  Logs:  $LOG_DIR/
══════════════════════════════════════════════════════════════

EOF

wait
