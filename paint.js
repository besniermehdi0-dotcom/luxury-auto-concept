/* PaintPanel: a live-rendered close-up of a car body panel under studio strip lights.
   Clearcoat reflections, metallic flake, a wheel in the arch, and (hero) accident damage right of a strip of painter's
   tape: a shallow dent with a crease that bends the strip reflections, a scrape through the clear, scuffed haze.
   The pointer is the inspection light. The paint-layer scene reuses it with damage off. WebGL2, one full-screen pass. */
(function () {
  const VS = `#version 300 es
in vec2 a; out vec2 vUv; void main(){ vUv = a*0.5+0.5; gl_Position = vec4(a,0.,1.); }`;

  const MASK_FS = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform sampler2D uPrev; uniform vec2 uA, uB; uniform float uR, uAspect, uDt, uRegrow, uOn, uInit;
uniform vec2 uTapeP; uniform vec2 uTapeN; uniform vec3 uFrame;
float segDist(vec2 p, vec2 a, vec2 b){ vec2 pa=p-a, ba=b-a; float h=clamp(dot(pa,ba)/max(dot(ba,ba),1e-6),0.,1.); return length(pa-ba*h); }
void main(){
  vec2 p = vec2((vUv.x-0.5)*uAspect, vUv.y-0.5)*uFrame.z + uFrame.xy;
  float side = dot(p - uTapeP, uTapeN);
  float m = texture(uPrev, vUv).r;
  if (uInit > 0.5) m = side < 0.0 ? 1.0 : 0.0;
  vec2 a = vec2((uA.x-0.5)*uAspect, uA.y-0.5)*uFrame.z + uFrame.xy, b = vec2((uB.x-0.5)*uAspect, uB.y-0.5)*uFrame.z + uFrame.xy;
  float d = segDist(p, a, b);
  float brush = smoothstep(uR, 0.0, d) * uOn;
  float keep = side < 0.0 ? 0.0 : 1.0;          // the taped-off left half stays polished
  m = max(m - uRegrow*uDt*keep, 0.0);
  m = min(1.0, m + brush*0.22);
  o = vec4(m,0.,0.,1.);
}`;

  const FS = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform vec2 uRes; uniform float uTime, uScroll, uIntro, uFlake, uTape, uTorch, uGap;
uniform vec2 uMouse; uniform sampler2D uMask;
uniform vec3 uPaint, uTapeCol, uKey;
uniform vec2 uTapeP, uTapeN;
uniform vec3 uFrame;
uniform float uLayers, uStage, uDamage; uniform vec3 uPrimer;

float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*f*(f*(f*6.-15.)+10.);
  return mix(mix(hash(i),hash(i+vec2(1,0)),u.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x), u.y); }

// rear haunch of a car, seen from the side: body curvature, fender bulge, shoulder crease, rolled wheel-arch lip
float panel(vec2 p, out float arch){
  float h = -0.26*p.y*p.y - 0.05*p.x*p.x;
  vec2 d = (p - vec2(0.32, -0.30)) / vec2(1.05, 0.60);
  h += 0.05*exp(-dot(d,d));
  float line = 0.215 + 0.05*p.x - 0.11*p.x*p.x;
  float dc = p.y - line;
  h += -0.03*sqrt(dc*dc + 0.0006);
  float da = length(p - vec2(0.45, -0.66)) - 0.38;
  arch = da;
  h += -0.055*exp(-max(da,0.0)*24.0);
  // accident damage, only right of the tape: a shallow elongated dent with a sharp crease, and a small ding
  float side = dot(p - uTapeP, uTapeN);
  float dmg = smoothstep(0.0, 0.04, side) * uDamage;
  vec2 q = p - vec2(0.36, 0.03); float ca = 0.978, sa = 0.208;
  vec2 uv = vec2(ca*q.x + sa*q.y, -sa*q.x + ca*q.y);
  h -= dmg * (0.011*exp(-(uv.x*uv.x/0.0225 + uv.y*uv.y/0.0032)) + 0.0018*exp(-uv.y*uv.y/0.00006)*exp(-uv.x*uv.x/0.011));
  vec2 q2 = p - vec2(0.56, -0.13);
  h -= dmg * 0.004*exp(-dot(q2, q2)/0.0011);
  return h;
}
// the scrape: a few near-parallel scratches through the clear, along the dent
float scrape(vec2 p, out float haze){
  vec2 q = p - vec2(0.34, 0.035); float ca = 0.985, sa = 0.17;
  vec2 uv = vec2(ca*q.x + sa*q.y, -sa*q.x + ca*q.y);
  haze = exp(-(uv.x*uv.x/0.05 + uv.y*uv.y/0.0045));
  float s = 0.0;
  for (int i = 0; i < 6; i++){
    float fi = float(i);
    float off = -0.012 + fi*0.0047 + (hash(vec2(fi, 3.7)) - 0.5)*0.003;
    float len0 = -0.17 + hash(vec2(fi, 9.1))*0.06, len1 = 0.10 + hash(vec2(fi, 5.3))*0.08;
    float wv = off + 0.0016*sin(uv.x*55.0 + fi*1.7);
    float w = 0.0005 + 0.0006*hash(vec2(fi, 1.3));
    float aa = fwidth(uv.y)*0.9;
    float line = 1.0 - smoothstep(w, w + aa, abs(uv.y - wv));
    float ends = smoothstep(len0, len0 + 0.03, uv.x) * smoothstep(len1, len1 - 0.05, uv.x);
    float broken = smoothstep(0.25, 0.45, noise(vec2(uv.x*38.0, fi*4.0)));
    s = max(s, line * ends * broken);
  }
  return s;
}
float soft(float x, float w){ float a = abs(x)/w; return smoothstep(1.0, 0.45, a) + 0.22*exp(-a*a*0.6); }
vec3 env(vec3 r, float blur){
  float t = uTime*0.045 + uScroll*1.6;
  float k = mix(0.0, 1.0, uIntro);
  vec3 c = vec3(0.0030,0.0032,0.0040)*(0.6+0.4*r.y);
  float y1 = mix(-1.2, 0.48, uIntro) + 0.018*sin(t);
  c += uKey*5.5*k*soft(r.y - y1, 0.020 + blur)*smoothstep(1.1, 0.5, abs(r.x+0.15));
  c += vec3(0.93,0.96,1.0)*4.0*k*soft(r.y - (0.10 + 0.016*sin(t*1.3+1.)), 0.014 + blur)*smoothstep(0.95, 0.4, abs(r.x-0.2));
  c += vec3(1.0)*0.9*k*soft(r.y - (-0.34 + 0.012*sin(t*0.8+2.)), 0.06 + blur)*smoothstep(1.2, 0.3, abs(r.x));
  c += uKey*3.0*k*soft(r.x - (0.74 + 0.02*sin(t*0.7)), 0.035 + blur)*smoothstep(0.8, 0.2, abs(r.y-0.15));
  c += vec3(0.85,0.9,1.0)*0.12*k*smoothstep(0.55, 1.1, r.y + blur);
  vec2 fd = (r.xy - vec2(0.05, 0.28))/vec2(0.9, 0.55);
  c += vec3(0.80,0.86,0.95)*0.16*k*exp(-dot(fd,fd)*1.6);
  c += vec3(0.05,0.05,0.055)*k*smoothstep(-0.45, -0.95, r.y);
  return c;
}
vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14),0.,1.); }

void main(){
  float aspect = uRes.x/uRes.y;
  vec2 p = vec2((vUv.x-0.5)*aspect, vUv.y-0.5)*uFrame.z + uFrame.xy;
  vec2 m = vec2((uMouse.x-0.5)*aspect, uMouse.y-0.5)*uFrame.z + uFrame.xy;
  vec2 px = 1.5/vec2(textureSize(uMask,0));
  float polish = (texture(uMask, vUv).r*2.0 + texture(uMask, vUv+vec2(px.x,0.)).r + texture(uMask, vUv-vec2(px.x,0.)).r + texture(uMask, vUv+vec2(0.,px.y)).r + texture(uMask, vUv-vec2(0.,px.y)).r)/6.0;
  polish = smoothstep(0.0, 1.0, polish);

  float arch, a1, a2;
  float e = 0.0012;
  float h0 = panel(p, arch);
  float hx = (panel(p+vec2(e,0.), a1)-panel(p-vec2(e,0.), a2))/(2.*e);
  float hy = (panel(p+vec2(0.,e), a1)-panel(p-vec2(0.,e), a2))/(2.*e);
  vec3 n = normalize(vec3(-hx, -hy, 1.0));
  vec3 v = normalize(vec3(p*0.30, -1.0));
  vec3 r = reflect(v, n);
  float cosT = clamp(dot(n, -v), 0.0, 1.0);
  float F = 0.04 + 0.96*pow(1.0-cosT, 5.0);

  // paint layers (the rebuild scene): a spray front crosses the panel from left to right, stage by stage
  float metal = 0.0, rough = 0.0, clear = 1.0, sand = 0.0; vec3 base = uPaint; float flk = uFlake;
  if (uLayers > 0.5) {
    float sl = clamp(uStage + 0.4 - vUv.x*0.8 + (noise(p*6.0)-0.5)*0.22 + (noise(p*40.0)-0.5)*0.05, 0.0, 3.0);
    float a1 = smoothstep(0.0, 1.0, sl), a2 = smoothstep(1.0, 2.0, sl), a3 = smoothstep(2.0, 3.0, sl);
    float w0 = 1.0 - a1, w1 = a1*(1.0 - a2), w2 = a2*(1.0 - a3), w3 = a3;
    metal = w0; sand = w0 + w1*0.45; clear = w3;
    base = vec3(0.5)*w0 + uPrimer*w1 + uPaint*(w2 + w3);
    rough = w0*0.55 + w1*1.0 + w2*0.5;
    flk = uFlake*(w2 + w3);
    // sanding marks: fine straight grooves at two angles
    vec2 d1 = normalize(vec2(1.0, 0.35)), d2 = normalize(vec2(1.0, -0.6));
    float g1 = noise(vec2(dot(p, d1)*1100.0, dot(p, vec2(-d1.y, d1.x))*6.0)) - 0.5;
    float g2 = noise(vec2(dot(p, d2)*850.0, dot(p, vec2(-d2.y, d2.x))*5.0)) - 0.5;
    // fade the grooves out where they would alias (finer than a pixel)
    float fa = smoothstep(1.1, 0.35, fwidth(dot(p, d1)*1100.0));
    n = normalize(n + vec3(vec2(-d1.y, d1.x)*g1*0.09 + vec2(-d2.y, d2.x)*g2*0.06, 0.0)*sand*fa);
    // primer tooth: a fine speckle in the matte grey
    base *= 1.0 + (hash(floor(p*900.0)) - 0.5)*0.35*w1;
    r = reflect(v, n);
  }
  // base coat: mostly carried by the clearcoat; the colour shows where the panel faces the lights
  vec3 col = base * (1.0 - metal) * (0.03 + env(n, 0.32 + 0.12*(1.0-clear))*mix(0.11, 0.16, clear));
  col += mix(vec3(0.04), vec3(0.56, 0.57, 0.585), metal) * env(r, 0.015 + rough*0.12) * (1.0 - clear) * mix(0.8, 0.3, metal);
  // metallic flake: fine sparkle that only shows near the lights
  vec2 fc = floor(p*640.0);
  vec2 fj = vec2(hash(fc+3.1), hash(fc+7.7)) - 0.5;
  vec3 fr = reflect(v, normalize(n + vec3(fj*0.5, 0.0)));
  float fl = step(0.6, hash(fc)) * flk;
  vec3 fe = env(fr, 0.01);
  col += (base*4.0 + 0.012) * fe * fl * 0.07 * smoothstep(0.3, 2.0, dot(fe, vec3(0.33)));

  // clearcoat: sharp, except where the scrape scuffed it
  float haze; float scr = scrape(p, haze) * smoothstep(0.0, 0.04, dot(p - uTapeP, uTapeN)) * uDamage;
  haze *= smoothstep(0.0, 0.04, dot(p - uTapeP, uTapeN)) * uDamage;
  vec3 sharp = env(r, 0.0), hazy = env(r, 0.07);
  col += F * mix(sharp, sharp*0.35 + hazy*0.55, haze*0.85) * clear;

  // the scrape: grey primer showing through, glinting under the strips and the inspection light
  vec2 toL = p - m; float dl = length(toL);
  float halo = exp(-dl*dl*60.0) * uTorch;
  vec3 scrc = vec3(0.05, 0.052, 0.056) + env(n, 0.2)*0.05 + vec3(0.9, 0.92, 0.95)*(dot(env(r, 0.05), vec3(0.33))*0.08 + halo*0.45);
  col = mix(col, scrc, scr);
  col += vec3(0.85, 0.88, 0.95) * haze * halo * 0.05;
  // the inspection light
  col += vec3(1.0,0.97,0.93) * (exp(-dl*dl*5200.0)*2.4 + exp(-dl*dl*240.0)*0.05) * uTorch;

  // wheel arch: the opening and the tyre shoulder catching the key light
  float inA = smoothstep(0.0015, -0.0015, arch);
  vec3 voidc = vec3(0.0012, 0.0012, 0.0014);
  vec2 tc = p - vec2(0.45, -0.66); float dt = length(tc);
  float RT = 0.338, RR = 0.236;
  // tyre: matte rubber, the shoulder rolling toward the light
  vec3 tn = normalize(vec3(tc/max(dt, 1e-4)*clamp((dt - (RT - 0.05))*14.0, -1.0, 1.0)*0.9, 1.0));
  vec3 tyre = vec3(0.0035) + env(tn, 0.32)*0.0045 + env(reflect(v, tn), 0.16)*0.006;
  float inT0 = smoothstep(RT + 0.002, RT - 0.002, dt);
  voidc = mix(voidc, tyre, inT0);
  // rim: five split spokes, machined faces catch the strips
  float ang = atan(tc.y, tc.x);
  float spoke = smoothstep(0.62, 0.70, 0.5 + 0.5*cos(ang*10.0)) * smoothstep(0.035, 0.07, dt) ;
  vec3 rn = normalize(vec3(vec2(cos(ang), sin(ang))*0.35*sin(ang*10.0), 1.0));
  vec3 rim = mix(vec3(0.004), vec3(0.03) + env(reflect(v, rn), 0.03)*0.32, spoke);
  float lip = smoothstep(0.006, 0.0, abs(dt - RR + 0.004));
  rim += env(reflect(v, normalize(vec3(tc/max(dt,1e-4)*0.6, 1.0))), 0.02)*0.25*lip;
  voidc = mix(voidc, rim, smoothstep(RR + 0.002, RR - 0.002, dt));
  col = mix(col, voidc, inA * smoothstep(0.0, 0.25, uIntro));

  // panel gap (door shut line) running down the left of the haunch
  float gx = p.x - (0.74 + 0.04*p.y + 0.05*p.y*p.y);
  float gap = smoothstep(0.0024, 0.0009, abs(gx)) * uGap * (1.0 - inA);
  col = mix(col, vec3(0.0), gap);
  col += smoothstep(0.005, 0.0024, abs(gx)) * (1.0-smoothstep(0.0024, 0.0014, abs(gx))) * F * env(reflect(v, normalize(n + vec3(sign(gx)*0.7,0.,0.))), 0.02) * 0.6 * uGap * (1.0-inA);

  // painter's tape across the panel: the 50/50 line
  if (uTape > 0.5){
    float s = dot(p - uTapeP, uTapeN);
    vec2 tq = vec2(dot(p, vec2(-uTapeN.y, uTapeN.x)), s);
    float ragged = (noise(vec2(tq.x*180.0, 3.0)) - 0.5)*0.0016;
    float tw = 0.024;
    float shadow = smoothstep(tw + 0.010, tw - 0.002, abs(s + 0.003));
    float top = 0.885 + (noise(vec2(s*420.0, 2.0)) - 0.5)*0.014 + s*0.25;
    float torn = smoothstep(top + 0.0015, top - 0.0015, vUv.y);
    float inT = smoothstep(tw + ragged + 0.001, tw + ragged, abs(s)) * (1.0 - inA) * torn;
    col *= 1.0 - shadow*0.75*(1.0-inA)*torn;
    float crepe = noise(vec2(tq.x*700.0, tq.y*30.0))*0.55 + noise(tq*vec2(90.0, 260.0))*0.45;
    vec3 irr = env(n, 0.6)*0.045 + 0.004;
    vec3 tape = uTapeCol * irr * (0.85 + 0.28*crepe);
    tape += 0.05*F*env(r, 0.12) + 0.004*env(r, 0.3);
    float edge = smoothstep(tw - 0.003, tw, abs(s));
    tape *= 1.0 - 0.25*edge;
    col = mix(col, tape, inT);
  }

  col *= smoothstep(0.0, 0.3, uIntro);
  float vig = smoothstep(1.3, 0.2, length(p*vec2(0.8, 1.05)));
  col *= 0.5 + 0.5*vig;
  col = aces(col*1.15);
  col = pow(col, vec3(1.0/2.2));
  col += (hash(vUv*uRes + fract(uTime)*61.0) - 0.5) * 0.018;
  o = vec4(col, 1.0);
}`;

  function compile(gl, type, src) {
    const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  function program(gl, fs) {
    const p = gl.createProgram();
    gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, VS)); gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
    gl.bindAttribLocation(p, 0, 'a'); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {}; const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const name = gl.getActiveUniform(p, i).name; u[name] = gl.getUniformLocation(p, name); }
    return { p, u };
  }
  const lin = h => { const c = parseInt(h.slice(1), 16); return [c >> 16, (c >> 8) & 255, c & 255].map(x => Math.pow(x / 255, 2.2)); };

  function mount(canvas, opts = {}) {
    const o = Object.assign({ damage: 1, layers: 0, stage: 3, primer: '#6f7275', tapeX: -0.06, tape: true, paint: '#0b0c0f', tapeCol: '#2f6df0', key: '#fff6ea', flake: 1, torch: 1, gap: 1, scale: 1, demo: true }, opts);
    const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'high-performance' });
    if (!gl) return null;
    let main, mask;
    const MW = 512; let MH = 288;
    let tex = [], fbo = [];
    function setup() {
      main = program(gl, FS); mask = program(gl, MASK_FS);
      const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      tex = []; fbo = []; W = H = 0;
    }
    function makeMask() {
      for (let i = 0; i < 2; i++) {
        if (tex[i]) { gl.deleteTexture(tex[i]); gl.deleteFramebuffer(fbo[i]); }
        tex[i] = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex[i]);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, MW, MH, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        fbo[i] = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fbo[i]);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex[i], 0);
      }
      init = true;
    }
    let init = true, cur = 0, W = 0, H = 0, lost = false;
    try { setup(); } catch (e) { return null; }
    // context loss (phones under memory pressure): stop, show the still underneath, rebuild if the browser restores it
    canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); lost = true; cancelAnimationFrame(raf); canvas.classList.remove('is-live'); });
    canvas.addEventListener('webglcontextrestored', () => { try { setup(); lost = false; init = true; canvas.classList.add('is-live'); loop(); } catch (e) { /* the still stays */ } });
    function resize() {
      let dpr = Math.min(window.devicePixelRatio || 1, 1.5) * o.scale;
      const px = canvas.clientWidth * canvas.clientHeight * dpr * dpr;
      if (px > 2.2e6) dpr *= Math.sqrt(2.2e6 / px);       // never more than about 2 MP per panel
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr)), h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (w === W && h === H) return;
      W = canvas.width = w; H = canvas.height = h;
      const mh = Math.round(MW * h / w); if (mh !== MH || !tex[0]) { MH = mh; makeMask(); }
    }
    // portrait screens zoom in on the haunch and tape; wide screens show the whole panel
    const framing = a => (o.frame ? o.frame(a) : (a < 1 ? [0.10, -0.02, 1.25] : [0, 0, 1]));
    const tapeN = (() => { const a = Math.atan2(0.12, 1); return [Math.cos(a), Math.sin(a)]; })();
    const state = { mouse: [0.72, 0.52], last: [0.72, 0.52], target: [0.72, 0.52], on: 0, idle: 0, scroll: 0, intro: 0, t0: performance.now(), visible: true };
    const toUv = e => { const r = canvas.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height]; };
    canvas.addEventListener('pointermove', e => { state.target = toUv(e); state.idle = 0; state.user = true; });
    canvas.addEventListener('pointerleave', () => { state.user = false; });
    const io = new IntersectionObserver(es => { state.visible = es[0].isIntersecting; if (state.visible) loop(); });
    io.observe(canvas);
    let raf = 0, prev = performance.now();
    function loop() { cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); }
    let lastDraw = 0;
    function frame(now) {
      if (!state.visible || lost) return;
      if (now - lastDraw < 15.5) { raf = requestAnimationFrame(frame); return; }
      lastDraw = now;
      const dt = Math.min(0.05, (now - prev) / 1000); prev = now;
      const t = (now - state.t0) / 1000;
      resize();
      state.intro = Math.min(1, t / 2.6); const ease = 1 - Math.pow(1 - state.intro, 3);
      state.idle += dt;
      // idle: the inspection light drifts over the swirled half on its own, showing the swirls; it never polishes.
      // Only a visitor's pointer polishes, and the swirls come back slowly so the next visitor sees them too.
      if (o.demo && !state.user && t > 2.2) {
        const k = (t - 2.2) * 0.22;
        state.target = [0.74 + 0.15 * Math.sin(k * 1.3), 0.5 + 0.2 * Math.sin(k * 0.9 + 1.1)];
      }
      const s = state.user ? 0.35 : 0.12;
      state.mouse = [state.mouse[0] + (state.target[0] - state.mouse[0]) * s, state.mouse[1] + (state.target[1] - state.mouse[1]) * s];
      // mask pass
      gl.useProgram(mask.p); gl.viewport(0, 0, MW, MH);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo[1 - cur]);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex[cur]);
      const aspect = W / H;
      gl.uniform1i(mask.u.uPrev, 0); gl.uniform2fv(mask.u.uA, state.last); gl.uniform2fv(mask.u.uB, state.mouse);
      gl.uniform1f(mask.u.uR, 0.07); gl.uniform1f(mask.u.uAspect, aspect); gl.uniform1f(mask.u.uDt, dt);
      gl.uniform1f(mask.u.uRegrow, 0.06); gl.uniform1f(mask.u.uOn, 0); gl.uniform1f(mask.u.uInit, init ? 1 : 0);
      gl.uniform2f(mask.u.uTapeP, o.tapeX, 0); gl.uniform2fv(mask.u.uTapeN, tapeN); gl.uniform3fv(mask.u.uFrame, framing(aspect));
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      init = false; cur = 1 - cur; state.last = state.mouse.slice();
      // main pass
      gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H);
      gl.useProgram(main.p); gl.bindTexture(gl.TEXTURE_2D, tex[cur]);
      const u = main.u;
      gl.uniform2f(u.uRes, W, H); gl.uniform1f(u.uTime, t); gl.uniform1f(u.uScroll, state.scroll); gl.uniform1f(u.uIntro, ease);
      gl.uniform2fv(u.uMouse, state.mouse); gl.uniform1i(u.uMask, 0);
      gl.uniform3fv(u.uPaint, lin(o.paint)); gl.uniform3fv(u.uTapeCol, lin(o.tapeCol)); gl.uniform3fv(u.uKey, lin(o.key));
      gl.uniform1f(u.uDamage, o.damage && o.tape ? 1 : 0); gl.uniform1f(u.uLayers, o.layers ? 1 : 0); gl.uniform1f(u.uStage, o.stage); gl.uniform3fv(u.uPrimer, lin(o.primer));
      gl.uniform1f(u.uFlake, o.flake); gl.uniform1f(u.uTape, o.tape ? 1 : 0); gl.uniform1f(u.uTorch, o.torch); gl.uniform1f(u.uGap, o.gap);
      gl.uniform2f(u.uTapeP, o.tapeX, 0); gl.uniform2fv(u.uTapeN, tapeN); gl.uniform3fv(u.uFrame, framing(aspect));
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(frame);
    }
    loop();
    return {
      // screen x (0..1 of the canvas width) where the tape crosses a given height (0 = bottom, 1 = top)
      tapeX(v) {
        const aspect = (canvas.clientWidth || 1) / (canvas.clientHeight || 1), f = framing(aspect);
        const py = (v - 0.5) * f[2] + f[1];
        const px = o.tapeX - (py * tapeN[1]) / tapeN[0];
        return ((px - f[0]) / f[2]) / aspect + 0.5;
      },
      set(k, v) { o[k] = v; },
      scroll(v) { state.scroll = v; },
      reset() { init = true; },
      destroy() { cancelAnimationFrame(raf); io.disconnect(); }
    };
  }
  window.PaintPanel = { mount };
})();
