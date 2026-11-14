#!/usr/bin/env bash
# Aplica config/ a Keycloak con keycloak-config-cli: crea lo que falta y actualiza lo que cambió, sin tocar
# usuarios ni sesiones. Entra con la cuenta de servicio del arranque.
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; . ./.env; set +a
scripts/fetch.sh >/dev/null

exec java -jar .cache/keycloak-config-cli.jar \
  --keycloak.url="$KC_URL" \
  --keycloak.grant-type=client_credentials \
  --keycloak.client-id="$KC_BOOTSTRAP_ADMIN_CLIENT_ID" \
  --keycloak.client-secret="$KC_BOOTSTRAP_ADMIN_CLIENT_SECRET" \
  --keycloak.availability-check.enabled=true \
  --import.files.locations='config/*.yaml' \
  --import.var-substitution.enabled=true \
  --logging.level.root=warn --logging.level.de.adorsys=info --spring.main.banner-mode=off
