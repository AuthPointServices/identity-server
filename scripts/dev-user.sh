#!/usr/bin/env bash
# Crea una cuenta de prueba ya verificada; si existe, no la toca. scripts/dev-user.sh correo contraseña [nombre apellido]
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; . ./.env; set +a
email=${1:?correo} pass=${2:?contraseña} first=${3:-Ana} last=${4:-Prueba}

token=$(curl -sf -d grant_type=client_credentials -d client_id="$KC_BOOTSTRAP_ADMIN_CLIENT_ID" -d client_secret="$KC_BOOTSTRAP_ADMIN_CLIENT_SECRET" \
  "$KC_URL/realms/master/protocol/openid-connect/token" | python3 -c 'import sys,json;print(json.load(sys.stdin)["access_token"])')
api="$KC_URL/admin/realms/$REALM"
auth=(-H "Authorization: Bearer $token" -H 'Content-Type: application/json')

body=$(python3 -c 'import json,sys;print(json.dumps({"username":sys.argv[1],"email":sys.argv[1],"firstName":sys.argv[2],"lastName":sys.argv[3],"enabled":True,"emailVerified":True}))' "$email" "$first" "$last")
code=$(curl -s -o /dev/null -w '%{http_code}' "${auth[@]}" -d "$body" "$api/users")
[[ $code == 201 || $code == 409 ]] || { echo "crear la cuenta: $code" >&2; exit 1; }
[[ $code == 409 ]] && { echo "$email ya existe"; exit 0; }

id=$(curl -sf "${auth[@]}" "$api/users?email=$(python3 -c 'import urllib.parse,sys;print(urllib.parse.quote(sys.argv[1]))' "$email")&exact=true" \
  | python3 -c 'import sys,json;print(json.load(sys.stdin)[0]["id"])')
pw=$(python3 -c 'import json,sys;print(json.dumps({"type":"password","value":sys.argv[1],"temporary":False}))' "$pass")
curl -sf -X PUT "${auth[@]}" -d "$pw" "$api/users/$id/reset-password"
echo "$email ($id)"
