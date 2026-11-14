#!/usr/bin/env bash
# Crea el rol y la base de Keycloak en el Postgres local si no están. Se puede correr las veces que haga falta.
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; . ./.env; set +a

db=${KC_DB_URL##*/}
psql "$PG_ADMIN_DSN" -v ON_ERROR_STOP=1 -qAt \
  -v user="$KC_DB_USERNAME" -v pass="$KC_DB_PASSWORD" -v db="$db" <<'SQL'
SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', :'user', :'pass')
  WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = :'user') \gexec
SELECT format('CREATE DATABASE %I OWNER %I', :'db', :'user')
  WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = :'db') \gexec
SQL
echo "base $db lista para $KC_DB_USERNAME"
