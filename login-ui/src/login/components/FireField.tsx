import { useEffect, useRef } from 'react';

/* El fondo del panel de la marca: un shader de WebGL (espirales de fuego que giran y se apartan del cursor). Ocupa su
   caja, no la ventana, y sólo dibuja mientras se ve; con «reducir movimiento» se queda en un fotograma quieto, y sin
   WebGL queda el fotograma quieto que el panel lleva debajo. */

const VERTEX = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const FRAGMENT = `
#ifdef GL_ES
precision highp float;
#endif
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
vec3 palette_fire(float t, float factor) {
  vec3 a = vec3(0.5, 0.1, 0.0);
  vec3 b = vec3(0.6, 0.3, 0.1);
  vec3 c = vec3(1.0, 1.0, 0.0);
  vec3 d = vec3(0.8, 0.7, 0.2);
  a += 0.1 * sin(vec3(0.1, 0.2, 0.3) * factor);
  b += 0.2 * cos(vec3(0.2, 0.3, 0.1) * factor);
  return a + b * cos(6.28318 * (c * t + d));
}
void main() {
  vec2 st = (gl_FragCoord.xy / u_resolution.xy) * 2.0 - 1.0;
  st.x *= u_resolution.x / u_resolution.y;
  vec3 color = vec3(0.0);
  vec2 mouse_st = vec2(u_mouse.x, u_resolution.y - u_mouse.y) / u_resolution.xy;
  mouse_st = (mouse_st * 2.0 - 1.0) * vec2(1.0, -1.0);
  mouse_st.x *= u_resolution.x / u_resolution.y;
  vec2 mouse_vec = st - mouse_st;
  float mouse_dist = length(mouse_vec);
  float mouse_push = smoothstep(0.7, 0.0, mouse_dist) * 0.5;
  if (u_mouse.x > 0.0) {
    st += normalize(mouse_vec) * mouse_push;
  }
  float R_global = length(st);
  float twist = 0.5 * sin(R_global * 3.0 - u_time * 0.4);
  st *= mat2(cos(twist), sin(twist), -sin(twist), cos(twist));
  for (float i = 1.0; i < 6.0; i++) {
    vec2 st0 = st;
    float sgn = 1.0 - 2.0 * mod(i, 2.0);
    float t = u_time * 0.02 - float(i);
    st0 *= mat2(cos(t), sin(t), -sin(t), cos(t));
    float R = length(st0);
    float d = R * i;
    float angle = atan(st0.y, st0.x);
    float num_arms = 4.0 + 3.0 * sin(u_time * 0.1 + i);
    float angle_warped = angle * num_arms;
    float dist_warp_factor = 1.0 + 0.3 * sin(angle * 12.0 + u_time * 0.5 - i);
    float d_warped = d * dist_warp_factor;
    vec3 pal = palette_fire(-exp((length(d_warped) * -0.9)), abs(d_warped) * 0.4);
    float radial = exp(-R);
    radial *= smoothstep(1.2, 0.5, R);
    pal *= radial;
    float phase = -(d_warped + sgn * angle_warped) + u_time * 0.3;
    float v = sin(phase);
    v = max(abs(v), 0.01);
    float w = pow(0.02 / v, 0.8);
    color += pal * w;
  }
  gl_FragColor = vec4(color, 1.0);
}`;

function shader(gl: WebGLRenderingContext, type: number, source: string) {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, source);
  gl.compileShader(s);
  if (gl.getShaderParameter(s, gl.COMPILE_STATUS)) return s;
  console.error('FireField: no compila el shader', gl.getShaderInfoLog(s));
  gl.deleteShader(s);
  return null;
}

export function FireField({ className = '' }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const gl = canvas?.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
    if (!canvas || !gl) return;
    const vs = shader(gl, gl.VERTEX_SHADER, VERTEX);
    const fs = shader(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram();
    if (!vs || !fs || !program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('FireField: no enlaza el programa', gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const uResolution = gl.getUniformLocation(program, 'u_resolution');
    const uTime = gl.getUniformLocation(program, 'u_time');
    const uMouse = gl.getUniformLocation(program, 'u_mouse');

    let dpr = 1;
    // El cursor, en píxeles del lienzo; fuera del panel (-1) no empuja nada.
    let mouse = [-1, -1];
    const still = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;

    // El tiempo es el del reloj y no el de la página: al pasar de una pantalla a otra, el fuego sigue donde iba en vez de
    // volver a empezar. ponytail: da la vuelta cada hora (un salto entonces) para que quepa en el float del shader.
    const clock = (ms: number) => ((performance.timeOrigin + ms) % 3_600_000) * 0.001;
    const draw = (seconds: number) => {
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform1f(uTime, seconds);
      gl.uniform2f(uMouse, mouse[0]!, mouse[1]!);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    const loop = (ms: number) => {
      draw(clock(ms));
      frame = requestAnimationFrame(loop);
    };
    const start = () => {
      cancelAnimationFrame(frame);
      // Oculto (el panel no sale bajo 1024 px): no se dibuja nada.
      if (canvas.clientWidth === 0) return;
      // Quieto: un solo fotograma, el de los 12 s, cuando las espirales ya tienen forma. En marcha, el primero se dibuja
      // ya: el lienzo es opaco y, hasta su primer fotograma, el panel se vería negro.
      if (still.matches) draw(12);
      else {
        draw(clock(performance.now()));
        frame = requestAnimationFrame(loop);
      }
    };
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      canvas.height = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      start();
    };
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      mouse = inside ? [(e.clientX - r.left) * dpr, (e.clientY - r.top) * dpr] : [-1, -1];
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    window.addEventListener('pointermove', onMove, { passive: true });
    still.addEventListener('change', start);
    resize();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('pointermove', onMove);
      still.removeEventListener('change', start);
      // El contexto no se pierde a mano: en desarrollo React monta dos veces y el segundo montaje lo reutiliza.
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className={`block size-full ${className}`} />;
}
