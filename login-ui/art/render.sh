#!/usr/bin/env bash
# Vuelve a renderizar las ilustraciones de las pantallas de estado (src/login/assets/states/*.webp).
# Las escenas están en art/scene.js (three.js); el fuego es el shader de components/FireField.tsx.
# Necesita: CHROME (un Chromium), PLAYWRIGHT (ruta al index.mjs de playwright-core), python3 e ImageMagick.
# Uso: art/render.sh [escena,...]   (sin argumentos, todas)
set -euo pipefail
cd "$(dirname "$0")/.."
kinds=${1:-email-ok,account-ok,signed-in,signed-out,expired,error,cookies}
mkdir -p art/out
# El shader del panel, tal cual, para la textura de la obsidiana.
python3 - <<'PY'
import re
src = open('src/login/components/FireField.tsx').read()
open('art/fire.js', 'w').write('export const FIRE = `' + re.search(r"const FRAGMENT = `(.*?)`;", src, re.S).group(1) + '`;\n')
PY
python3 -m http.server 6197 --bind 127.0.0.1 >/dev/null 2>&1 & server=$!
trap 'kill $server' EXIT
sleep 1
# Una escena por proceso: SwiftShader se queda sin memoria con varias seguidas.
for k in ${kinds//,/ }; do node art/shoot.mjs art/out/raw "$k" 1152x864; done
# Recortadas al objeto y centradas en 560 × 420 (se ven a 280 × 210), en WebP con transparencia.
for k in ${kinds//,/ }; do
  magick "art/out/raw-$k.png" -trim +repage -resize 520x380 -background none -gravity center -extent 560x420 \
    -quality 88 -define webp:alpha-quality=100 -define webp:method=6 "src/login/assets/states/$k.webp"
done
