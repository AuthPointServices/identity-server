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
# La pantalla de acceso es la app de login-ui (Keycloakify): su HTML carga el bundle del tema.
expect "la página de entrar usa el tema fretchcop" yes "$(curl -s "$login" | grep -q 'login/fretchcop/dist/assets/' && echo yes || echo no)"
# Sin PKCE, Keycloak devuelve al cliente un error en la redirección en vez de la página de entrar.
nopkce=$(curl -s -o /dev/null -w '%{redirect_url}' "$realm/protocol/openid-connect/auth?client_id=accounts&response_type=code&scope=openid&redirect_uri=$ACCOUNTS_URL/auth/callback")
expect "sin PKCE no entra" invalid_request "$(sed -n 's/.*error=\([a-z_]*\).*/\1/p' <<<"$nopkce")"

admin="$KC_URL/admin/realms/$REALM"
sa=$(token -d scope=kc-admin-api)
expect "la cuenta de servicio lee eventos" 200 "$(code -H "Authorization: Bearer $sa" "$admin/events?max=1")"
expect "la cuenta de servicio lee los clientes" 200 "$(code -H "Authorization: Bearer $sa" "$admin/clients?max=1")"
leaked=$(curl -sf -H "Authorization: Bearer $sa" "$admin/clients?clientId=accounts" | python3 -c 'import sys,json;s=json.load(sys.stdin)[0].get("secret","");print("no" if set(s)<={"*"} else "sí")')
expect "sin ver ningún secreto" no "$leaked"
expect "la cuenta de servicio no ve usuarios" 403 "$(code -H "Authorization: Bearer $sa" "$admin/users?max=1")"
expect "sin kc-admin-api no hay administración" 401 "$(code -H "Authorization: Bearer $(token)" "$admin/events?max=1")"

expect "la consola de cuenta de Keycloak está apagada" 400 "$(code "$realm/protocol/openid-connect/auth?client_id=account-console&response_type=code&scope=openid&redirect_uri=$KC_URL/realms/$REALM/account/")"

# Recuperar la contraseña verifica el correo (providers/): el paso va justo después de enviar el enlace. El flujo sólo
# lo ve un administrador: la cuenta de servicio del arranque, la de apply.sh.
boot=$(curl -sf -d grant_type=client_credentials -d client_id="$KC_BOOTSTRAP_ADMIN_CLIENT_ID" -d client_secret="$KC_BOOTSTRAP_ADMIN_CLIENT_SECRET" \
  "$KC_URL/realms/master/protocol/openid-connect/token" | python3 -c 'import sys,json;print(json.load(sys.stdin)["access_token"])')
flow=$(curl -sf -H "Authorization: Bearer $boot" "$admin" | python3 -c 'import sys,json,urllib.parse;print(urllib.parse.quote(json.load(sys.stdin)["resetCredentialsFlow"]))')
steps=$(curl -sf -H "Authorization: Bearer $boot" "$admin/authentication/flows/$flow/executions" \
  | python3 -c 'import sys,json;print(" ".join(e.get("providerId","") for e in json.load(sys.stdin) if e["level"]==0))')
first=$(curl -sf -H "Authorization: Bearer $boot" "$admin" | python3 -c 'import sys,json,urllib.parse;print(urllib.parse.quote(json.load(sys.stdin)["browserFlow"]))')
first=$(curl -sf -H "Authorization: Bearer $boot" "$admin/authentication/flows/$first/executions" \
  | python3 -c 'import sys,json;print(" ".join(e.get("providerId","") for e in json.load(sys.stdin) if e.get("providerId")))')
expect "entrar pide primero el correo y luego la contraseña o un código por correo" yes "$([[ $first == *"email-first-form auth-password-form fc-email-code "* ]] && echo yes || echo no)"
expect "los dos pasos aceptan la app, un código por correo o uno de recuperación" yes "$([[ $first == *"auth-otp-form fc-email-code-2fa auth-recovery-authn-code-form"* ]] && echo yes || echo no)"
expect "los dos pasos se saltan en un dispositivo de confianza" yes "$([[ $first == *"conditional-credential fc-device-not-trusted auth-otp-form"* && $first == *"fc-remember-device"* ]] && echo yes || echo no)"
expect "abrir el enlace de recuperar verifica el correo" yes "$([[ $steps == *"reset-credential-email reset-link-verifies-email "* ]] && echo yes || echo no)"

# Orange y letgrid: entran por redirección con PKCE, sólo a su vuelta, y nunca con la contraseña directa.
for c in "orange $ORANGE_URL" "letgrid $LETGRID_URL"; do
  read -r id url <<<"$c"
  expect "$id: la página de entrar abre" 200 "$(code "$realm/protocol/openid-connect/auth?client_id=$id&response_type=code&scope=openid&redirect_uri=$url/auth/callback&code_challenge=$challenge&code_challenge_method=S256")"
  expect "$id: sin PKCE no entra" invalid_request "$(curl -s -o /dev/null -w '%{redirect_url}' "$realm/protocol/openid-connect/auth?client_id=$id&response_type=code&scope=openid&redirect_uri=$url/auth/callback" | sed -n 's/.*error=\([a-z_]*\).*/\1/p')"
  expect "$id: otra vuelta no vale" 400 "$(code "$realm/protocol/openid-connect/auth?client_id=$id&response_type=code&scope=openid&redirect_uri=https://evil.example/auth/callback&code_challenge=$challenge&code_challenge_method=S256")"
  expect "$id: sin contraseña directa" unauthorized_client "$(curl -s -d grant_type=password -d client_id="$id" -d client_secret=x -d username=a -d password=b "$realm/protocol/openid-connect/token" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("error"))')"
done

# Los proveedores de acceso salen de config/realm.yaml: encendidos los que tienen CLIENT_ID en .env.
idps=$(curl -sf -H "Authorization: Bearer $boot" "$admin/identity-provider/instances" \
  | python3 -c 'import sys,json;print(" ".join("%s=%s" % (i["alias"], str(i["enabled"]).lower()) for i in sorted(json.load(sys.stdin), key=lambda i: i["alias"])))')
want=""; for p in facebook github google; do id="${p^^}_CLIENT_ID"; want+="$p=$([[ -n ${!id:-} ]] && echo true || echo false) "; done
expect "los proveedores de acceso son los de .env" "${want% }" "$idps"

exit $fail
