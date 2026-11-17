// Lee nuestro código QR (src/login/qr.ts) como lo haría una cámara: a tamaño de pantalla y en condiciones peores
// (lejos, desenfocado, en ángulo, con poco contraste, comprimido), con zbarimg y con OpenCV, y comprueba que sale
// exactamente el enlace otpauth://. Hace falta rsvg-convert, ImageMagick y al menos un lector (zbarimg o python3 con
// cv2). Con ZXING_PYTHON (un python con zxing-cpp, el lector de casi todas las apps de Android) también lo lee ZXing.
// Deciden zbarimg y ZXing; OpenCV sólo informa: su lector no admite ojos con formas y falla incluso con QR lisos
// pequeños. No va en `pnpm check`: el CI no tiene esos programas. Uso: node scripts/qr-check.mjs
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { qrSvg } from '../src/login/qr.ts';
import { keyUri } from '../src/login/totp.ts';

const has = (cmd, args) => { try { execFileSync(cmd, args, { stdio: 'ignore' }); return true; } catch { return false; } };
const readers = [];
const run = (cmd, args) => { try { return execFileSync(cmd, args, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { return ''; } };
if (has('zbarimg', ['--version'])) readers.push(['zbarimg', true, (f) => run('zbarimg', ['-q', '--raw', f])]);
const zx = process.env.ZXING_PYTHON;
if (zx && has(zx, ['-c', 'import zxingcpp'])) {
  const py = 'import sys,zxingcpp\nfrom PIL import Image\nr=zxingcpp.read_barcodes(Image.open(sys.argv[1]).convert("RGB"),formats=zxingcpp.BarcodeFormat.QRCode)\nprint(r[0].text if r else "")';
  readers.push(['zxing', true, (f) => run(zx, ['-c', py, f])]);
}
if (has('python3', ['-c', 'import cv2'])) {
  const py = 'import cv2,sys\nt,_,_=cv2.QRCodeDetector().detectAndDecode(cv2.imread(sys.argv[1]))\nprint(t or "")';
  readers.push(['opencv', false, (f) => run('python3', ['-c', py, f])]);
}
if (!readers.some(([, gate]) => gate)) throw new Error('No hay lector de QR: instala zbar (zbarimg) o pon ZXING_PYTHON.');

const secret = 'NRVH ONDS ORIE C2JV KRKT QRDS JI3G S4CS';
const uris = [
  keyUri({ issuer: 'Seedle', account: 'ana@example.test', secret, algorithm: 'SHA1', digits: 6, type: 'totp', period: 30 }),
  keyUri({ issuer: 'Seedle', account: 'maria-fernanda.gutierrez-echeverri@empresa-de-ejemplo.example.test', secret, algorithm: 'SHA1', digits: 6, type: 'totp', period: 30 }),
];
// Cómo lo vería la cámara: el SVG a 2x (164 px en pantalla) y degradado con ImageMagick.
const variants = {
  pantalla: [],
  lejos: ['-resize', '40%'],
  desenfocado: ['-blur', '0x1.6'],
  angulo: ['-virtual-pixel', 'white', '-distort', 'Perspective', '0,0 30,18 328,0 300,6 0,328 12,320 328,328 318,300'],
  'poco-contraste': ['-level', '0%,100%,1', '+level', '22%,88%'],
  jpeg: ['-quality', '35'],
};
const dir = mkdtempSync(join(tmpdir(), 'qr-'));
let fail = 0;
for (const [i, uri] of uris.entries()) {
  const svg = join(dir, `${i}.svg`), png = join(dir, `${i}.png`);
  writeFileSync(svg, qrSvg(uri, 328));
  execFileSync('rsvg-convert', ['-o', png, svg]);
  for (const [name, args] of Object.entries(variants)) {
    const out = join(dir, `${i}-${name}.${name === 'jpeg' ? 'jpg' : 'png'}`);
    execFileSync('magick', [png, '-background', 'white', '-flatten', ...args, out]);
    for (const [reader, gate, read] of readers) {
      const got = read(out);
      const ok = got === uri;
      if (!ok && gate) fail++;
      console.log(`${ok ? 'ok   ' : gate ? 'FALLA' : 'no   '} ${reader.padEnd(7)} ${String(i)} ${name.padEnd(15)} ${ok ? '' : `leyó «${got.slice(0, 60)}»`}`);
    }
  }
}
console.log(dir);
process.exit(fail ? 1 : 0);
