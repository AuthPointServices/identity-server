#!/usr/bin/env bash
# Keycloak en modo desarrollo contra la base local, en KC_PORT. Ctrl+C lo detiene.
set -euo pipefail
cd "$(dirname "$0")/.."
. ./versions.env
set -a; . ./.env; set +a

scripts/fetch.sh
scripts/db.sh
# Los correos se leen de themes/ sin copiarlos; start-dev no los guarda en caché, así un cambio se ve al recargar.
ln -sfn "$PWD/themes/fretchcop" ".cache/keycloak-$KEYCLOAK_VERSION/themes/fretchcop"
# Las pantallas de acceso son el jar de login-ui (React con Keycloakify): tras cambiarlas, construirlo y reiniciar.
jar=login-ui/dist_keycloak/fretchcop-login.jar
[[ -f $jar ]] || { echo "Falta $jar: pnpm --dir login-ui install && pnpm --dir login-ui build" >&2; exit 1; }
cp "$jar" ".cache/keycloak-$KEYCLOAK_VERSION/providers/fretchcop-login.jar"
# Los pasos de flujo propios (providers/) se compilan en cada arranque contra el Keycloak fijado: sin Maven.
build=.cache/providers-build
rm -rf "$build" && mkdir -p "$build"
javac --release 21 -cp ".cache/keycloak-$KEYCLOAK_VERSION/lib/lib/main/*" -d "$build" $(find providers/src/main/java -name '*.java')
cp -r providers/src/main/resources/. "$build"
jar --create --file ".cache/keycloak-$KEYCLOAK_VERSION/providers/fretchcop-providers.jar" -C "$build" .

# En desarrollo, «Revisa tu correo» abre Mailpit en vez del webmail de la persona (el tema lo lee de aquí).
export FC_DEV_INBOX_URL="${MAILPIT_UI:-}"
exec ".cache/keycloak-$KEYCLOAK_VERSION/bin/kc.sh" start-dev \
  --http-port="$KC_PORT" \
  --http-management-port="$KC_MANAGEMENT_PORT" \
  --health-enabled=true \
  --spi-events-listener--email--exclude-events=LOGIN_ERROR \
  --db=postgres --db-url="$KC_DB_URL" --db-username="$KC_DB_USERNAME" --db-password="$KC_DB_PASSWORD"
