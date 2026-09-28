#!/bin/sh
set -eu

primary_host="${PRIMARY_HOST:-db}"
primary_port="${PRIMARY_PORT:-5432}"
replication_user="${POSTGRES_REPLICATION_USER:-replicator}"
replication_password="${POSTGRES_REPLICATION_PASSWORD:-replicatorsecret}"

if [ ! -s "$PGDATA/PG_VERSION" ]; then
    rm -rf "$PGDATA"/*
    export PGPASSWORD="$replication_password"

    until pg_isready -h "$primary_host" -p "$primary_port" -U "$replication_user"; do
        sleep 2
    done
    pg_basebackup \
        -h "$primary_host" \
        -p "$primary_port" \
        -U "$replication_user" \
        -D "$PGDATA" \
        -Fp \
        -Xs \
        -P
    touch "$PGDATA/standby.signal"
    chmod 700 "$PGDATA"
fi

# Refresh credentials on every start so replication password rotation does not
# require rebuilding the replica volume.
cat > "$PGDATA/postgresql.auto.conf" <<EOF
primary_conninfo = 'host=$primary_host port=$primary_port user=$replication_user password=$replication_password application_name=${REPLICA_APPLICATION_NAME:-main_db_replica}'
EOF

exec docker-entrypoint.sh postgres \
    -c hot_standby=on \
    -c shared_preload_libraries=pg_stat_statements \
    -c shared_buffers="${POSTGRES_SHARED_BUFFERS:-256MB}" \
    -c work_mem="${POSTGRES_WORK_MEM:-8MB}" \
    -c maintenance_work_mem="${POSTGRES_MAINTENANCE_WORK_MEM:-128MB}" \
    -c effective_cache_size="${POSTGRES_EFFECTIVE_CACHE_SIZE:-1GB}" \
    -c max_connections="${POSTGRES_MAX_CONNECTIONS:-100}" \
    -c log_min_duration_statement="${POSTGRES_LOG_MIN_DURATION_STATEMENT:-500ms}" \
    -c log_checkpoints=on \
    -c log_lock_waits=on
