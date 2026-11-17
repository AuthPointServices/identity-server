// Las ilustraciones de estado de Seedle, renderizadas: porcelana mate, acero y una pieza de «brasa» con el fuego del
// panel de la marca como textura emisiva. ?kind=<escena>&size=<px>&t=<segundo del fuego>
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { FIRE } from './fire.js';

const q = new URLSearchParams(location.search);
const KIND = q.get('kind') ?? 'email-ok';
const W = Number(q.get('w') ?? 864), H = Number(q.get('h') ?? 648);
const T = Number(q.get('t') ?? 12);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H);
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = q.get('tm') === 'agx' ? THREE.AgXToneMapping : THREE.NeutralToneMapping;
renderer.toneMappingExposure = Number(q.get('exposure') ?? 1.15);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.85;

// ── La brasa: el shader del panel dibujado en su propio lienzo WebGL, igual que en el panel (sin conversión de color),
// y usado como textura sRGB.
function fireTexture(size = 1024, t = T) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const gl = c.getContext('webgl', { preserveDrawingBuffer: true, alpha: false });
  const sh = (type, src) => { const o = gl.createShader(type); gl.shaderSource(o, src); gl.compileShader(o); return o; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, 'attribute vec2 a_position; void main(){ gl_Position = vec4(a_position, 0.0, 1.0); }'));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FIRE)); gl.linkProgram(prog); gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'a_position'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  gl.uniform2f(gl.getUniformLocation(prog, 'u_resolution'), size, size);
  gl.uniform1f(gl.getUniformLocation(prog, 'u_time'), t);
  gl.uniform2f(gl.getUniformLocation(prog, 'u_mouse'), -1, -1);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  return tex;
}
const FIRE_TEX = fireTexture();
if (q.get('debug') === 'fire') {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshBasicMaterial({ map: FIRE_TEX }));
  const s = new THREE.Scene(); s.add(m); renderer.toneMapping = THREE.NoToneMapping;
  renderer.render(s, new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)); window.__done = true; throw new Error('debug');
}

// ── Materiales.
const porcelain = (color = 0xf1ede6) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.55, clearcoat: 0.7, clearcoatRoughness: 0.22, sheen: 0.2, sheenRoughness: 0.7, sheenColor: 0xffffff });
const paper = () => new THREE.MeshPhysicalMaterial({ color: 0xf4f0ea, roughness: 0.72, sheen: 0.4, sheenRoughness: 0.8, sheenColor: 0xffffff });
const steel = () => new THREE.MeshPhysicalMaterial({ color: 0xc9ccd3, metalness: 1, roughness: 0.3, clearcoat: 0.3, clearcoatRoughness: 0.2 });
// La brasa: cera o vidrio rojo oscuro con el fuego encendido dentro (emissiveMap). `heat` lo aviva o lo apaga.
function ember(heat = 1, repeat = 1, offset = [0, 0]) {
  const tex = FIRE_TEX.clone(); tex.needsUpdate = true;
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.repeat.set(repeat, repeat); tex.offset.set(offset[0], offset[1]);
  // Obsidiana: casi negra y pulida, con el fuego del panel encendido dentro.
  return new THREE.MeshPhysicalMaterial({ color: 0x0d0605, roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.05, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 1.7 * heat, envMapIntensity: 1.1 });
}

// ── Utilidades de forma.
const TAU = Math.PI * 2;
function wobblyCircle(r, n = 160, amp = 0.035, lobes = [7, 11, 3], seed = 1.7) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const k = 1 + amp * (Math.sin(a * lobes[0] + seed) * 0.6 + Math.sin(a * lobes[1] + seed * 2.3) * 0.3 + Math.sin(a * lobes[2] + seed * 0.7) * 0.5);
    pts.push(new THREE.Vector2(Math.cos(a) * r * k, Math.sin(a) * r * k));
  }
  return pts;
}
function extrude(shape, depth, bevel, segs = 8, curveSegments = 96) {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel, bevelSegments: segs, curveSegments });
  g.computeVertexNormals();
  return g;
}
// UV planos en [0,1] según la caja de la forma, para que el fuego quede centrado en la pieza.
function planarUV(geo, scale = 1, axes = 'xy') {
  geo.computeBoundingBox();
  const b = geo.boundingBox, pos = geo.attributes.position, uv = geo.attributes.uv;
  const [A, B] = axes.split('');
  const ca = (b.min[A] + b.max[A]) / 2, cb = (b.min[B] + b.max[B]) / 2, s = Math.max(b.max[A] - b.min[A], b.max[B] - b.min[B]) * scale;
  const get = { x: (i) => pos.getX(i), y: (i) => pos.getY(i), z: (i) => pos.getZ(i) };
  for (let i = 0; i < pos.count; i++) uv.setXY(i, (get[A](i) - ca) / s + 0.5, (get[B](i) - cb) / s + 0.5);
  uv.needsUpdate = true;
  return geo;
}
function mesh(geo, mat) { const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true; return m; }
// Un trazo grueso con extremos redondos (para marcas en relieve: la paloma del sello).
function strokeShape(points, w) {
  const shape = new THREE.Shape();
  const left = [], right = [];
  for (let i = 0; i < points.length; i++) {
    const p = points[i], prev = points[Math.max(0, i - 1)], next = points[Math.min(points.length - 1, i + 1)];
    const d = next.clone().sub(prev).normalize(); const nrm = new THREE.Vector2(-d.y, d.x).multiplyScalar(w / 2);
    left.push(p.clone().add(nrm)); right.push(p.clone().sub(nrm));
  }
  shape.moveTo(left[0].x, left[0].y);
  left.slice(1).forEach((p) => shape.lineTo(p.x, p.y));
  const end = points.at(-1), dEnd = end.clone().sub(points.at(-2)).normalize(), aEnd = Math.atan2(dEnd.y, dEnd.x);
  shape.absarc(end.x, end.y, w / 2, aEnd + Math.PI / 2, aEnd - Math.PI / 2, true);
  right.reverse().slice(1).forEach((p) => shape.lineTo(p.x, p.y));
  const start = points[0], dSt = points[1].clone().sub(start).normalize(), aSt = Math.atan2(dSt.y, dSt.x);
  shape.absarc(start.x, start.y, w / 2, aSt - Math.PI / 2, aSt + Math.PI / 2, true);
  return shape;
}
function polyline(pts, steps = 12) {
  // La paloma con la esquina redondeada: muestrea un spline por los vértices.
  const curve = new THREE.SplineCurve(pts);
  return curve.getPoints(steps * pts.length);
}

// ── Piezas.
function seal({ mark = 'check', heat = 1, cracked = false } = {}) {
  const g = new THREE.Group();
  const outline = wobblyCircle(1, 180, 0.045);
  if (!cracked) {
    const body = extrude(new THREE.Shape(outline), 0.14, 0.09, 10);
    g.add(mesh(planarUV(body, 1.1), ember(heat)));
  } else {
    // Partido en dos por una línea quebrada; las mitades se separan y giran un poco.
    const zig = [[0.08, 1.2], [-0.06, 0.62], [0.12, 0.18], [-0.1, -0.3], [0.07, -0.72], [-0.04, -1.2]].map(([x, y]) => new THREE.Vector2(x, y));
    const side = (sign) => {
      const pts = outline.filter((p) => Math.sign(p.x - 0.0001) === sign || (sign < 0 && p.x <= 0));
      const arc = outline.map((p, i) => ({ p, a: Math.atan2(p.y, p.x) })).filter(({ a }) => (sign > 0 ? Math.abs(a) < Math.PI / 2 + 0.02 : Math.abs(a) > Math.PI / 2 - 0.02));
      arc.sort((A, B) => (sign > 0 ? B.a - A.a : ((A.a + TAU) % TAU) - ((B.a + TAU) % TAU)));
      const shape = new THREE.Shape([...arc.map(({ p }) => p), ...(sign > 0 ? [...zig].reverse() : zig)]);
      return shape;
    };
    for (const sign of [-1, 1]) {
      const geo = planarUV(extrude(side(sign), 0.14, 0.08, 8), 1.1);
      const m = mesh(geo, ember(heat * 0.9));
      m.position.x = sign * 0.11; m.rotation.z = sign * -0.07; m.position.y = sign * 0.02;
      g.add(m);
    }
    return g;
  }
  // El aro en relieve y la marca, más arriba: la cera recoge la luz en sus bordes.
  const ring = new THREE.Shape(wobblyCircle(0.74, 160, 0.012, [5, 9, 2], 0.4));
  ring.holes.push(new THREE.Path(wobblyCircle(0.66, 160, 0.012, [5, 9, 2], 0.4).reverse()));
  const ringM = mesh(planarUV(extrude(ring, 0.04, 0.02, 4), 1.5), ember(heat));
  ringM.position.z = 0.2; g.add(ringM);
  if (mark === 'check') {
    const pts = polyline([new THREE.Vector2(-0.34, 0.02), new THREE.Vector2(-0.1, -0.22), new THREE.Vector2(0.36, 0.26)], 10);
    const chk = mesh(planarUV(extrude(strokeShape(pts, 0.15), 0.05, 0.025, 4), 1.6), ember(heat));
    chk.position.z = 0.2; g.add(chk);
  }
  return g;
}

function keyObj() {
  const g = new THREE.Group();
  const bow = new THREE.Shape(); bow.absarc(0, 0, 0.62, 0, TAU, false);
  bow.holes.push(new THREE.Path().absarc(0, 0, 0.24, 0, TAU, true));
  const b = mesh(planarUV(extrude(bow, 0.16, 0.08, 8), 1.0), ember(1));
  b.position.x = -0.95; g.add(b);
  // La caña: una barra redondeada de acero, y los dientes al final.
  const shaft = mesh(new RoundedBoxGeometry(1.75, 0.2, 0.2, 6, 0.09), steel()); shaft.position.set(0.42, 0, 0.12); g.add(shaft);
  const bit = new THREE.Shape();
  bit.moveTo(0, 0); bit.lineTo(0, -0.42); bit.lineTo(0.12, -0.42); bit.lineTo(0.12, -0.28); bit.lineTo(0.24, -0.28); bit.lineTo(0.24, -0.38); bit.lineTo(0.38, -0.38); bit.lineTo(0.38, 0); bit.closePath();
  const bm = mesh(extrude(bit, 0.12, 0.035, 4), steel()); bm.position.set(0.86, -0.04, 0.06); g.add(bm);
  // El cuello entre el ojo y la caña.
  const collar = mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.16, 48), steel()); collar.rotation.z = Math.PI / 2; collar.position.set(-0.36, 0, 0.12); g.add(collar);
  return g;
}

function envelope() {
  const g = new THREE.Group();
  const W = 2.7, H = 1.86;
  const base = mesh(new RoundedBoxGeometry(W, H, 0.16, 6, 0.06), paper());
  g.add(base);
  // La solapa de atrás, en relieve: un triángulo con la punta redondeada que llega al centro.
  const flap = new THREE.Shape();
  flap.moveTo(-W / 2 + 0.03, H / 2 - 0.03); flap.lineTo(W / 2 - 0.03, H / 2 - 0.03);
  flap.lineTo(0.16, -0.06); flap.quadraticCurveTo(0, -0.17, -0.16, -0.06); flap.closePath();
  const fm = mesh(extrude(flap, 0.02, 0.035, 5), paper());
  fm.position.z = 0.06; g.add(fm);
  // Las dos solapas de los lados, un pelo más bajas: el pliegue se lee por su borde.
  for (const s of [-1, 1]) {
    const side = new THREE.Shape();
    side.moveTo(s * (W / 2 - 0.03), -H / 2 + 0.03); side.lineTo(s * (W / 2 - 0.03), H / 2 - 0.12); side.lineTo(s * 0.3, -0.24); side.lineTo(s * 0.12, -H / 2 + 0.03); side.closePath();
    const sm = mesh(extrude(side, 0.01, 0.02, 4), paper()); sm.position.z = 0.06; g.add(sm);
  }
  const s = seal(); s.scale.setScalar(0.56); s.position.set(0, -0.08, 0.1); g.add(s);
  return g;
}

function padlock({ open = true, heat = 1 } = {}) {
  const g = new THREE.Group();
  const body = mesh(new RoundedBoxGeometry(1.5, 1.22, 0.62, 8, 0.2), porcelain());
  g.add(body);
  // El arco de acero: media rosca y dos patas. Abierto, sube y gira sobre la pata izquierda.
  const sh = new THREE.Group();
  const R = 0.46, tube = 0.115;
  const arc = mesh(new THREE.TorusGeometry(R, tube, 32, 96, Math.PI), steel());
  arc.position.y = 0.62; sh.add(arc);
  for (const x of [-R, R]) { const long = open && x < 0; const len = long ? 1.2 : 0.62; const leg = mesh(new THREE.CylinderGeometry(tube, tube, len, 32), steel()); leg.position.set(x, 0.62 - len / 2, 0); sh.add(leg); }
  sh.position.y = open ? 0.82 : 0.32;
  if (open) { const pivot = new THREE.Group(); pivot.position.set(-R, 0, 0); sh.position.x = R; pivot.add(sh); pivot.rotation.y = 0.8; g.add(pivot); }
  else g.add(sh);
  // El ojo de la cerradura, de brasa: un círculo y su cola, en una pastilla rebajada.
  const hole = new THREE.Shape();
  hole.absarc(0, 0.08, 0.15, Math.PI * 1.25, Math.PI * 1.75 + TAU - TAU, true);
  const keyhole = new THREE.Shape();
  keyhole.moveTo(-0.06, -0.02); keyhole.absarc(0, 0.1, 0.14, Math.PI * 1.32, Math.PI * 1.68 - TAU, true); keyhole.lineTo(0.06, -0.02); keyhole.lineTo(0.085, -0.3); keyhole.quadraticCurveTo(0, -0.33, -0.085, -0.3); keyhole.closePath();
  const kh = mesh(planarUV(extrude(keyhole, 0.03, 0.025, 4), 1.4), ember(heat, 0.55, [0.22, 0.22]));
  kh.position.set(0, -0.06, 0.29); g.add(kh);
  return g;
}

function hourglass() {
  const g = new THREE.Group();
  const H = 1.9;
  // Vidrio ahumado: se lee sobre blanco y sobre oscuro (la transmisión pura desaparece sobre el blanco de la página).
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xc9d3e2, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.04, transparent: true, opacity: 0.42, depthWrite: false, side: THREE.DoubleSide, envMapIntensity: 1.8 });
  // El perfil de las dos ampollas, de la base al cuello y al tope.
  const prof = [];
  for (let i = 0; i <= 64; i++) {
    const t = i / 64, y = -H / 2 + 0.12 + t * (H - 0.24);
    const u = Math.abs(t - 0.5) * 2; // 0 en el cuello, 1 en los extremos
    const r = 0.07 + 0.5 * Math.pow(Math.sin((u * Math.PI) / 2), 0.9) * (u > 0.92 ? 1 - (u - 0.92) * 4 : 1);
    prof.push(new THREE.Vector2(Math.max(0.05, r), y));
  }
  const bulb = new THREE.Mesh(new THREE.LatheGeometry(prof, 96), glass); bulb.castShadow = false; g.add(bulb);
  // La arena: toda abajo (el tiempo se acabó), de brasa.
  const sand = [];
  for (let i = 0; i <= 32; i++) { const t = i / 32; sand.push(new THREE.Vector2(0.001 + (1 - t) * 0.5, -H / 2 + 0.14 + Math.pow(t, 0.8) * 0.36)); }
  sand.unshift(new THREE.Vector2(0, -H / 2 + 0.14));
  const sandMat = ember(2.4); sandMat.color.set(0x3a1206); sandMat.roughness = 0.55; sandMat.clearcoat = 0.2;
  g.add(mesh(planarUV(new THREE.LatheGeometry(sand, 96), 0.7, 'xz'), sandMat));
  // Un hilo de arena que aún cae por el cuello.
  const fall = mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.62, 12), new THREE.MeshBasicMaterial({ color: 0xffa040 })); fall.position.y = -0.2; g.add(fall);
  // Las tapas de porcelana y las tres varillas de acero.
  for (const y of [-H / 2, H / 2]) { const cap = mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.13, 96), porcelain()); cap.position.y = y; g.add(cap);
    const lip = mesh(new THREE.TorusGeometry(0.7, 0.028, 16, 96), porcelain()); lip.rotation.x = Math.PI / 2; lip.position.y = y + (y > 0 ? -0.08 : 0.08); g.add(lip); }
  for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU + 0.5; const rod = mesh(new THREE.CylinderGeometry(0.035, 0.035, H - 0.1, 24), steel()); rod.position.set(Math.cos(a) * 0.62, 0, Math.sin(a) * 0.62); g.add(rod); }
  return g;
}

function cookie() {
  const g = new THREE.Group();
  // Galleta mordida: el contorno ondulado menos dos mordiscos, con borde muy redondeado.
  const bites = [[new THREE.Vector2(0.98, 0.42), 0.36], [new THREE.Vector2(0.62, 0.9), 0.3]];
  const out = wobblyCircle(1, 260, 0.03, [9, 13, 4], 2.2).map((p) => {
    const dir = p.clone().normalize(); let r = p.length();
    for (const [c, br] of bites) {
      // La entrada del rayo en el círculo del mordisco: t² - 2 t (d·c) + |c|² - br² = 0.
      const b = dir.dot(c), disc = b * b - (c.lengthSq() - br * br);
      if (disc > 0) { const t0 = b - Math.sqrt(disc); if (t0 > 0 && t0 < r) r = t0 + 0.0; }
    }
    return dir.multiplyScalar(r);
  });
  const shape = new THREE.Shape(out);
  const geo = extrude(shape, 0.12, 0.13, 10);
  const pos = geo.attributes.position;
  // Superficie horneada: un relieve suave de ruido sobre la cara de arriba.
  for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i); if (z > 0.1) pos.setZ(i, z + 0.025 * (Math.sin(x * 9.1 + y * 3.3) + Math.sin(y * 11.7 - x * 4.1)) * 0.5); }
  geo.computeVertexNormals();
  planarUV(geo, 1.0);
  const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d');
  const gr = x.createRadialGradient(256, 256, 40, 256, 256, 260); gr.addColorStop(0, '#e2b27a'); gr.addColorStop(0.7, '#d29a5c'); gr.addColorStop(1, '#a8682f');
  x.fillStyle = gr; x.fillRect(0, 0, 512, 512);
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 2600; i++) { const r = rnd() * 2.2 + 0.4; x.fillStyle = rnd() > 0.5 ? 'rgba(120,64,24,0.16)' : 'rgba(255,226,180,0.18)'; x.beginPath(); x.arc(rnd() * 512, rnd() * 512, r, 0, TAU); x.fill(); }
  const ctex = new THREE.CanvasTexture(c); ctex.colorSpace = THREE.SRGBColorSpace;
  const bump = new THREE.CanvasTexture(c);
  g.add(mesh(geo, new THREE.MeshPhysicalMaterial({ map: ctex, bumpMap: bump, bumpScale: 1.4, roughness: 0.86, sheen: 0.45, sheenColor: 0xffd9a8, sheenRoughness: 0.7 })));
  const chip = new THREE.MeshPhysicalMaterial({ color: 0x3a2014, roughness: 0.38, clearcoat: 0.4 });
  const chips = [[-0.42, 0.3, 0.13], [0.05, 0.42, 0.11], [-0.1, -0.12, 0.14], [0.42, -0.08, 0.12], [-0.5, -0.38, 0.1], [0.12, -0.55, 0.12], [0.5, 0.25, 0.09]];
  chips.forEach(([x, y, r], i) => { const c = mesh(mergeVertices(new THREE.IcosahedronGeometry(r, 3)), chip); c.scale.set(1, 0.8 + (i % 3) * 0.12, 0.55); c.position.set(x, y, 0.25); c.rotation.z = i; g.add(c); });
  for (const [x, y, r] of [[1.08, 0.86, 0.06], [1.22, 0.6, 0.04], [0.95, 1.08, 0.035]]) { const c = mesh(new THREE.IcosahedronGeometry(r, 2), new THREE.MeshPhysicalMaterial({ color: 0xd9a066, roughness: 0.85 })); c.position.set(x, y, -0.05); g.add(c); }
  return g;
}

// ── Escenas.
const scenes = {
  'email-ok': () => ({ obj: envelope(), tilt: [-0.62, 0, 0.1], scale: 1.0 }),
  'account-ok': () => ({ obj: keyObj(), tilt: [-1.0, 0, 0.42], scale: 1.0 }),
  'signed-in': () => ({ obj: padlock({ open: true }), tilt: [0.18, -0.42, 0], scale: 0.9, upright: true }),
  'sign-out': () => ({ obj: padlock({ open: true, heat: 0.8 }), tilt: [0.18, -0.42, 0], scale: 0.9, upright: true }),
  'signed-out': () => ({ obj: padlock({ open: false, heat: 0.22 }), tilt: [0.18, -0.42, 0], scale: 0.9, upright: true }),
  expired: () => ({ obj: hourglass(), tilt: [0.12, 0.35, 0], scale: 0.88, upright: true }),
  error: () => ({ obj: seal({ cracked: true }), tilt: [-0.9, 0, 0.1], scale: 1.05 }),
  cookies: () => ({ obj: cookie(), tilt: [-0.95, 0, -0.3], scale: 0.98 }),
};
const { obj, tilt, scale, upright } = scenes[KIND]();

// Los objetos planos (sobre, sello, galleta) se tumban hacia la cámara; los de pie (candado, reloj) se giran.
const holder = new THREE.Group();
obj.rotation.set(...tilt);
holder.add(obj); holder.scale.setScalar(scale);
scene.add(holder);
// Apoyar el objeto en el suelo (y = 0) y centrarlo.
const box = new THREE.Box3().setFromObject(holder);
holder.position.y -= box.min.y; holder.position.x -= (box.min.x + box.max.x) / 2; holder.position.z -= (box.min.z + box.max.z) / 2;
const box2 = new THREE.Box3().setFromObject(holder);

// Suelo invisible que sólo recoge la sombra.
const ground = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.ShadowMaterial({ opacity: 0.14 }));
ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
// Sombra de contacto: un degradado radial pegado al suelo bajo el objeto.
{
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  const gr = x.createRadialGradient(128, 128, 0, 128, 128, 128); gr.addColorStop(0, 'rgba(0,0,0,0.55)'); gr.addColorStop(0.45, 'rgba(0,0,0,0.22)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = gr; x.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  const w = (box2.max.x - box2.min.x) * 0.95, d = Math.max(0.5, (box2.max.z - box2.min.z) * 1.1);
  const blob = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
  blob.rotation.x = -Math.PI / 2; blob.position.y = 0.002; scene.add(blob);
}

// Luz: el estudio (RoomEnvironment) y una clave cálida desde arriba a la izquierda que da la sombra, más un contraluz
// frío que dibuja el borde.
const keyLight = new THREE.DirectionalLight(0xfff4ea, 2.2);
keyLight.position.set(-2.2, 8, 3.2); keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048); keyLight.shadow.radius = 22; keyLight.shadow.blurSamples = 32; keyLight.shadow.bias = -0.0004;
Object.assign(keyLight.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: 0.5, far: 20 }); scene.add(keyLight);
const rim = new THREE.DirectionalLight(0xdfe8ff, 1.2); rim.position.set(4, 3, -4); scene.add(rim);

// Cámara de producto: lente larga, algo de arriba.
const camera = new THREE.PerspectiveCamera(22, W / H, 0.1, 100);
const sphere = box2.getBoundingSphere(new THREE.Sphere());
const target = sphere.center.clone(); target.y *= 0.92;
const elev = upright ? 0.3 : 0.52;
const fill = Number(q.get('fill') ?? (upright ? 0.62 : 0.8));
const dist = sphere.radius / Math.sin(THREE.MathUtils.degToRad(22 / 2)) / fill * 0.62;
camera.position.set(0, target.y + Math.sin(elev) * dist, Math.cos(elev) * dist);
camera.lookAt(target);
renderer.render(scene, camera);
window.__done = true;
