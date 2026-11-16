#!/usr/bin/env bash
# Comprueba contra un Keycloak ya configurado que el realm y los clientes quedaron como dice config/.
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; . ./.env; set +a

realm="$KC_URL/realms/$REALM"
fail=0
expect() { # descripción, código esperado, código obtenido
  if [[ $2 == "$3" ]]; then echo "ok    $1"; else echo "FALLA $1: $3, se esperaba $2"; fail=1; fi
}
code() { curl -s -o /dev/null -w '%{http_code}' "$@"; }
token() { curl -sf -d grant_type=client_credentials -d client_id=accounts -d client_secret="$ACCOUNTS_CLIENT_SECRET" "$@" \
  "$realm/protocol/openid-connect/token" | python3 -c 'import sys,json;print(json.load(sys.stdin)["access_token"])'; }

issuer=$(curl -sf "$realm/.well-known/openid-configuration" | python3 -c 'import sys,json;print(json.load(sys.stdin)["issuer"])')
expect "emisor del realm" "$realm" "$issuer"

challenge=$(python3 -c 'import secrets,hashlib,base64;print(base64.urlsafe_b64encode(hashlib.sha256(secrets.token_bytes(32)).digest()).decode().rstrip("="))')
login="$realm/protocol/openid-connect/auth?client_id=accounts&response_type=code&scope=openid&redirect_uri=$ACCOUNTS_URL/auth/callback&code_challenge=$challenge&code_challenge_method=S256"
expect "página de inicio de sesión de la Cuenta" 200 "$(code "$login")"
expect "la página de entrar usa el tema fretchcop" yes "$(curl -s "$login" | grep -q 'login/fretchcop/css/fretchcop.css' && echo yes || echo no)"
# Sin PKCE, Keycloak devuelve al cliente un error en la redirección en vez de la página de entrar.
nopkce=$(curl -s -o /dev/null -w '%{redirect_url}' "$realm/protocol/openid-connect/auth?client_id=accounts&response_type=code&scope=openid&redirect_uri=$ACCOUNTS_URL/auth/callback")
expect "sin PKCE no entra" invalid_request "$(sed -n 's/.*error=\([a-z_]*\).*/\1/p' <<<"$nopkce")"

admin="$KC_URL/admin/realms/$REALM"
sa=$(token -d scope=kc-admin-api)
expect "la cuenta de servicio lee eventos" 200 "$(code -H "Authorization: Bearer $sa" "$admin/events?max=1")"
expect "la cuenta de servicio no ve usuarios" 403 "$(code -H "Authorization: Bearer $sa" "$admin/users?max=1")"
expect "sin kc-admin-api no hay administración" 401 "$(code -H "Authorization: Bearer $(token)" "$admin/events?max=1")"

expect "la consola de cuenta de Keycloak está apagada" 400 "$(code "$realm/protocol/openid-connect/auth?client_id=account-console&response_type=code&scope=openid&redirect_uri=$KC_URL/realms/$REALM/account/")"

# El tema copia login-config-totp.ftl de keycloak.v2: si una versión nueva de Keycloak cambia la de serie, hay que
# pasar sus cambios a la copia y poner aquí el sha256 nuevo.
. ./versions.env
totp_ftl=$(python3 -c 'import sys,zipfile,hashlib;print(hashlib.sha256(zipfile.ZipFile(sys.argv[1]).read("theme/keycloak.v2/login/login-config-totp.ftl")).hexdigest())' \
  ".cache/keycloak-$KEYCLOAK_VERSION/lib/lib/main/org.keycloak.keycloak-themes-$KEYCLOAK_VERSION.jar")
expect "login-config-totp.ftl de serie, la que copia el tema" 182a0e44f35be72d5cca2446c275c722f4bd60dc0cb21b08314aa9bd5338be1d "$totp_ftl"

exit $fail
