// Renderiza cada escena en Chromium (WebGL por SwiftShader) y guarda el PNG con transparencia.
// node shoot.mjs <salida> <escena,...> [size] [query extra]
// Necesita playwright-core (PLAYWRIGHT, la ruta a su index.mjs) y un Chromium (CHROME).
const { chromium } = await import(process.env.PLAYWRIGHT ?? 'playwright-core');
import { writeFileSync } from 'node:fs';
const [out = 'art/out/raw', list = 'email-ok', size = '1152x864', extra = ''] = process.argv.slice(2);
const [w, h] = size.split('x').map(Number);
const b = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
for (const kind of list.split(',')) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  await p.goto(`http://127.0.0.1:6197/art/render.html?kind=${kind}&w=${w}&h=${h}${extra}`);
  await p.waitForFunction(() => window.__done || false, null, { timeout: 120000 }).catch(() => {});
  const data = await p.evaluate(() => document.querySelector('canvas')?.toDataURL('image/png'));
  if (data) writeFileSync(`${out}-${kind}.png`, Buffer.from(data.split(',')[1], 'base64'));
  console.log(kind, data ? 'ok' : 'sin lienzo', errs.join(' | ').slice(0, 300));
  await p.close();
}
await b.close();
