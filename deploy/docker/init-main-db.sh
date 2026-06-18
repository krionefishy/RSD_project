#!/bin/sh
set -eu

# Allow replication connections from any host in the internal Docker network.
# pg_hba.conf is written before postgres starts accepting connections,
# so we append here and reload.
cat >> "$PGDATA/pg_hba.conf" <<HBA

# Allow streaming replication from Docker internal network
host  replication  ${POSTGRES_REPLICATION_USER:-replicator}  0.0.0.0/0  md5
HBA

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<SQL
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${POSTGRES_REPLICATION_USER:-replicator}') THEN
        CREATE ROLE ${POSTGRES_REPLICATION_USER:-replicator}
            WITH REPLICATION LOGIN PASSWORD '${POSTGRES_REPLICATION_PASSWORD:-replicatorsecret}';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${MAIN_REPLICA_READONLY_USER:-report_reader}') THEN
        CREATE ROLE ${MAIN_REPLICA_READONLY_USER:-report_reader}
            WITH LOGIN PASSWORD '${MAIN_REPLICA_READONLY_PASSWORD:-reportreadersecret}';
    END IF;
END
\$\$;

GRANT CONNECT ON DATABASE ${POSTGRES_DB} TO ${MAIN_REPLICA_READONLY_USER:-report_reader};
GRANT USAGE ON SCHEMA public TO ${MAIN_REPLICA_READONLY_USER:-report_reader};
GRANT SELECT ON ALL TABLES IN SCHEMA public TO ${MAIN_REPLICA_READONLY_USER:-report_reader};
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT ON TABLES TO ${MAIN_REPLICA_READONLY_USER:-report_reader};
SQL

# Reload pg_hba.conf so the replication rule takes effect immediately.
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
    -c "SELECT pg_reload_conf();"
