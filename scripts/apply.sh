#!/usr/bin/env bash
# Aplica config/ a Keycloak con keycloak-config-cli: crea lo que falta y actualiza lo que cambió, sin tocar
# usuarios ni sesiones. Entra con la cuenta de servicio del arranque.
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; . ./.env; set +a
scripts/fetch.sh >/dev/null
# Un cliente sin secreto quedaría abierto: cada uno tiene que tener el suyo.
for v in ACCOUNTS_CLIENT_SECRET ORANGE_CLIENT_SECRET LETGRID_CLIENT_SECRET; do
  [[ -n ${!v:-} ]] || { echo "Falta $v en .env (openssl rand -hex 32)" >&2; exit 1; }
done
# Un proveedor de acceso sin CLIENT_ID queda apagado (config/realm.yaml).
for p in GOOGLE FACEBOOK GITHUB; do id="${p}_CLIENT_ID"; export "${p}_ENABLED=$([[ -n ${!id:-} ]] && echo true || echo false)"; done

exec java -jar .cache/keycloak-config-cli.jar \
  --keycloak.url="$KC_URL" \
  --keycloak.grant-type=client_credentials \
  --keycloak.client-id="$KC_BOOTSTRAP_ADMIN_CLIENT_ID" \
  --keycloak.client-secret="$KC_BOOTSTRAP_ADMIN_CLIENT_SECRET" \
  --keycloak.availability-check.enabled=true \
  --import.files.locations='config/*.yaml' \
  --import.var-substitution.enabled=true \
  --logging.level.root=warn --logging.level.de.adorsys=info --spring.main.banner-mode=off
