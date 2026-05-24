#!/bin/sh
set -eu

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "Applying database migrations..."
  cd /
  alembic upgrade head
  cd /backend
fi

if [ "${RUN_DEMO_SEED:-true}" = "true" ]; then
  echo "Seeding demo database..."
  python -m scripts.seed_demo
fi

exec "$@"
