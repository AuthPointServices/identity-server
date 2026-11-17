// Falla si una página pinta un texto que no está en nuestro español (src/login/i18n.ts). Los de Keycloak llegan en un
// archivo aparte tras la primera pintura: sin la clave aquí, el texto sale un instante en inglés y luego cambia.
// ponytail: busca msg('clave') literales; una clave armada en tiempo de ejecución (`loginTotp.${tipo}`) va a mano.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const files = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? files(join(dir, e.name)) : /\.tsx?$/.test(e.name) ? [join(dir, e.name)] : []));
const used = new Set();
for (const f of files('src/login')) for (const m of readFileSync(f, 'utf8').matchAll(/\b(?:msg|msgStr|advancedMsg|advancedMsgStr)\(\s*(['"])([^'"]+)\1/g)) used.add(m[2]);
const i18n = readFileSync('src/login/i18n.ts', 'utf8');
const es = i18n.slice(i18n.indexOf('    es: {'), i18n.indexOf('    en: {'));
const defined = new Set([...es.matchAll(/^\s*"?([\w.-]+)"?\s*:/gm)].map((m) => m[1]));
const missing = [...used].filter((k) => !defined.has(k)).sort();
if (missing.length) {
  console.error(`Faltan en el español de src/login/i18n.ts: ${missing.join(', ')}`);
  process.exit(1);
}
