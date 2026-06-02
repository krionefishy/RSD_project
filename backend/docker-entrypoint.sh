#!/bin/sh
set -eu

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "Applying database migrations..."
  cd /
  alembic upgrade head
  cd /backend
fi

if [ "${RUN_DEMO_SEED:-true}" = "true" ]; then
  env_mode=$(python -c "from shared.settings.config import load_settings; import os; print(load_settings(os.getenv('CONFIG_PATH')).env_mode)")
  case "$env_mode" in
    demo|docker)
      echo "Seeding demo database (environment=${env_mode})..."
      python -m scripts.seed_demo
      ;;
    *)
      echo "Skipping demo seed (environment=${env_mode})."
      ;;
  esac
fi

exec "$@"
