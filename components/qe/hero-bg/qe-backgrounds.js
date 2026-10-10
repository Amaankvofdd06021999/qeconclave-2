/*!
 * QE Conclave — hero backgrounds (5 styles, no text)
 * ------------------------------------------------------------------
 *   streams  light filaments converging into one focal point; signal packets flow in
 *   columns  quantized vertical light bars lit by a drifting source
 *   rings    concentric glowing sonar arcs expanding from a corner (WebGL)
 *   haze     grainy blurred gradient field with hairline grid and circles (WebGL)
 *   lidar    perspective point-cloud terrain swept by a scan
 *
 * All five: pointer reacts, click/tap fires a pulse, slow ambient motion,
 * pause off-screen / in hidden tabs, still frame for prefers-reduced-motion.
 * Readability: elements marked [data-bg-clear] / [data-bg-dim] are measured
 * per line of text and the background is faded behind them via a CSS mask.
 *
 *   const bg = mountQEBackground(heroEl, { variant: 'rings' });
 *   bg.setVariant('lidar'); bg.pause(); bg.play(); bg.refresh(); bg.destroy();
 */
export const QE_BACKGROUNDS = ['streams', 'columns', 'rings', 'haze', 'lidar'];

const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const mix = (a, b, t) => a + (b - a) * t;
const smooth = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
const INTERACTIVE = 'a,button,input,select,textarea,label,summary,[role="button"],[data-bg-ignore]';

function makeCanvas(layer, z = 0) {
  const c = document.createElement('canvas');
  c.style.cssText = `position:absolute;inset:0;width:100%;height:100%;display:block;z-index:${z}`;
  layer.appendChild(c);
  return c;
}
function sizeCanvas(c, w, h, scale) { c.width = Math.max(1, Math.round(w * scale)); c.height = Math.max(1, Math.round(h * scale)); }
function grainTile(size = 160, amount = 26) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const x = c.getContext('2d'), img = x.createImageData(size, size);
  for (let i = 0; i < size * size; i++) {
    const v = Math.random() < 0.5 ? 255 : 0;
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = Math.random() * amount;
  }
  x.putImageData(img, 0, 0);
  return c;
}

/* ---------------- WebGL full-screen shader helper ---------------- */
function glLayer(canvas, frag) {
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: false });
  if (!gl) return null;
  const sh = (type, src) => {
    const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  };
  const p = gl.createProgram();
  gl.attachShader(p, sh(gl.VERTEX_SHADER, 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}'));
  gl.attachShader(p, sh(gl.FRAGMENT_SHADER, frag));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  gl.useProgram(p);
  const b = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, b);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(p, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = {};
  const u = (n) => (n in U ? U[n] : (U[n] = gl.getUniformLocation(p, n)));
  return {
    gl,
    set(n, ...v) { const l = u(n); if (l) gl['uniform' + v.length + 'f'](l, ...v); },
    draw() { gl.viewport(0, 0, canvas.width, canvas.height); gl.drawArrays(gl.TRIANGLES, 0, 3); },
    destroy() { const ext = gl.getExtension('WEBGL_lose_context'); if (ext) ext.loseContext(); },
  };
}
const GLSL_HEAD = `precision highp float;
uniform vec2 uRes; uniform float uT; uniform vec2 uP; uniform float uA;
uniform vec4 uK0; uniform vec4 uK1; uniform vec4 uK2;
float hash(vec2 p){ p = fract(p*vec2(443.897,441.423)); p += dot(p, p.yx+19.19); return fract((p.x+p.y)*p.x); }
float pulse(vec4 k, vec2 uv){ if(k.w<=0.) return 0.; float d=length(uv-k.xy); float R=k.z*0.75; float life=1.-k.z/2.2; return max(0.,life)*exp(-pow((d-R)*26.,2.)); }
`;

/* ================= 1. STREAMS ================= */
function Streams(layer) {
  const bgC = makeCanvas(layer, 0), cv = makeCanvas(layer, 1);
  const bx = bgC.getContext('2d'), ctx = cv.getContext('2d');
  let W = 0, H = 0, dpr = 1, mobile = false, F = [0, 0], N = 34, gGlow, gMid, gCore;
  const packets = [];
  let nextPacket = 0.6;

  function strand(i, t, P) {
    const s = i / (N - 1);
    const Ey = mix(H * 0.12, H * 1.18, s) + Math.sin(t * 0.22 + i * 0.37) * H * 0.025;
    const c1x = F[0] + W * 0.3, c1y = F[1] + (Ey - F[1]) * 0.06;
    let c2x = W * 0.6, c2y = Ey + Math.sin(t * 0.27 + s * 5.2) * H * 0.07;
    const near = Math.exp(-(((Ey - P.sy) / (H * 0.22)) ** 2));
    c2y += (P.sy - c2y) * 0.22 * P.a * near;
    c2x += (P.sx - c2x) * 0.08 * P.a * near;
    return [F[0], F[1], c1x, c1y, c2x, c2y, W * 1.04, Ey];
  }
  const bez = (a, b, c, d, u) => { const v = 1 - u; return v * v * v * a + 3 * v * v * u * b + 3 * v * u * u * c + u * u * u * d; };

  return {
    resize(w, h, d, m) {
      W = w; H = h; dpr = d; mobile = m;
      sizeCanvas(bgC, w, h, d); sizeCanvas(cv, w, h, d);
      N = m ? 24 : 34;
      F = m ? [-w * 0.08, h * 0.72] : [w * 0.04, h * 0.64];
      // static: dot grid + guide lines
      bx.setTransform(d, 0, 0, d, 0, 0); bx.clearRect(0, 0, w, h);
      bx.fillStyle = 'rgba(120,140,210,0.13)';
      const g = m ? 18 : 22;
      for (let y = g / 2; y < h; y += g) for (let x = g / 2; x < w; x += g) bx.fillRect(x - 0.6, y - 0.6, 1.2, 1.2);
      bx.strokeStyle = 'rgba(150,175,255,0.14)'; bx.lineWidth = 1 / d + 0.2;
      bx.beginPath();
      for (const k of [-0.62, -0.28, 0.4, 0.75]) { bx.moveTo(F[0], F[1]); bx.lineTo(w, F[1] + k * h); }
      bx.stroke();
      const mk = (stops) => { const gr = ctx.createLinearGradient(F[0], 0, w, 0); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; };
      gGlow = mk([[0, 'rgba(120,200,255,0.10)'], [0.35, 'rgba(40,100,255,0.06)'], [1, 'rgba(20,50,200,0.03)']]);
      gMid = mk([[0, 'rgba(170,225,255,0.30)'], [0.3, 'rgba(50,120,255,0.16)'], [1, 'rgba(25,70,230,0.08)']]);
      gCore = mk([[0, 'rgba(240,250,255,0.95)'], [0.18, 'rgba(120,200,255,0.75)'], [0.5, 'rgba(60,130,255,0.45)'], [1, 'rgba(40,90,240,0.2)']]);
    },
    frame(t, dt, P) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      // body of light
      let g = ctx.createRadialGradient(W * 0.78, H * 0.68, 0, W * 0.78, H * 0.68, Math.max(W, H) * 0.62);
      g.addColorStop(0, 'rgba(30,80,255,0.22)'); g.addColorStop(0.5, 'rgba(20,50,200,0.08)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      const S = [];
      for (let i = 0; i < N; i++) S.push(strand(i, t, P));
      for (const [pass, lw, st] of [[0, mobile ? 16 : 24, gGlow], [1, mobile ? 4 : 6, gMid], [2, 1.1, gCore]]) {
        ctx.strokeStyle = st; ctx.lineWidth = lw;
        for (let i = 0; i < N; i++) {
          if (pass === 2 && i % 2) continue;
          const s = S[i];
          ctx.beginPath(); ctx.moveTo(s[0], s[1]); ctx.bezierCurveTo(s[2], s[3], s[4], s[5], s[6], s[7]); ctx.stroke();
        }
      }
      // focal flare
      const pf = 1 + 0.15 * Math.sin(t * 1.3);
      g = ctx.createRadialGradient(F[0], F[1], 0, F[0], F[1], H * 0.22 * pf);
      g.addColorStop(0, 'rgba(235,248,255,0.9)'); g.addColorStop(0.12, 'rgba(140,215,255,0.45)'); g.addColorStop(1, 'rgba(30,90,255,0)');
      ctx.fillStyle = g; ctx.fillRect(F[0] - H * 0.3, F[1] - H * 0.3, H * 0.6, H * 0.6);
      // signal packets travelling into the focal point
      nextPacket -= dt;
      if (nextPacket <= 0) { nextPacket = 0.5 + Math.random() * 0.9; packets.push({ i: (Math.random() * N) | 0, u: 1, v: 0.18 + Math.random() * 0.12 }); }
      for (const p of P.taps) {
        let best = 0, bd = 1e9;
        for (let i = 0; i < N; i++) { const d = Math.abs(S[i][7] - p.y); if (d < bd) { bd = d; best = i; } }
        for (let k = -2; k <= 2; k++) packets.push({ i: clamp(best + k, 0, N - 1), u: 1, v: 0.3 + Math.abs(k) * 0.03 });
      }
      for (let j = packets.length - 1; j >= 0; j--) {
        const p = packets[j];
        p.u -= p.v * dt;
        if (p.u <= 0.02) { packets.splice(j, 1); continue; }
        const s = S[p.i], x = bez(s[0], s[2], s[4], s[6], p.u), y = bez(s[1], s[3], s[5], s[7], p.u);
        g = ctx.createRadialGradient(x, y, 0, x, y, 14);
        g.addColorStop(0, 'rgba(230,245,255,0.9)'); g.addColorStop(0.3, 'rgba(120,190,255,0.35)'); g.addColorStop(1, 'rgba(40,100,255,0)');
        ctx.fillStyle = g; ctx.fillRect(x - 14, y - 14, 28, 28);
      }
      ctx.globalCompositeOperation = 'source-over';
    },
    destroy() { bgC.remove(); cv.remove(); },
  };
}

/* ================= 2. COLUMNS ================= */
function Columns(layer) {
  const cv = makeCanvas(layer, 0), ctx = cv.getContext('2d');
  let W = 0, H = 0, dpr = 1, N = 28, grain = null, gp = null, Lx = 0, lift = [];
  const beams = [];
  return {
    resize(w, h, d, m) {
      W = w; H = h; dpr = d; N = m ? 12 : 28; // narrower bars: twice as many columns
      sizeCanvas(cv, w, h, d);
      grain = grain || grainTile(); gp = ctx.createPattern(grain, 'repeat');
      Lx = W * 0.62; lift = new Array(N).fill(0);
    },
    frame(t, dt, P) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#02040d'; ctx.fillRect(0, 0, W, H);
      const tx = mix(W * (0.6 + 0.16 * Math.sin(t * 0.06)), P.sx, P.a * 0.75);
      Lx += (tx - Lx) * (1 - Math.exp(-dt * 1.5));
      const Ly = H * (0.8 + 0.04 * Math.sin(t * 0.09));
      const cw = W / N;
      for (const p of P.taps) beams.push({ k: clamp((p.x / cw) | 0, 0, N - 1), t0: t });
      for (let k = 0; k < N; k++) {
        const cx = (k + 0.5) * cw, d = (cx - Lx) / W;
        const hover = P.a * Math.exp(-(((cx - P.sx) / (cw * 0.9)) ** 2));
        lift[k] += (hover - lift[k]) * (1 - Math.exp(-dt * 5));
        let I = Math.exp(-d * d * 16) * (0.82 + 0.18 * Math.sin(t * 0.45 + k * 1.7)) + 0.04 + lift[k] * 0.25;
        I = Math.min(1.15, I);
        const step = 0.05 * Math.sin(k * 2.3) - 0.1 * (1 - Math.min(1, I)); // each bar sits on its own level
        const yl = Ly + step * H, top = yl - H * (0.55 + 0.1 * I);
        const g = ctx.createLinearGradient(0, 0, 0, H);
        const c = (r0, g0, b0, r1, g1, b1, q) => `rgb(${mix(r0, r1, q) | 0},${mix(g0, g1, q) | 0},${mix(b0, b1, q) | 0})`;
        g.addColorStop(0, '#01030b');
        g.addColorStop(clamp(top / H, 0.01, 0.9), c(2, 5, 20, 5, 18, 80, I));
        g.addColorStop(clamp(yl / H, 0.05, 0.98), c(4, 12, 48, 70, 145, 255, I));
        g.addColorStop(1, c(3, 10, 40, 40, 110, 240, I));
        ctx.fillStyle = g;
        ctx.fillRect(Math.floor(k * cw), 0, Math.ceil(cw) + 1, H);
      }
      // soft bloom of the source across the bars
      ctx.globalCompositeOperation = 'screen';
      const bl = ctx.createRadialGradient(Lx, Ly, 0, Lx, Ly, H * 0.5);
      bl.addColorStop(0, 'rgba(90,160,255,0.3)'); bl.addColorStop(0.5, 'rgba(40,100,255,0.08)'); bl.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = bl; ctx.fillRect(0, 0, W, H);
      // light rising up a tapped bar
      for (let j = beams.length - 1; j >= 0; j--) {
        const b = beams[j], a = t - b.t0;
        if (a > 1.8) { beams.splice(j, 1); continue; }
        const y = H * (1 - a / 1.4), life = 1 - a / 1.8;
        const g = ctx.createLinearGradient(0, y - H * 0.25, 0, y + H * 0.05);
        g.addColorStop(0, 'rgba(120,190,255,0)'); g.addColorStop(0.8, `rgba(170,215,255,${0.5 * life})`); g.addColorStop(1, 'rgba(120,190,255,0)');
        ctx.fillStyle = g; ctx.fillRect(b.k * cw, y - H * 0.25, cw, H * 0.3);
      }
      // bar seams + grain
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(0,0,10,0.28)';
      for (let k = 1; k < N; k++) ctx.fillRect(Math.round(k * cw), 0, 1, H);
      ctx.fillStyle = gp; ctx.globalAlpha = 0.55; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
    },
    destroy() { cv.remove(); },
  };
}

/* ================= 3. RINGS (WebGL) ================= */
const RINGS_FS = GLSL_HEAD + `
void main(){
  vec2 fc = gl_FragCoord.xy; float asp = uRes.x/uRes.y;
  vec2 uv = fc/uRes.y;
  vec2 O = vec2(asp + 0.16, -0.34);
  float r = length(uv - O);
  float sp = 0.15;
  float ph = (r - uT*0.02)/sp; float f = fract(ph); float k = floor(ph);
  float rim = exp(-pow((1.-f)*sp*150., 2.));
  float halo = exp(-pow((1.-f)*sp*26., 2.));
  float body = pow(f, 2.4);
  vec2 dir = normalize(uv - O);
  float ang = 0.55 + 0.45*dot(dir, normalize(vec2(-1., 0.7)));
  float pr = length(uv - uP);
  float near = uA*exp(-pr*pr*14.);
  float band = (0.38*body + 0.55*halo + 0.75*rim) * (0.78 + 0.22*sin(k*1.7)) * ang * (1. + near*1.3);
  band += (pulse(uK0, uv) + pulse(uK1, uv) + pulse(uK2, uv)) * 0.9;
  float fall = exp(-max(r - 0.25, 0.)*1.05);
  float x = clamp((r - 0.2)/1.9, 0., 1.);
  vec3 c0 = vec3(1.0, 0.92, 0.97), c1 = vec3(0.55, 0.78, 1.0), c2 = vec3(0.12, 0.40, 1.0), c3 = vec3(0.03, 0.10, 0.42), c4 = vec3(0.01, 0.02, 0.07);
  vec3 col = x < 0.15 ? mix(c0, c1, x/0.15) : x < 0.38 ? mix(c1, c2, (x-0.15)/0.23) : x < 0.7 ? mix(c2, c3, (x-0.38)/0.32) : mix(c3, c4, (x-0.7)/0.3);
  vec3 o = vec3(0.008, 0.012, 0.035) + col * band * fall * 1.15;
  o += (hash(fc) - 0.5) * 0.018;
  gl_FragColor = vec4(o, 1.);
}`;

/* ================= 4. HAZE (WebGL + hairlines) ================= */
const HAZE_FS = GLSL_HEAD + `
float g(vec2 uv, vec2 c, float r, float asp){ vec2 d=(uv-c)*vec2(asp,1.); return exp(-dot(d,d)/(r*r)); }
void main(){
  vec2 fc = gl_FragCoord.xy; vec2 uv = fc/uRes; float asp = uRes.x/uRes.y;
  vec2 b1 = vec2(0.24 + 0.08*sin(uT*0.11), 0.48 + 0.10*cos(uT*0.09));
  vec2 b2 = vec2(0.86 + 0.05*cos(uT*0.07), 0.14 + 0.07*sin(uT*0.13));
  vec2 b3 = vec2(0.56 + 0.12*sin(uT*0.05 + 1.0), 0.38 + 0.08*cos(uT*0.08));
  vec2 pp = vec2(uP.x/asp, uP.y);
  b3 = mix(b3, pp, uA*0.55);
  vec2 b4 = vec2(0.92, 0.82 + 0.04*sin(uT*0.1));
  vec2 b5 = vec2(0.04, 0.92);
  vec3 col = vec3(0.012, 0.022, 0.06);
  col = mix(col, vec3(0.03, 0.12, 0.42), g(uv, b1, 0.55, asp)*0.95);
  col = mix(col, vec3(0.14, 0.38, 0.92), g(uv, b3, 0.30, asp)*0.85);
  col = mix(col, vec3(0.30, 0.60, 0.98), g(uv, b2, 0.26, asp)*0.7);
  col = mix(col, vec3(0.36, 0.45, 0.60), g(uv, b4, 0.42, asp)*0.45);
  col = mix(col, vec3(0.28, 0.52, 0.92), g(uv, b5, 0.28, asp)*0.5);
  vec2 uvh = fc/uRes.y;
  col += vec3(0.5,0.7,1.0) * (pulse(uK0, uvh) + pulse(uK1, uvh) + pulse(uK2, uvh)) * 0.25;
  col += (hash(floor(fc)) - 0.5) * 0.07;
  gl_FragColor = vec4(col, 1.);
}`;

function ShaderBG(layer, frag, scale, lines) {
  const cv = makeCanvas(layer, 0);
  let gl;
  try { gl = glLayer(cv, frag); } catch (e) { gl = null; }
  const ov = lines ? makeCanvas(layer, 1) : null, octx = ov && ov.getContext('2d');
  const fb = gl ? null : cv.getContext('2d');
  let W = 0, H = 0, dpr = 1, mobile = false;
  return {
    resize(w, h, d, m) {
      W = w; H = h; dpr = d; mobile = m;
      sizeCanvas(cv, w, h, Math.min(d, 1.5) * scale);
      if (ov) { sizeCanvas(ov, w, h, d); lines(octx, w, h, d, m); }
    },
    frame(t, dt, P) {
      if (!gl) { // no WebGL: simple glow
        fb.setTransform(cv.width / W, 0, 0, cv.height / H, 0, 0);
        const g = fb.createRadialGradient(W * 0.8, H * 0.8, 0, W * 0.8, H * 0.8, Math.max(W, H));
        g.addColorStop(0, '#2c5cff'); g.addColorStop(0.5, '#08165a'); g.addColorStop(1, '#02040d');
        fb.fillStyle = g; fb.fillRect(0, 0, W, H);
        return;
      }
      gl.set('uRes', cv.width, cv.height);
      gl.set('uT', t);
      gl.set('uP', P.sx / H, (H - P.sy) / H);
      gl.set('uA', P.a);
      for (let k = 0; k < 3; k++) {
        const p = P.pulses[P.pulses.length - 1 - k];
        gl.set('uK' + k, p ? p.x / H : 0, p ? (H - p.y) / H : 0, p ? p.age : 0, p ? 1 : 0);
      }
      gl.draw();
    },
    destroy() { if (gl) gl.destroy(); cv.remove(); if (ov) ov.remove(); },
  };
}
function hazeLines(c, w, h, d, m) {
  c.setTransform(d, 0, 0, d, 0, 0); c.clearRect(0, 0, w, h);
  c.lineWidth = 1 / d + 0.25;
  c.strokeStyle = 'rgba(200,215,255,0.16)';
  c.beginPath();
  for (const f of m ? [0.5] : [1 / 3, 2 / 3]) { const x = Math.round(w * f) + 0.5; c.moveTo(x, 0); c.lineTo(x, h); }
  for (const f of [0.25, 0.75, 0.83]) { const y = Math.round(h * f) + 0.5; c.moveTo(0, y); c.lineTo(w, y); }
  c.stroke();
  const r = m ? w * 0.46 : Math.min(h * 0.4, w * 0.24), x = m ? w * 0.5 : w * 0.66;
  c.strokeStyle = 'rgba(210,225,255,0.20)';
  for (const y of [h * 0.5 - r * 0.5, h * 0.5 + r * 0.5]) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke(); }
}

/* ================= 5. LIDAR ================= */
function Lidar(layer) {
  const cv = makeCanvas(layer, 0), ctx = cv.getContext('2d');
  let W = 0, H = 0, dpr = 1, mobile = false, GX = 150, GZ = 70, xs = null, zs = null;
  const LV = 9, buckets = Array.from({ length: LV }, () => []);
  const colors = [];
  for (let k = 0; k < LV; k++) {
    const u = k / (LV - 1);
    const c = u < 0.5 ? [mix(20, 45, u * 2), mix(40, 110, u * 2), mix(120, 255, u * 2)] : [mix(45, 225, (u - 0.5) * 2), mix(110, 240, (u - 0.5) * 2), 255];
    colors.push(`rgb(${c.map((v) => v | 0).join(',')})`);
  }
  let scan0 = 0;
  return {
    resize(w, h, d, m) {
      W = w; H = h; dpr = d; mobile = m;
      sizeCanvas(cv, w, h, d);
      GX = m ? 80 : 150; GZ = m ? 48 : 70;
      const span = m ? 1.5 : 2.2 * clamp(w / h / 1.6, 0.8, 1.4);
      xs = Float32Array.from({ length: GX }, (_, i) => mix(-span, span, i / (GX - 1)));
      zs = Float32Array.from({ length: GZ }, (_, j) => 0.02 + 3.4 * Math.pow(j / (GZ - 1), 1.35));
    },
    frame(t, dt, P) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      for (const p of P.taps) scan0 = t + 0.3; // a tap starts a fresh sweep from the front
      const f = H * (mobile ? 0.46 : 0.56), hor = H * (mobile ? 0.36 : 0.2), camY = 0.95;
      const yaw = (P.sx / W - 0.5) * 0.35 * P.a + 0.12 * Math.sin(t * 0.05);
      const zsP = ((t - scan0) * 0.5) % 4.4 - 0.3;
      const pr2 = (mobile ? 70 : 95) ** 2;
      for (const b of buckets) b.length = 0;
      for (let j = GZ - 1; j >= 0; j--) {
        const z = zs[j], depth = z + 0.6, fog = Math.exp(-z * 0.42);
        const dz = z - zsP;
        const scan = Math.exp(-(dz * dz) / 0.012) + (dz < 0 && dz > -1.2 ? 0.32 * Math.exp(dz / 0.35) : 0);
        const size = clamp(3.2 / depth, 1, 3.2);
        for (let i = 0; i < GX; i++) {
          const x = xs[i] + yaw * depth * 0.5;
          const h = 0.2 * Math.sin(1.6 * x + 0.3 * t) * Math.cos(1.25 * z - 0.18 * t)
            + 0.08 * Math.sin(3.1 * x - 2.2 * z + 0.42 * t) + 0.04 * Math.sin(5.6 * x + 4.3 * z);
          const sx = W / 2 + (x / depth) * f, sy = hor + ((camY - h) / depth) * f;
          if (sx < -4 || sx > W + 4 || sy > H + 4) continue;
          const dx = sx - P.sx, dy = sy - P.sy;
          const near = P.a * Math.exp(-(dx * dx + dy * dy) / (2 * pr2));
          const crest = clamp((h + 0.12) / 0.3, 0, 1);
          const b = (0.3 + 0.35 * crest) * fog + 0.9 * scan * (0.45 + 0.55 * fog) + 0.75 * near;
          const lv = Math.min(LV - 1, (b * LV) | 0);
          if (lv < 1 && ((i + j) & 1)) continue;
          buckets[lv].push(sx, sy, size);
        }
      }
      for (let k = 0; k < LV; k++) {
        const a = buckets[k];
        if (!a.length) continue;
        ctx.fillStyle = colors[k];
        ctx.globalAlpha = 0.35 + 0.65 * (k / (LV - 1));
        for (let q = 0; q < a.length; q += 3) { const s = a[q + 2]; ctx.fillRect(a[q] - s / 2, a[q + 1] - s / 2, s, s); }
      }
      ctx.globalAlpha = 1;
      // horizon hairline
      ctx.strokeStyle = 'rgba(150,180,255,0.12)'; ctx.lineWidth = 1 / dpr + 0.25;
      const yH = Math.round(hor + (camY / 4.0) * f - 18) + 0.5;
      ctx.beginPath(); ctx.moveTo(0, yH); ctx.lineTo(W, yH); ctx.stroke();
    },
    destroy() { cv.remove(); },
  };
}

const RENDERERS = {
  streams: Streams,
  columns: Columns,
  rings: (layer) => ShaderBG(layer, RINGS_FS, 1, null),
  haze: (layer) => ShaderBG(layer, HAZE_FS, 0.6, hazeLines),
  lidar: Lidar,
};

/* ================= host ================= */
export function mountQEBackground(host, options = {}) {
  const o = {
    variant: 'streams',
    clearSelector: '[data-bg-clear]',
    dimSelector: '[data-bg-dim]',
    clearStrength: 0.85,
    dimStrength: 0.4,
    padding: 16,
    feather: 70,
    interactive: true,
    ...options,
  };
  if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
  host.style.isolation = 'isolate';
  const layer = document.createElement('div');
  layer.setAttribute('aria-hidden', 'true');
  layer.style.cssText = 'position:absolute;inset:0;z-index:-1;pointer-events:none;overflow:hidden;opacity:var(--qe-bg-opacity,1);-webkit-mask-size:100% 100%;mask-size:100% 100%;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat';
  host.prepend(layer);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  let r = null, W = 0, H = 0, dpr = 1, mobile = false, t = 12, last = 0;
  let raf = 0, pending = 0, visible = true, alive = true, paused = false;
  const P = { x: 0, y: 0, sx: 0, sy: 0, a: 0, lastMove: -1e9, pulses: [], taps: [] };
  const taps = [];

  /* readability mask */
  function textRects(el) {
    const out = [];
    const tw = document.createTreeWalker(el, 4), rg = document.createRange();
    for (let n = tw.nextNode(); n; n = tw.nextNode()) {
      if (!n.nodeValue.trim()) continue;
      rg.selectNodeContents(n);
      for (const q of rg.getClientRects()) if (q.width > 1 && q.height > 1) out.push(q);
    }
    el.querySelectorAll('a,button,input,svg,img,[data-bg-box]').forEach((e) => { const q = e.getBoundingClientRect(); if (q.width && q.height) out.push(q); });
    if (!out.length) { const q = el.getBoundingClientRect(); if (q.width && q.height) out.push(q); }
    return out;
  }
  const query = (sel) => (!sel ? [] : typeof sel !== 'string' ? [].concat(sel) : [...host.querySelectorAll(sel)]);
  function buildMask() {
    const lr = layer.getBoundingClientRect(), p = o.padding, zones = [];
    const add = (els, s) => els.forEach((el) => textRects(el).forEach((q) =>
      zones.push({ l: q.left - lr.left - p, t: q.top - lr.top - p, r: q.right - lr.left + p, b: q.bottom - lr.top + p, s })));
    add(query(o.clearSelector), o.clearStrength);
    add(query(o.dimSelector), o.dimStrength);
    if (!zones.length) { layer.style.maskImage = layer.style.webkitMaskImage = ''; return; }
    const k = 6, mw = Math.ceil(W / k), mh = Math.ceil(H / k);
    const c = document.createElement('canvas'); c.width = mw; c.height = mh;
    const x = c.getContext('2d'), img = x.createImageData(mw, mh);
    for (let y = 0, i = 0; y < mh; y++) for (let xx = 0; xx < mw; xx++, i++) {
      const px = (xx + 0.5) * k, py = (y + 0.5) * k;
      let m = 1;
      for (const z of zones) {
        const hx = (z.r - z.l) / 2, hy = (z.b - z.t) / 2, rad = Math.min(hx, hy, 12);
        const qx = Math.abs(px - z.l - hx) - hx + rad, qy = Math.abs(py - z.t - hy) - hy + rad;
        const d = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - rad;
        m = Math.min(m, 1 - z.s * (1 - smooth(0, o.feather, d)));
      }
      img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = 255;
      img.data[i * 4 + 3] = Math.round(m * 255);
    }
    x.putImageData(img, 0, 0);
    const url = `url(${c.toDataURL('image/png')})`;
    layer.style.maskImage = url; layer.style.webkitMaskImage = url;
  }

  function resize() {
    pending = 0;
    if (!alive) return;
    const rc = layer.getBoundingClientRect();
    W = rc.width; H = rc.height;
    if (!W || !H) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    mobile = W < 768;
    if (!P.lastMove || P.sx === 0) { P.sx = P.x = W * 0.7; P.sy = P.y = H * 0.55; }
    r.resize(W, H, dpr, mobile);
    buildMask();
    render(0);
    kick();
  }
  function render(dt) {
    t += dt;
    const now = performance.now();
    const active = now - P.lastMove < 2500 ? 1 : 0;
    const e = dt ? 1 - Math.exp(-dt * 4) : 1;
    P.sx += (P.x - P.sx) * e; P.sy += (P.y - P.sy) * e;
    P.a += (active - P.a) * (dt ? 1 - Math.exp(-dt * 2.5) : 1);
    for (const p of P.pulses) p.age += dt;
    while (P.pulses.length && P.pulses[0].age > 2.2) P.pulses.shift();
    P.taps = taps.splice(0);
    for (const p of P.taps) P.pulses.push({ x: p.x, y: p.y, age: 0 });
    r.frame(t, dt, P);
  }

  const animating = () => !paused && !reduce.matches;
  const running = () => alive && visible && !document.hidden && animating();
  function loop(now) {
    raf = 0;
    if (!running()) { last = 0; return; }
    raf = requestAnimationFrame(loop);
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    render(dt);
  }
  function kick() { if (!raf && running()) raf = requestAnimationFrame(loop); }
  const schedule = () => { if (!pending) pending = requestAnimationFrame(resize); };

  function onMove(e) {
    if (!o.interactive || !W) return;
    const rc = layer.getBoundingClientRect(), x = e.clientX - rc.left, y = e.clientY - rc.top;
    if (x < 0 || y < 0 || x > W || y > H) return;
    P.x = x; P.y = y; P.lastMove = performance.now();
  }
  function onDown(e) {
    if (!o.interactive || !W) return;
    if (e.target && e.target.closest && e.target.closest(INTERACTIVE)) return;
    const rc = layer.getBoundingClientRect(), x = e.clientX - rc.left, y = e.clientY - rc.top;
    if (x < 0 || y < 0 || x > W || y > H) return;
    P.x = x; P.y = y; P.lastMove = performance.now();
    taps.push({ x, y });
    if (!animating()) render(0);
  }

  function setVariant(v) {
    if (!RENDERERS[v]) return;
    if (r) r.destroy();
    o.variant = v;
    r = RENDERERS[v](layer);
    if (W) { r.resize(W, H, dpr, mobile); render(0); }
  }
  setVariant(o.variant);

  const ro = new ResizeObserver(schedule);
  ro.observe(host);
  const io = new IntersectionObserver((en) => { visible = en[en.length - 1].isIntersecting; kick(); });
  io.observe(host);
  const onVis = () => kick();
  const onReduce = () => { kick(); render(0); };
  document.addEventListener('visibilitychange', onVis);
  reduce.addEventListener('change', onReduce);
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerdown', onDown, { passive: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);
  resize();

  return {
    get variant() { return o.variant; },
    setVariant,
    pause() { paused = true; },
    play() { paused = false; kick(); },
    get paused() { return paused; },
    pulse(x, y) { taps.push({ x, y }); kick(); },
    refresh: schedule,
    destroy() {
      alive = false;
      cancelAnimationFrame(raf); cancelAnimationFrame(pending);
      ro.disconnect(); io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      reduce.removeEventListener('change', onReduce);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      if (r) r.destroy();
      layer.remove();
    },
  };
}
