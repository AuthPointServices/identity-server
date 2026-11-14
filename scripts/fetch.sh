#!/usr/bin/env bash
# Descarga lo fijado en versions.env a .cache/ y comprueba cada suma; si ya está, no hace nada.
set -euo pipefail
cd "$(dirname "$0")/.."
. ./versions.env
mkdir -p .cache

get() { # url archivo sha256
  local url=$1 out=.cache/$2 sum=$3
  if [[ ! -f $out ]]; then
    echo ">> $2"
    curl -fsSL --retry 3 -o "$out.part" "$url"
    mv "$out.part" "$out"
  fi
  echo "$sum  $out" | sha256sum -c --quiet - || { rm -f "$out"; echo "suma incorrecta: $2" >&2; exit 1; }
}

kc=keycloak-$KEYCLOAK_VERSION
get "https://github.com/keycloak/keycloak/releases/download/$KEYCLOAK_VERSION/$kc.tar.gz" "$kc.tar.gz" "$KEYCLOAK_SHA256"
[[ -d .cache/$kc ]] || tar -xzf ".cache/$kc.tar.gz" -C .cache

get "https://github.com/adorsys/keycloak-config-cli/releases/download/v$KCC_VERSION/keycloak-config-cli-$KCC_KEYCLOAK.jar" \
  keycloak-config-cli.jar "$KCC_SHA256"

get "https://github.com/axllent/mailpit/releases/download/v$MAILPIT_VERSION/mailpit-linux-amd64.tar.gz" \
  "mailpit-$MAILPIT_VERSION.tar.gz" "$MAILPIT_SHA256"
[[ -x .cache/mailpit ]] || tar -xzf ".cache/mailpit-$MAILPIT_VERSION.tar.gz" -C .cache mailpit
