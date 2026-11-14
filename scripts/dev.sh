#!/usr/bin/env bash
# Keycloak en modo desarrollo contra la base local, en KC_PORT. Ctrl+C lo detiene.
set -euo pipefail
cd "$(dirname "$0")/.."
. ./versions.env
set -a; . ./.env; set +a

scripts/fetch.sh
scripts/db.sh

exec ".cache/keycloak-$KEYCLOAK_VERSION/bin/kc.sh" start-dev \
  --http-port="$KC_PORT" \
  --http-management-port="$KC_MANAGEMENT_PORT" \
  --health-enabled=true \
  --db=postgres --db-url="$KC_DB_URL" --db-username="$KC_DB_USERNAME" --db-password="$KC_DB_PASSWORD"
