#!/usr/bin/env bash
# Keycloak en modo desarrollo contra la base local, en KC_PORT. Ctrl+C lo detiene.
set -euo pipefail
cd "$(dirname "$0")/.."
. ./versions.env
set -a; . ./.env; set +a

scripts/fetch.sh
scripts/db.sh
# El tema se lee de themes/ sin copiarlo; start-dev no lo guarda en caché, así un cambio se ve al recargar.
ln -sfn "$PWD/themes/fretchcop" ".cache/keycloak-$KEYCLOAK_VERSION/themes/fretchcop"

exec ".cache/keycloak-$KEYCLOAK_VERSION/bin/kc.sh" start-dev \
  --http-port="$KC_PORT" \
  --http-management-port="$KC_MANAGEMENT_PORT" \
  --health-enabled=true \
  --spi-events-listener--email--exclude-events=LOGIN_ERROR \
  --db=postgres --db-url="$KC_DB_URL" --db-username="$KC_DB_USERNAME" --db-password="$KC_DB_PASSWORD"
