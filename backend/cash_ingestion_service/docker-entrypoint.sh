#!/usr/bin/env sh
set -e

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  alembic -c /service/alembic.ini upgrade head
fi

exec "$@"
