#!/usr/bin/env bash
# Aplica config/ a Keycloak con keycloak-config-cli: crea lo que falta y actualiza lo que cambió, sin tocar
# usuarios ni sesiones. Entra con la cuenta de servicio del arranque.
set -euo pipefail
cd "$(dirname "$0")/.."
# En local, de .env; en el contenedor de config (Dockerfile), del entorno y con el jar ya en la imagen.
if [[ -f .env ]]; then set -a; . ./.env; set +a; fi
jar=${KCC_JAR:-.cache/keycloak-config-cli.jar}
[[ -n ${KCC_JAR:-} ]] || scripts/fetch.sh >/dev/null
# Un cliente sin secreto quedaría abierto: cada uno tiene que tener el suyo.
for v in ACCOUNTS_CLIENT_SECRET ORANGE_CLIENT_SECRET LETGRID_CLIENT_SECRET; do
  [[ -n ${!v:-} ]] || { echo "Falta $v en .env (openssl rand -hex 32)" >&2; exit 1; }
done
# En el contenedor (producción), los valores de ejemplo de .env.example no valen.
# ponytail: sólo reconoce los de ejemplo (dev-…, …_dev, admin); no mide la fuerza de un secreto.
if [[ -n ${KCC_JAR:-} ]]; then
  for v in KC_BOOTSTRAP_ADMIN_CLIENT_SECRET KC_BOOTSTRAP_ADMIN_PASSWORD KC_DB_PASSWORD ACCOUNTS_CLIENT_SECRET ORANGE_CLIENT_SECRET LETGRID_CLIENT_SECRET; do
    case ${!v:-} in dev-* | *_dev | admin) echo "$v tiene el valor de ejemplo de .env.example: genera uno (openssl rand -hex 32)" >&2; exit 1 ;; esac
  done
fi
# Un proveedor de acceso sin CLIENT_ID queda apagado (config/realm.yaml).
for p in GOOGLE FACEBOOK GITHUB; do id="${p}_CLIENT_ID"; export "${p}_ENABLED=$([[ -n ${!id:-} ]] && echo true || echo false)"; done

exec java -jar "$jar" \
  --keycloak.url="$KC_URL" \
  --keycloak.grant-type=client_credentials \
  --keycloak.client-id="$KC_BOOTSTRAP_ADMIN_CLIENT_ID" \
  --keycloak.client-secret="$KC_BOOTSTRAP_ADMIN_CLIENT_SECRET" \
  --keycloak.availability-check.enabled=true \
  --import.files.locations='config/*.yaml' \
  --import.var-substitution.enabled=true \
  --logging.level.root=warn --logging.level.de.adorsys=info --spring.main.banner-mode=off
