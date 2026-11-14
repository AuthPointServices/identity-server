#!/usr/bin/env bash
# Mailpit: recibe todo el correo de desarrollo (verificar, recuperar) y lo muestra en MAILPIT_UI.
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; . ./.env; set +a
scripts/fetch.sh >/dev/null
exec .cache/mailpit --smtp "127.0.0.1:$SMTP_PORT" --listen "127.0.0.1:${MAILPIT_UI##*:}" --database .data/mailpit.db
