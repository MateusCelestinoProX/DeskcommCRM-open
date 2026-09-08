// @ts-nocheck
import { Renderer, Program, Mesh, Color, Triangle, RenderTarget, Camera, Transform, Geometry, Vec2 } from 'ogl';

export interface WebGLBackgroundPreset {
  id: string;
  name: string;
  category: string;
  description: string;
  badge: string;
}

export const BACKGROUND_PRESETS: WebGLBackgroundPreset[] = [
  { id: 'strands', name: 'Strands Luminosos', category: 'Energia & Luz', description: 'Ondas volumétricas e gradientes dinâmicos de luz', badge: 'Energia' },
  { id: 'siderays', name: 'Side Rays', category: 'Luz & Brilho', description: 'Feixes de luz laterais cinemáticos com dispersão', badge: 'Cinemático' },
  { id: 'plasmawave', name: 'Plasma Wave', category: 'Fluido & Eletricidade', description: 'Ondas orgânicas fluidas de plasma cósmico', badge: 'Fluido' },
  { id: 'ferrofluid', name: 'Ferrofluid', category: 'Interativo & Física', description: 'Fluido magnético responsivo ao movimento do cursor', badge: 'Interativo' },
  { id: 'softaurora', name: 'Soft Aurora', category: 'Atmosférico', description: 'Aurora boreal difusa em camadas etéreas', badge: 'Nébula' },
  { id: 'dither', name: 'Dither Waves', category: 'Retro-Tech', description: 'Ondas retro-futuristas com gradiente pontilhado dithered', badge: 'Retro' },
  { id: 'darkveil', name: 'Dark Veil', category: 'Cyberpunk', description: 'Véu escuro e scanlines estilo Cyberpunk e CRT', badge: 'Dark Cyber' },
  { id: 'acidsquares', name: 'Acid Squares', category: 'Geometria Cósmica', description: 'Grid geométrico psicodélico em túnel infinito', badge: 'Geométrico' },
  { id: 'webthreads', name: 'Web Threads', category: 'Rede Neural', description: 'Filamentos digitais entrelaçados de alta densidade', badge: 'Rede' },
  { id: 'balatro', name: 'Balatro Hypno', category: 'Hipnótico', description: 'Hipnose animada estilo carta espiral Balatro', badge: 'Hipnótico' },
  { id: 'moltenmetal', name: 'Molten Metal', category: 'Fusão Térmica', description: 'Metal líquido incandescente em fusão térmica', badge: 'Fusão' },
  { id: 'topography', name: 'Topography', category: 'Cartografia', description: 'Linhas topográficas cartográficas de alta precisão', badge: 'Cartografia' },
  { id: 'lighttunnel', name: 'Light Tunnel', category: 'Hipervelocidade', description: 'Túnel de cabos de fibra e pulsos de velocidade', badge: 'Hipervelocidade' }
];


// Store active cleanup function for WebGL background
let currentCleanup = null;
let currentActiveType = null;

// ==========================================
// 1. STRANDS COMPONENT
// ==========================================
const MAX_STRANDS = 12;
const MAX_COLORS = 8;

const STRANDS_VERT = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const STRANDS_FRAG = `#version 300 es
precision highp float;

uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uColors[${MAX_COLORS}];
uniform int uColorCount;
uniform int uStrandCount;
uniform float uSpeed;
uniform float uAmplitude;
uniform float uWaviness;
uniform float uThickness;
uniform float uGlow;
uniform float uTaper;
uniform float uSpread;
uniform float uHueShift;
uniform float uIntensity;
uniform float uOpacity;
uniform float uScale;
uniform float uSaturation;

out vec4 fragColor;

const float PI = 3.14159265;

vec3 spectrum(float t) {
  return 0.5 + 0.5 * cos(2.0 * PI * (t + vec3(0.00, 0.33, 0.67)));
}

vec3 samplePalette(float t) {
  t = fract(t);
  float scaled = t * float(uColorCount);
  int idx = int(floor(scaled));
  float blend = fract(scaled);
  int nextIdx = idx + 1;
  if (nextIdx >= uColorCount) nextIdx = 0;
  return mix(uColors[idx], uColors[nextIdx], blend);
}

vec3 strandColor(float t) {
  if (uColorCount > 0) return samplePalette(t);
  return spectrum(t);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
  uv /= max(uScale, 0.0001);

  float e = 0.06 + uIntensity * 0.94;
  float env = pow(max(cos(uv.x * PI * 1.3), 0.0), uTaper);

  vec3 col = vec3(0.0);

  for (int i = 0; i < ${MAX_STRANDS}; i++) {
    if (i >= uStrandCount) break;

    float fi = float(i);
    float ph = fi * 1.7 * uSpread;
    float freq = (2.0 + fi * 0.35) * uWaviness;
    float spd = 1.4 + fi * 1.2;

    float tt = uTime * uSpeed;
    float w = sin(uv.x * freq + tt * spd + ph) * 0.60
            + sin(uv.x * freq * 1.1 - tt * spd * 0.7 + ph * 1.7) * 0.40;

    float amp = (0.1 + 0.02 * e) * env * uAmplitude;
    float y = w * amp;

    float d = abs(uv.y - y);
    float thick = (0.001 + 0.05 * e) * (0.35 + env) * uThickness;
    float g = thick / (d + thick * 0.45);
    g = g * g;

    float h = fi / float(uStrandCount) + uv.x * 0.30 + uTime * 0.04 + uHueShift;
    col += strandColor(h) * g * env;
  }

  col *= 0.45 + 0.7 * e;
  col = 1.0 - exp(-col * uGlow);

  float gray = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = max(mix(vec3(gray), col, uSaturation), 0.0);

  float lum = max(max(col.r, col.g), col.b);
  float alpha = clamp(lum, 0.0, 1.0) * uOpacity;

  fragColor = vec4(col * uOpacity, alpha);
}
`;

const STRANDS_GLASS_FRAG = `#version 300 es
precision highp float;

uniform sampler2D uScene;
uniform vec2 uResolution;
uniform float uRadius;
uniform float uRefraction;
uniform float uDispersion;

out vec4 fragColor;

vec2 toUv(vec2 p) {
  return p * (uResolution.y / uResolution) + 0.5;
}

void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
  float d = length(p);
  float r = uRadius;

  float edge = fwidth(d) * 1.5;
  float mask = 1.0 - smoothstep(r - edge, r + edge, d);
  if (mask <= 0.0) {
    fragColor = vec4(0.0);
    return;
  }

  float z = sqrt(max(r * r - d * d, 0.0)) / r;
  float nd = d / r;

  vec2 dir = d > 0.0 ? p / d : vec2(0.0);
  float lens = smoothstep(0.85, 1.0, nd) * pow(nd, 6.0);
  vec2 offset = -dir * lens * uRefraction * 0.15;
  vec2 disp = -dir * lens * uDispersion * 0.012;

  vec3 light;
  light.r = texture(uScene, toUv(p + offset - disp)).r;
  light.g = texture(uScene, toUv(p + offset)).g;
  light.b = texture(uScene, toUv(p + offset + disp)).b;

  float fres = pow(1.0 - z, 3.0);
  vec3 rim = vec3(1.0) * fres * 0.18;

  vec2 lightDir = normalize(vec2(-0.55, 0.6));
  float spec = pow(max(dot(p / max(r, 1e-4), lightDir), 0.0), 6.0);
  spec *= smoothstep(r, r * 0.55, d);

  vec3 emissive = light + rim + vec3(spec) * 0.4;
  float emissiveA = clamp(max(max(emissive.r, emissive.g), emissive.b), 0.0, 1.0);

  float bodyA = 0.05 + fres * 0.05;

  float outA = emissiveA + bodyA * (1.0 - emissiveA);
  vec3 outRGB = emissive;

  outRGB *= mask;
  outA *= mask;

  fragColor = vec4(outRGB, outA);
}
`;

function buildStrandsPalette(colors) {
  const filled = colors && colors.length ? colors : ['#ffffff'];
  const padded = [];
  for (let i = 0; i < MAX_COLORS; i++) {
    const hex = filled[i] ?? filled[filled.length - 1];
    const c = new Color(hex);
    padded.push([c.r, c.g, c.b]);
  }
  return padded;
}

function initStrands(ctn, opts = {}) {
  const colors = opts.colors || ['#F97316', '#7C3AED', '#06B6D4'];
  const count = opts.count ?? 3;
  const speed = opts.speed ?? 0.5;
  const amplitude = opts.amplitude ?? 1;
  const waviness = opts.waviness ?? 1;
  const thickness = opts.thickness ?? 0.7;
  const glow = opts.glow ?? 2.6;
  const taper = opts.taper ?? 3;
  const spread = opts.spread ?? 1;
  const hueShift = opts.hueShift ?? 0;
  const intensity = opts.intensity ?? 0.6;
  const saturation = opts.saturation ?? 1.5;
  const opacity = opts.opacity ?? 1;
  const scale = opts.scale ?? 1.5;
  const glass = opts.glass ?? false;
  const refraction = opts.refraction ?? 1;
  const dispersion = opts.dispersion ?? 1;
  const glassSize = opts.glassSize ?? 1;

  const renderer = new Renderer({ alpha: true, premultipliedAlpha: true, antialias: true });
  const gl = renderer.gl;
  gl.clearColor(0, 0, 0, 0);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.canvas.style.backgroundColor = 'transparent';
  gl.canvas.style.width = '100%';
  gl.canvas.style.height = '100%';

  const geometry = new Triangle(gl);
  if (geometry.attributes.uv) delete geometry.attributes.uv;

  const program = new Program(gl, {
    vertex: STRANDS_VERT,
    fragment: STRANDS_FRAG,
    uniforms: {
      uTime: { value: 0 },
      uResolution: { value: [ctn.offsetWidth, ctn.offsetHeight] },
      uColors: { value: buildStrandsPalette(colors) },
      uColorCount: { value: Math.min(colors.length, MAX_COLORS) },
      uStrandCount: { value: Math.min(count, MAX_STRANDS) },
      uSpeed: { value: speed },
      uAmplitude: { value: amplitude },
      uWaviness: { value: waviness },
      uThickness: { value: thickness },
      uGlow: { value: glow },
      uTaper: { value: taper },
      uSpread: { value: spread },
      uHueShift: { value: hueShift },
      uIntensity: { value: intensity },
      uOpacity: { value: opacity },
      uScale: { value: scale },
      uSaturation: { value: saturation }
    }
  });

  const mesh = new Mesh(gl, { geometry, program });
  const renderTarget = new RenderTarget(gl, { width: ctn.offsetWidth, height: ctn.offsetHeight });

  const glassProgram = new Program(gl, {
    vertex: STRANDS_VERT,
    fragment: STRANDS_GLASS_FRAG,
    uniforms: {
      uScene: { value: renderTarget.texture },
      uResolution: { value: [ctn.offsetWidth, ctn.offsetHeight] },
      uRadius: { value: 0.46 * glassSize },
      uRefraction: { value: refraction },
      uDispersion: { value: dispersion }
    }
  });
  const glassMesh = new Mesh(gl, { geometry, program: glassProgram });

  ctn.appendChild(gl.canvas);

  function resize() {
    if (!ctn) return;
    const width = ctn.offsetWidth || window.innerWidth;
    const height = ctn.offsetHeight || window.innerHeight;
    renderer.setSize(width, height);
    program.uniforms.uResolution.value = [width, height];
    renderTarget.setSize(width, height);
    glassProgram.uniforms.uResolution.value = [width, height];
  }
  window.addEventListener('resize', resize);
  resize();

  let animateId = 0;
  const update = t => {
    animateId = requestAnimationFrame(update);
    program.uniforms.uTime.value = t * 0.001;
    if (glass) {
      renderer.render({ scene: mesh, target: renderTarget });
      glassProgram.uniforms.uScene.value = renderTarget.texture;
      renderer.render({ scene: glassMesh });
    } else {
      renderer.render({ scene: mesh });
    }
  };
  animateId = requestAnimationFrame(update);

  return () => {
    cancelAnimationFrame(animateId);
    window.removeEventListener('resize', resize);
    if (ctn && gl.canvas.parentNode === ctn) {
      ctn.removeChild(gl.canvas);
    }
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  };
}


// ==========================================
// 2. SIDE RAYS COMPONENT
// ==========================================
const hexToRgb = hex => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255] : [1, 1, 1];
};

const originToFlip = origin => {
  switch (origin) {
    case 'top-left': return [1, 0];
    case 'bottom-right': return [0, 1];
    case 'bottom-left': return [1, 1];
    default: return [0, 0];
  }
};

function initSideRays(ctn, opts = {}) {
  const speed = opts.speed ?? 2.5;
  const rayColor1 = opts.rayColor1 || '#EAB308';
  const rayColor2 = opts.rayColor2 || '#96c8ff';
  const intensity = opts.intensity ?? 2;
  const spread = opts.spread ?? 2;
  const origin = opts.origin || 'top-right';
  const tilt = opts.tilt ?? 0;
  const saturation = opts.saturation ?? 1.5;
  const blend = opts.blend ?? 0.75;
  const falloff = opts.falloff ?? 1.6;
  const opacity = opts.opacity ?? 1.0;

  const renderer = new Renderer({
    dpr: Math.min(window.devicePixelRatio, 2),
    alpha: true
  });
  const gl = renderer.gl;
  gl.canvas.style.width = '100%';
  gl.canvas.style.height = '100%';
  ctn.appendChild(gl.canvas);

  const vert = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}`;

  const frag = `precision highp float;

uniform float iTime;
uniform vec2 iResolution;
uniform float iSpeed;
uniform vec3 iRayColor1;
uniform vec3 iRayColor2;
uniform float iIntensity;
uniform float iSpread;
uniform float iFlipX;
uniform float iFlipY;
uniform float iTilt;
uniform float iSaturation;
uniform float iBlend;
uniform float iFalloff;
uniform float iOpacity;

float rayStrength(vec2 raySource, vec2 rayRefDirection, vec2 coord, float seedA, float seedB, float speed) {
  vec2 sourceToCoord = coord - raySource;
  float cosAngle = dot(normalize(sourceToCoord), rayRefDirection);
  return clamp(
    (0.45 + 0.25 * sin(cosAngle * seedA + iTime * speed)) +
    (0.35 + 0.25 * cos(-cosAngle * seedB + iTime * speed)),
    0.0, 1.0) *
    clamp((iResolution.x * 2.5 - length(sourceToCoord)) / (iResolution.x * 2.5), 0.3, 1.0);
}

void main() {
  vec2 fragCoord = gl_FragCoord.xy;
  if (iFlipX > 0.5) fragCoord.x = iResolution.x - fragCoord.x;
  if (iFlipY > 0.5) fragCoord.y = iResolution.y - fragCoord.y;

  vec2 coord = vec2(fragCoord.x, iResolution.y - fragCoord.y);
  vec2 rayPos = vec2(iResolution.x * 1.1, -0.5 * iResolution.y);

  float tiltRad = iTilt * 3.14159265 / 180.0;
  float cs = cos(tiltRad);
  float sn = sin(tiltRad);
  vec2 rel = coord - rayPos;
  vec2 tiltedCoord = vec2(rel.x * cs - rel.y * sn, rel.x * sn + rel.y * cs) + rayPos;

  float halfSpread = iSpread * 0.45;
  vec2 rayRefDir1 = normalize(vec2(cos(0.785398 + halfSpread), sin(0.785398 + halfSpread)));
  vec2 rayRefDir2 = normalize(vec2(cos(0.785398 - halfSpread), sin(0.785398 - halfSpread)));

  vec4 rays1 = vec4(iRayColor1, 1.0) * rayStrength(rayPos, rayRefDir1, tiltedCoord, 36.2214, 21.11349, iSpeed);
  vec4 rays2 = vec4(iRayColor2, 1.0) * rayStrength(rayPos, rayRefDir2, tiltedCoord, 22.3991, 18.0234, iSpeed * 0.2);

  vec4 color = rays1 * (1.0 - iBlend) + rays2 * iBlend;

  float distanceToLight = length(fragCoord.xy - vec2(rayPos.x, iResolution.y - rayPos.y)) / iResolution.y;
  float brightness = iIntensity * 1.2 / pow(max(distanceToLight, 0.001), iFalloff);
  color.rgb *= brightness;

  float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
  color.rgb = mix(vec3(gray), color.rgb, iSaturation);

  color.a = clamp(max(color.r, max(color.g, color.b)) * iOpacity, 0.0, 1.0);
  gl_FragColor = color;
}`;

  const [flipX, flipY] = originToFlip(origin);
  const uniforms = {
    iTime: { value: 0 },
    iResolution: { value: [1, 1] },
    iSpeed: { value: speed },
    iRayColor1: { value: hexToRgb(rayColor1) },
    iRayColor2: { value: hexToRgb(rayColor2) },
    iIntensity: { value: intensity },
    iSpread: { value: spread },
    iFlipX: { value: flipX },
    iFlipY: { value: flipY },
    iTilt: { value: tilt },
    iSaturation: { value: saturation },
    iBlend: { value: blend },
    iFalloff: { value: falloff },
    iOpacity: { value: opacity }
  };

  const geometry = new Triangle(gl);
  const program = new Program(gl, { vertex: vert, fragment: frag, uniforms });
  const mesh = new Mesh(gl, { geometry, program });

  const updateSize = () => {
    if (!ctn || !renderer) return;
    renderer.dpr = Math.min(window.devicePixelRatio, 2);
    const w = ctn.clientWidth || window.innerWidth;
    const h = ctn.clientHeight || window.innerHeight;
    renderer.setSize(w, h);
    uniforms.iResolution.value = [w * renderer.dpr, h * renderer.dpr];
  };

  let animationId = null;
  const loop = t => {
    uniforms.iTime.value = t * 0.001;
    try {
      renderer.render({ scene: mesh });
      animationId = requestAnimationFrame(loop);
    } catch (e) {}
  };

  window.addEventListener('resize', updateSize);
  updateSize();
  animationId = requestAnimationFrame(loop);

  return () => {
    if (animationId) cancelAnimationFrame(animationId);
    window.removeEventListener('resize', updateSize);
    try {
      const loseCtx = renderer.gl.getExtension('WEBGL_lose_context');
      if (loseCtx) loseCtx.loseContext();
      if (gl.canvas && gl.canvas.parentNode) gl.canvas.parentNode.removeChild(gl.canvas);
    } catch (e) {}
  };
}


// ==========================================
// 3. PLASMA WAVE COMPONENT
// ==========================================
const PLASMA_VERT = /* glsl */ `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const PLASMA_FRAG = /* glsl */ `
precision mediump float;
uniform float iTime;
uniform vec2  iResolution;
uniform vec2  uOffset;
uniform float uRotation;
uniform float uFocalLength;
uniform float uSpeed1;
uniform float uSpeed2;
uniform float uDir2;
uniform float uBend1;
uniform float uBend2;
uniform vec3  uColor1;
uniform vec3  uColor2;

const float lt   = 0.3;
const float pi   = 3.14159;
const float pi2  = 6.28318;
const float pi_2 = 1.5708;
#define MAX_STEPS 14

void mainImage(out vec4 C, in vec2 U) {
  float t = iTime * pi;
  float s = 1.0;
  float d = 0.0;
  vec2  R = iResolution;

  vec3 o = vec3(0.0, 0.0, -7.0);
  vec3 u = normalize(vec3((U - 0.5 * R) / R.y, uFocalLength));
  vec2 k = vec2(0.0);
  vec3 p;

  float t1 = t * 0.7;
  float t2 = t * 0.9;
  float tSpeed1 = t * uSpeed1;
  float tSpeed2 = t * uSpeed2 * uDir2;

  for (int i = 0; i < MAX_STEPS; ++i) {
    p = o + u * d;
    p.x -= 15.0;

    float px = p.x;
    float wob1 = uBend1 + sin(t1 + px * 0.8) * 0.1;
    float wob2 = uBend2 + cos(t2 + px * 1.1) * 0.1;

    float px2 = px + pi_2;
    vec2 sinOffset = sin(vec2(px, px2) + tSpeed1) * wob1;
    vec2 cosOffset = cos(vec2(px, px2) + tSpeed2) * wob2;

    vec2 yz = p.yz;
    float pxLt = px + lt;
    k.x = max(pxLt, length(yz - sinOffset) - lt);
    k.y = max(pxLt, length(yz - cosOffset) - lt);

    float current = min(k.x, k.y);
    s = min(s, current);
    if (s < 0.001 || d > 300.0) break;
    d += s * 0.7;
  }

  float sqrtD = sqrt(d);
  vec3 raw = max(cos(d * pi2) - s * sqrtD - vec3(k, 0.0), 0.0);
  raw.gb += 0.1;
  float maxC = max(raw.r, max(raw.g, raw.b));
  if (maxC < 0.15) discard;
  raw = raw * 0.4 + raw.brg * 0.6 + raw * raw;
  float lum = dot(raw, vec3(0.299, 0.587, 0.114));
  float w1 = max(0.0, 1.0 - k.x * 2.0);
  float w2 = max(0.0, 1.0 - k.y * 2.0);
  float wt = w1 + w2 + 0.001;
  vec3 c = (uColor1 * w1 + uColor2 * w2) / wt * lum * 3.5;
  C = vec4(c, 1.0);
}

void main() {
  vec2 coord = gl_FragCoord.xy + uOffset;
  coord -= 0.5 * iResolution;
  float c = cos(uRotation), s = sin(uRotation);
  coord = mat2(c, -s, s, c) * coord;
  coord += 0.5 * iResolution;

  vec4 color;
  mainImage(color, coord);
  gl_FragColor = color;
}
`;

function initPlasmaWave(ctn, opts = {}) {
  const colors = opts.colors || ['#A855F7', '#06B6D4'];
  const speed1 = opts.speed1 ?? 0.05;
  const speed2 = opts.speed2 ?? 0.05;
  const dir2 = opts.dir2 ?? 1.0;
  const focalLength = opts.focalLength ?? 0.8;
  const bend1 = opts.bend1 ?? 1;
  const bend2 = opts.bend2 ?? 0.5;
  const rotationDeg = opts.rotationDeg ?? 0;
  const xOffset = opts.xOffset ?? 0;
  const yOffset = opts.yOffset ?? 0;

  const renderer = new Renderer({
    alpha: true,
    dpr: Math.min(window.devicePixelRatio, 1.5),
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
    powerPreference: 'high-performance'
  });

  const gl = renderer.gl;
  gl.clearColor(0, 0, 0, 0);
  gl.canvas.style.width = '100%';
  gl.canvas.style.height = '100%';
  ctn.appendChild(gl.canvas);

  const camera = new Camera(gl);
  const scene = new Transform();
  const geometry = new Geometry(gl, {
    position: { size: 2, data: new Float32Array([-1, -1, 3, -1, -1, 3]) }
  });

  const uniformOffset = new Float32Array([xOffset, yOffset]);
  const uniformResolution = new Float32Array([1, 1]);
  const c1 = hexToRgb(colors[0] || '#A855F7');
  const c2 = hexToRgb(colors[1] || '#06B6D4');

  const program = new Program(gl, {
    vertex: PLASMA_VERT,
    fragment: PLASMA_FRAG,
    uniforms: {
      iTime: { value: 0 },
      iResolution: { value: uniformResolution },
      uOffset: { value: uniformOffset },
      uRotation: { value: (rotationDeg * Math.PI) / 180 },
      uFocalLength: { value: focalLength },
      uSpeed1: { value: speed1 },
      uSpeed2: { value: speed2 },
      uDir2: { value: dir2 },
      uBend1: { value: bend1 },
      uBend2: { value: bend2 },
      uColor1: { value: c1 },
      uColor2: { value: c2 }
    }
  });

  new Mesh(gl, { geometry, program }).setParent(scene);

  function resize() {
    if (!ctn) return;
    const { width, height } = ctn.getBoundingClientRect();
    const w = width || window.innerWidth;
    const h = height || window.innerHeight;
    renderer.setSize(w, h);
    uniformResolution[0] = w * renderer.dpr;
    uniformResolution[1] = h * renderer.dpr;
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  }

  const ro = new ResizeObserver(resize);
  ro.observe(ctn);
  resize();

  const startTime = performance.now();
  let animateId;

  const update = now => {
    program.uniforms.iTime.value = (now - startTime) * 0.001;
    renderer.render({ scene, camera });
    animateId = requestAnimationFrame(update);
  };

  animateId = requestAnimationFrame(update);

  return () => {
    cancelAnimationFrame(animateId);
    ro.disconnect();
    if (ctn && gl.canvas.parentNode === ctn) {
      ctn.removeChild(gl.canvas);
    }
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  };
}


// ==========================================
// 4. FERROFLUID COMPONENT
// ==========================================
const FERRO_VERT = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FERRO_FRAG = `
precision highp float;

uniform vec3  iResolution;
uniform vec2  iMouse;
uniform float iTime;

uniform vec3  uColor0;
uniform vec3  uColor1;
uniform vec3  uColor2;
uniform vec3  uColor3;
uniform vec3  uColor4;
uniform vec3  uColor5;
uniform vec3  uColor6;
uniform vec3  uColor7;
uniform int   uColorCount;

uniform vec3  uMouseColor;
uniform vec2  uFlow;
uniform float uSpeed;
uniform float uScale;
uniform float uTurbulence;
uniform float uFluidity;
uniform float uRimWidth;
uniform float uSharpness;
uniform float uShimmer;
uniform float uGlow;
uniform float uOpacity;
uniform float uMouseEnabled;
uniform float uMouseStrength;
uniform float uMouseRadius;

varying vec2 vUv;

#define PI 3.14159265

vec3 palette(float h) {
  int count = uColorCount;
  if (count < 1) count = 1;
  int idx = int(floor(clamp(h, 0.0, 0.999999) * float(count)));
  if (idx <= 0) return uColor0;
  if (idx == 1) return uColor1;
  if (idx == 2) return uColor2;
  if (idx == 3) return uColor3;
  if (idx == 4) return uColor4;
  if (idx == 5) return uColor5;
  if (idx == 6) return uColor6;
  return uColor7;
}

float hash(vec3 p3) {
  p3 = fract(p3 * 0.1031);
  p3 += dot(p3, p3.zyx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float smin(float a, float b, float k) {
  float r = exp2(-a / k) + exp2(-b / k);
  return -k * log2(r);
}

float sinlerp(float a, float b, float w) {
  return mix(a, b, (sin(w * PI - PI / 2.0) + 1.0) / 2.0);
}

float vn(vec2 p, float s, float seed) {
  vec2 cellp = floor(p / s);
  vec2 relp = mod(p, s);
  float g1 = hash(vec3(cellp, seed));
  float g2 = hash(vec3(cellp.x + 1.0, cellp.y, seed));
  float g3 = hash(vec3(cellp.x + 1.0, cellp.y + 1.0, seed));
  float g4 = hash(vec3(cellp.x, cellp.y + 1.0, seed));
  float bx = sinlerp(g1, g2, relp.x / s);
  float tx = sinlerp(g4, g3, relp.x / s);
  return sinlerp(bx, tx, relp.y / s);
}

float dbn(vec2 p, float s, float seed) {
  float o = s / 2.0;
  float n0 = vn(p, s, seed);
  float n1 = vn(p + vec2(o, o), s, seed + 0.1);
  float n2 = vn(p + vec2(-o, o), s, seed + 0.2);
  float n3 = vn(p + vec2(o, -o), s, seed + 0.3);
  float n4 = vn(p + vec2(-o, -o), s, seed + 0.4);
  return (2.0 * n0 + 1.5 * n1 + 1.25 * n2 + 1.125 * n3 + n4) / 7.0;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  float ref = 700.0 / max(uScale, 0.05);
  vec2 p = fragCoord / iResolution.y * ref;

  float spd = 200.0 * uSpeed;
  float t = iTime;

  vec2 dir = uFlow;
  vec2 perp = vec2(-dir.y, dir.x);

  float distort1 = vn(p + perp * (t * spd), 60.0, 10.0) * 50.0 * uTurbulence;
  float distort2 = vn(p - perp * (t * spd), 120.0, 15.0) * 100.0 * uTurbulence;

  float peaks = dbn(p + distort1 + dir * (t * spd * 0.5), 40.0, 1.0);
  float peaks2 = dbn(p + distort2 - dir * (t * spd * 0.5), 40.0, 0.0);

  float mapeaks = smin(peaks, peaks2, max(uFluidity, 0.001));

  float mGlow = 0.0;
  if (uMouseEnabled > 0.5) {
    vec2 mp = iMouse / iResolution.y * ref;
    float md = length(p - mp) / ref;
    float rr = max(uMouseRadius, 0.02);
    mGlow = exp(-md * md / (rr * rr)) * uMouseStrength;
  }

  float band = (uRimWidth - abs((mapeaks - 0.4) * 2.0)) * 5.0;
  float ltn = clamp(band - vn(p + dir * (t * spd * 0.5), 60.0, 12.0) * uShimmer, 0.0, 1.0);
  ltn = pow(ltn, uSharpness) * uGlow;
  ltn *= clamp(1.0 - mGlow, 0.0, 1.0);

  float h = clamp(0.5 + (peaks - peaks2) * 0.8, 0.0, 1.0);
  vec3 col = palette(h);

  vec3 outc = col * ltn;
  float a = clamp(max(outc.r, max(outc.g, outc.b)), 0.0, 1.0);
  fragColor = vec4(outc, a * uOpacity);
}

void main() {
  vec4 color;
  mainImage(color, vUv * iResolution.xy);
  gl_FragColor = color;
}
`;

function prepFerroColors(input) {
  const base = (input && input.length ? input : ['#ffffff', '#ffffff', '#ffffff']).slice(0, MAX_COLORS);
  const count = base.length;
  const arr = [];
  for (let i = 0; i < MAX_COLORS; i++) {
    const c = base[Math.min(i, base.length - 1)].replace('#', '').padEnd(6, '0');
    arr.push([
      parseInt(c.slice(0, 2), 16) / 255,
      parseInt(c.slice(2, 4), 16) / 255,
      parseInt(c.slice(4, 6), 16) / 255
    ]);
  }
  const avg = [0, 0, 0];
  for (let i = 0; i < count; i++) {
    avg[0] += arr[i][0];
    avg[1] += arr[i][1];
    avg[2] += arr[i][2];
  }
  avg[0] /= count; avg[1] /= count; avg[2] /= count;
  return { arr, count, avg };
}

function initFerrofluid(ctn, opts = {}) {
  const colors = opts.colors || ['#ffffff', '#ffffff', '#ffffff'];
  const speed = opts.speed ?? 0.5;
  const scale = opts.scale ?? 1;
  const turbulence = opts.turbulence ?? 1;
  const fluidity = opts.fluidity ?? 0.1;
  const rimWidth = opts.rimWidth ?? 0.2;
  const sharpness = opts.sharpness ?? 3;
  const shimmer = opts.shimmer ?? 1;
  const glow = opts.glow ?? 2;
  const flowDirection = opts.flowDirection || 'down';
  const opacity = opts.opacity ?? 1;
  const mouseInteraction = opts.mouseInteraction ?? true;
  const mouseStrength = opts.mouseStrength ?? 1;
  const mouseRadius = opts.mouseRadius ?? 0.3;
  const mouseDampening = opts.mouseDampening ?? 0.15;

  const renderer = new Renderer({
    dpr: window.devicePixelRatio || 1,
    alpha: true,
    antialias: true
  });
  const gl = renderer.gl;
  const canvas = gl.canvas;
  gl.clearColor(0, 0, 0, 0);
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';
  ctn.appendChild(canvas);

  const { arr, count, avg } = prepFerroColors(colors);
  const flowVec = d => {
    switch (d) {
      case 'up': return [0, 1];
      case 'down': return [0, -1];
      case 'left': return [-1, 0];
      case 'right': return [1, 0];
      default: return [0, -1];
    }
  };

  const uniforms = {
    iResolution: { value: [gl.drawingBufferWidth, gl.drawingBufferHeight, 1] },
    iMouse: { value: [0, 0] },
    iTime: { value: 0 },
    uColor0: { value: arr[0] }, uColor1: { value: arr[1] }, uColor2: { value: arr[2] }, uColor3: { value: arr[3] },
    uColor4: { value: arr[4] }, uColor5: { value: arr[5] }, uColor6: { value: arr[6] }, uColor7: { value: arr[7] },
    uColorCount: { value: count },
    uMouseColor: { value: avg },
    uFlow: { value: flowVec(flowDirection) },
    uSpeed: { value: speed },
    uScale: { value: scale },
    uTurbulence: { value: turbulence },
    uFluidity: { value: fluidity },
    uRimWidth: { value: rimWidth },
    uSharpness: { value: sharpness },
    uShimmer: { value: shimmer },
    uGlow: { value: glow },
    uOpacity: { value: opacity },
    uMouseEnabled: { value: mouseInteraction ? 1 : 0 },
    uMouseStrength: { value: mouseStrength },
    uMouseRadius: { value: mouseRadius }
  };

  const program = new Program(gl, { vertex: FERRO_VERT, fragment: FERRO_FRAG, uniforms });
  const geometry = new Triangle(gl);
  const mesh = new Mesh(gl, { geometry, program });

  const resize = () => {
    const rect = ctn.getBoundingClientRect();
    const w = rect.width || window.innerWidth;
    const h = rect.height || window.innerHeight;
    renderer.setSize(w, h);
    uniforms.iResolution.value = [gl.drawingBufferWidth, gl.drawingBufferHeight, 1];
  };

  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(ctn);

  const mouseTargetRef = [0, 0];
  let lastTime = 0;

  const onPointerMove = e => {
    const rect = canvas.getBoundingClientRect();
    const sc = renderer.dpr || 1;
    const x = (e.clientX - rect.left) * sc;
    const y = (rect.height - (e.clientY - rect.top)) * sc;
    mouseTargetRef[0] = x;
    mouseTargetRef[1] = y;
    if (mouseDampening <= 0) {
      uniforms.iMouse.value = [x, y];
    }
  };

  if (mouseInteraction) {
    window.addEventListener('pointermove', onPointerMove);
  }

  let rafId;
  const loop = t => {
    rafId = requestAnimationFrame(loop);
    uniforms.iTime.value = t * 0.001;
    if (mouseDampening > 0) {
      if (!lastTime) lastTime = t;
      const dt = (t - lastTime) / 1000;
      lastTime = t;
      const tau = Math.max(1e-4, mouseDampening);
      let factor = 1 - Math.exp(-dt / tau);
      if (factor > 1) factor = 1;
      const cur = uniforms.iMouse.value;
      cur[0] += (mouseTargetRef[0] - cur[0]) * factor;
      cur[1] += (mouseTargetRef[1] - cur[1]) * factor;
    } else {
      lastTime = t;
    }
    try {
      renderer.render({ scene: mesh });
    } catch (e) {}
  };

  rafId = requestAnimationFrame(loop);

  return () => {
    if (rafId) cancelAnimationFrame(rafId);
    if (mouseInteraction) window.removeEventListener('pointermove', onPointerMove);
    ro.disconnect();
    if (canvas.parentElement === ctn) ctn.removeChild(canvas);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  };
}


// ==========================================
// 5. SOFT AURORA COMPONENT
// ==========================================
const AURORA_VERT = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const AURORA_FRAG = `
precision highp float;

uniform float uTime;
uniform vec3 uResolution;
uniform float uSpeed;
uniform float uScale;
uniform float uBrightness;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform float uNoiseFreq;
uniform float uNoiseAmp;
uniform float uBandHeight;
uniform float uBandSpread;
uniform float uOctaveDecay;
uniform float uLayerOffset;
uniform float uColorSpeed;
uniform vec2 uMouse;
uniform float uMouseInfluence;
uniform bool uEnableMouse;

varying vec2 vUv;

#define TAU 6.28318

vec3 gradientHash(vec3 p) {
  p = vec3(
    dot(p, vec3(127.1, 311.7, 234.6)),
    dot(p, vec3(269.5, 183.3, 198.3)),
    dot(p, vec3(169.5, 283.3, 156.9))
  );
  vec3 h = fract(sin(p) * 43758.5453123);
  float phi = acos(2.0 * h.x - 1.0);
  float theta = TAU * h.y;
  return vec3(cos(theta) * sin(phi), sin(theta) * sin(phi), cos(phi));
}

float perlinNoise3D(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);

  return mix(
    mix(
      mix(dot(gradientHash(i + vec3(0,0,0)), f - vec3(0,0,0)),
          dot(gradientHash(i + vec3(1,0,0)), f - vec3(1,0,0)), u.x),
      mix(dot(gradientHash(i + vec3(0,1,0)), f - vec3(0,1,0)),
          dot(gradientHash(i + vec3(1,1,0)), f - vec3(1,1,0)), u.x), u.y),
    mix(
      mix(dot(gradientHash(i + vec3(0,0,1)), f - vec3(0,0,1)),
          dot(gradientHash(i + vec3(1,0,1)), f - vec3(1,0,1)), u.x),
      mix(dot(gradientHash(i + vec3(0,1,1)), f - vec3(0,1,1)),
          dot(gradientHash(i + vec3(1,1,1)), f - vec3(1,1,1)), u.x), u.y), u.z);
}

float fbm(vec3 p) {
  float val = 0.0;
  float amp = uNoiseAmp;
  float freq = uNoiseFreq;
  for (int i = 0; i < 4; i++) {
    val += amp * perlinNoise3D(p * freq);
    freq *= 2.0;
    amp *= uOctaveDecay;
  }
  return val;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  vec2 st = (gl_FragCoord.xy - 0.5 * uResolution.xy) / uResolution.y;
  
  if (uEnableMouse) {
    st += (uMouse - 0.5) * uMouseInfluence;
  }

  float t = uTime * uSpeed;

  vec3 p1 = vec3(st * uScale, t * 0.2);
  float n1 = fbm(p1);

  vec3 p2 = vec3(st * uScale + vec2(1.7, 9.2), t * 0.2 + uLayerOffset);
  float n2 = fbm(p2);

  float dist1 = abs(st.y - (uBandHeight - 0.5) + n1 * 0.3);
  float dist2 = abs(st.y - (uBandHeight - 0.5) + n2 * 0.3);

  float aurora1 = smoothstep(uBandSpread, 0.0, dist1);
  float aurora2 = smoothstep(uBandSpread, 0.0, dist2);

  vec3 col1 = mix(uColor1, uColor2, sin(t * uColorSpeed) * 0.5 + 0.5);
  vec3 col2 = mix(uColor2, uColor1, cos(t * uColorSpeed) * 0.5 + 0.5);

  vec3 finalColor = col1 * aurora1 + col2 * aurora2;
  finalColor *= uBrightness;

  float alpha = clamp(aurora1 + aurora2, 0.0, 1.0);
  gl_FragColor = vec4(finalColor, alpha);
}
`;

function initSoftAurora(ctn, opts = {}) {
  const speed = opts.speed ?? 0.6;
  const scale = opts.scale ?? 1.5;
  const brightness = opts.brightness ?? 1.0;
  const color1 = opts.color1 || '#f7f7f7';
  const color2 = opts.color2 || '#e100ff';
  const noiseFreq = opts.noiseFrequency ?? 2.5;
  const noiseAmp = opts.noiseAmplitude ?? 1.0;
  const bandHeight = opts.bandHeight ?? 0.5;
  const bandSpread = opts.bandSpread ?? 1.0;
  const octaveDecay = opts.octaveDecay ?? 0.1;
  const layerOffset = opts.layerOffset ?? 0;
  const colorSpeed = opts.colorSpeed ?? 1.0;
  const enableMouse = opts.enableMouseInteraction ?? true;
  const mouseInfluence = opts.mouseInfluence ?? 0.25;

  const renderer = new Renderer({
    dpr: Math.min(window.devicePixelRatio, 2),
    alpha: true
  });
  const gl = renderer.gl;
  gl.canvas.style.width = '100%';
  gl.canvas.style.height = '100%';
  ctn.appendChild(gl.canvas);

  const uniforms = {
    uTime: { value: 0 },
    uResolution: { value: [gl.drawingBufferWidth, gl.drawingBufferHeight, 1] },
    uSpeed: { value: speed },
    uScale: { value: scale },
    uBrightness: { value: brightness },
    uColor1: { value: hexToRgb(color1) },
    uColor2: { value: hexToRgb(color2) },
    uNoiseFreq: { value: noiseFreq },
    uNoiseAmp: { value: noiseAmp },
    uBandHeight: { value: bandHeight },
    uBandSpread: { value: bandSpread },
    uOctaveDecay: { value: octaveDecay },
    uLayerOffset: { value: layerOffset },
    uColorSpeed: { value: colorSpeed },
    uMouse: { value: [0.5, 0.5] },
    uMouseInfluence: { value: mouseInfluence },
    uEnableMouse: { value: enableMouse }
  };

  const program = new Program(gl, { vertex: AURORA_VERT, fragment: AURORA_FRAG, uniforms });
  const geometry = new Triangle(gl);
  const mesh = new Mesh(gl, { geometry, program });

  const resize = () => {
    const w = ctn.clientWidth || window.innerWidth;
    const h = ctn.clientHeight || window.innerHeight;
    renderer.setSize(w, h);
    uniforms.uResolution.value = [w * renderer.dpr, h * renderer.dpr, 1];
  };
  resize();
  window.addEventListener('resize', resize);

  const onPointerMove = e => {
    uniforms.uMouse.value[0] = e.clientX / window.innerWidth;
    uniforms.uMouse.value[1] = 1.0 - (e.clientY / window.innerHeight);
  };
  if (enableMouse) {
    window.addEventListener('pointermove', onPointerMove);
  }

  let rafId;
  const loop = t => {
    rafId = requestAnimationFrame(loop);
    uniforms.uTime.value = t * 0.001;
    try {
      renderer.render({ scene: mesh });
    } catch (e) {}
  };
  rafId = requestAnimationFrame(loop);

  return () => {
    if (rafId) cancelAnimationFrame(rafId);
    window.removeEventListener('resize', resize);
    if (enableMouse) window.removeEventListener('pointermove', onPointerMove);
    if (ctn && gl.canvas.parentNode === ctn) ctn.removeChild(canvas);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  };
}


// ==========================================
// 6. DITHER COMPONENT
// ==========================================
const DITHER_WAVE_VERT = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const DITHER_WAVE_FRAG = `
precision highp float;
uniform vec2 resolution;
uniform float time;
uniform float waveSpeed;
uniform float waveFrequency;
uniform float waveAmplitude;
uniform vec3 waveColor;
uniform vec2 mousePos;
uniform int enableMouseInteraction;
uniform float mouseRadius;

varying vec2 vUv;

vec4 mod289(vec4 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
vec2 fade(vec2 t) { return t*t*t*(t*(t*6.0-15.0)+10.0); }

float cnoise(vec2 P) {
  vec4 Pi = floor(P.xyxy) + vec4(0.0,0.0,1.0,1.0);
  vec4 Pf = fract(P.xyxy) - vec4(0.0,0.0,1.0,1.0);
  Pi = mod289(Pi);
  vec4 ix = Pi.xzxz;
  vec4 iy = Pi.yyww;
  vec4 fx = Pf.xzxz;
  vec4 fy = Pf.yyww;
  vec4 i = permute(permute(ix) + iy);
  vec4 gx = fract(i * (1.0/41.0)) * 2.0 - 1.0;
  vec4 gy = abs(gx) - 0.5;
  vec4 tx = floor(gx + 0.5);
  gx = gx - tx;
  vec2 g00 = vec2(gx.x, gy.x);
  vec2 g10 = vec2(gx.y, gy.y);
  vec2 g01 = vec2(gx.z, gy.z);
  vec2 g11 = vec2(gx.w, gy.w);
  vec4 norm = taylorInvSqrt(vec4(dot(g00,g00), dot(g01,g01), dot(g10,g10), dot(g11,g11)));
  g00 *= norm.x; g01 *= norm.y; g10 *= norm.z; g11 *= norm.w;
  float n00 = dot(g00, vec2(fx.x, fy.x));
  float n10 = dot(g10, vec2(fx.y, fy.y));
  float n01 = dot(g01, vec2(fx.z, fy.z));
  float n11 = dot(g11, vec2(fx.w, fy.w));
  vec2 fade_xy = fade(Pf.xy);
  vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
  return 2.3 * mix(n_x.x, n_x.y, fade_xy.y);
}

const int OCTAVES = 4;
float fbm(vec2 p) {
  float value = 0.0;
  float amp = 1.0;
  float freq = waveFrequency;
  for (int i = 0; i < OCTAVES; i++) {
    value += amp * abs(cnoise(p));
    p *= freq;
    amp *= waveAmplitude;
  }
  return value;
}

float pattern(vec2 p) {
  vec2 p2 = p - time * waveSpeed;
  return fbm(p + fbm(p2)); 
}

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  uv -= 0.5;
  uv.x *= resolution.x / resolution.y;
  float f = pattern(uv);
  if (enableMouseInteraction == 1) {
    vec2 mouseNDC = (mousePos / resolution - 0.5) * vec2(1.0, -1.0);
    mouseNDC.x *= resolution.x / resolution.y;
    float dist = length(uv - mouseNDC);
    float effect = 1.0 - smoothstep(0.0, mouseRadius, dist);
    f -= 0.5 * effect;
  }
  vec3 col = mix(vec3(0.0), waveColor, f);
  gl_FragColor = vec4(col, 1.0);
}
`;

const DITHER_SCREEN_FRAG = `
precision highp float;
uniform sampler2D tDiffuse;
uniform vec2 resolution;
uniform float colorNum;
uniform float pixelSize;

varying vec2 vUv;

float bayer4x4(vec2 p) {
  vec4 m0 = vec4( 0.0,  8.0,  2.0, 10.0) / 16.0;
  vec4 m1 = vec4(12.0,  4.0, 14.0,  6.0) / 16.0;
  vec4 m2 = vec4( 3.0, 11.0,  1.0,  9.0) / 16.0;
  vec4 m3 = vec4(15.0,  7.0, 13.0,  5.0) / 16.0;
  int x = int(mod(p.x, 4.0));
  int y = int(mod(p.y, 4.0));
  if (y == 0) return (x==0?m0.x:(x==1?m0.y:(x==2?m0.z:m0.w)));
  if (y == 1) return (x==0?m1.x:(x==1?m1.y:(x==2?m1.z:m1.w)));
  if (y == 2) return (x==0?m2.x:(x==1?m2.y:(x==2?m2.z:m2.w)));
  return (x==0?m3.x:(x==1?m3.y:(x==2?m3.z:m3.w)));
}

float bayer8x8(vec2 p) {
  vec2 p4 = floor(p * 0.5);
  float b4 = bayer4x4(p4);
  vec2 p2 = mod(p, 2.0);
  float b2 = (p2.y > 0.5) ? ((p2.x > 0.5) ? 0.75 : 0.25) : ((p2.x > 0.5) ? 0.5 : 0.0);
  return b4 * 0.75 + b2 * 0.25;
}

vec3 dither(vec2 uv, vec3 color) {
  vec2 scaledCoord = floor(uv * resolution / pixelSize);
  float threshold = bayer8x8(scaledCoord) - 0.25;
  float step = 1.0 / (colorNum - 1.0);
  color += threshold * step;
  color = clamp(color, 0.0, 1.0);
  return floor(color * (colorNum - 1.0) + 0.5) / (colorNum - 1.0);
}

void main() {
  vec2 normalizedPixelSize = pixelSize / resolution;
  vec2 uvPixel = normalizedPixelSize * floor(vUv / normalizedPixelSize);
  vec4 color = texture2D(tDiffuse, uvPixel);
  color.rgb = dither(vUv, color.rgb);
  gl_FragColor = color;
}
`;

function initDither(ctn, opts = {}) {
  const waveSpeed = opts.waveSpeed ?? 0.05;
  const waveFrequency = opts.waveFrequency ?? 3;
  const waveAmplitude = opts.waveAmplitude ?? 0.3;
  const waveColor = opts.waveColor || [0.5, 0.5, 0.5];
  const colorNum = opts.colorNum ?? 4;
  const pixelSize = opts.pixelSize ?? 2;
  const enableMouse = opts.enableMouseInteraction ?? true;
  const mouseRadius = opts.mouseRadius ?? 0.3;

  const renderer = new Renderer({ alpha: true, antialias: true });
  const gl = renderer.gl;
  gl.canvas.style.width = '100%';
  gl.canvas.style.height = '100%';
  ctn.appendChild(gl.canvas);

  const geometry = new Triangle(gl);

  const waveProgram = new Program(gl, {
    vertex: DITHER_WAVE_VERT,
    fragment: DITHER_WAVE_FRAG,
    uniforms: {
      time: { value: 0 },
      resolution: { value: [ctn.offsetWidth, ctn.offsetHeight] },
      waveSpeed: { value: waveSpeed },
      waveFrequency: { value: waveFrequency },
      waveAmplitude: { value: waveAmplitude },
      waveColor: { value: waveColor },
      mousePos: { value: [0, 0] },
      enableMouseInteraction: { value: enableMouse ? 1 : 0 },
      mouseRadius: { value: mouseRadius }
    }
  });

  const waveMesh = new Mesh(gl, { geometry, program: waveProgram });
  const renderTarget = new RenderTarget(gl, { width: ctn.offsetWidth, height: ctn.offsetHeight });

  const ditherProgram = new Program(gl, {
    vertex: DITHER_WAVE_VERT,
    fragment: DITHER_SCREEN_FRAG,
    uniforms: {
      tDiffuse: { value: renderTarget.texture },
      resolution: { value: [ctn.offsetWidth, ctn.offsetHeight] },
      colorNum: { value: colorNum },
      pixelSize: { value: pixelSize }
    }
  });

  const ditherMesh = new Mesh(gl, { geometry, program: ditherProgram });

  function resize() {
    const w = ctn.offsetWidth || window.innerWidth;
    const h = ctn.offsetHeight || window.innerHeight;
    renderer.setSize(w, h);
    renderTarget.setSize(w, h);
    waveProgram.uniforms.resolution.value = [w, h];
    ditherProgram.uniforms.resolution.value = [w, h];
  }
  window.addEventListener('resize', resize);
  resize();

  const onPointerMove = e => {
    const rect = gl.canvas.getBoundingClientRect();
    waveProgram.uniforms.mousePos.value = [(e.clientX - rect.left), (e.clientY - rect.top)];
  };
  if (enableMouse) {
    window.addEventListener('pointermove', onPointerMove);
  }

  let rafId;
  const loop = t => {
    rafId = requestAnimationFrame(loop);
    waveProgram.uniforms.time.value = t * 0.001;
    try {
      renderer.render({ scene: waveMesh, target: renderTarget });
      ditherProgram.uniforms.tDiffuse.value = renderTarget.texture;
      renderer.render({ scene: ditherMesh });
    } catch (e) {}
  };
  rafId = requestAnimationFrame(loop);

  return () => {
    if (rafId) cancelAnimationFrame(rafId);
    window.removeEventListener('resize', resize);
    if (enableMouse) window.removeEventListener('pointermove', onPointerMove);
    if (ctn && gl.canvas.parentNode === ctn) ctn.removeChild(gl.canvas);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  };
}


// ==========================================
// 7. DARK VEIL COMPONENT
// ==========================================
const VEIL_VERT = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const VEIL_FRAG = `
precision highp float;
uniform vec2 uResolution;
uniform float uTime;
uniform float uHueShift;
uniform float uNoise;
uniform float uScan;
uniform float uScanFreq;
uniform float uWarp;

varying vec2 vUv;

#define iTime uTime
#define iResolution uResolution

vec4 buf[8];
float rand(vec2 c){return fract(sin(dot(c,vec2(12.9898,78.233)))*43758.5453);}

mat3 rgb2yiq=mat3(0.299,0.587,0.114,0.596,-0.274,-0.322,0.211,-0.523,0.312);
mat3 yiq2rgb=mat3(1.0,0.956,0.621,1.0,-0.272,-0.647,1.0,-1.106,1.703);

vec3 hueShiftRGB(vec3 col,float deg){
    vec3 yiq=rgb2yiq*col;
    float rad=radians(deg);
    float cosh=cos(rad),sinh=sin(rad);
    vec3 yiqShift=vec3(yiq.x,yiq.y*cosh-yiq.z*sinh,yiq.y*sinh+yiq.z*cosh);
    return clamp(yiq2rgb*yiqShift,0.0,1.0);
}

vec4 sigmoid(vec4 x){return 1./(1.+exp(-x));}

vec4 cppn_fn(vec2 coordinate,float in0,float in1,float in2){
    buf[6]=vec4(coordinate.x,coordinate.y,0.3948333106474662+in0,0.36+in1);
    buf[7]=vec4(0.14+in2,sqrt(coordinate.x*coordinate.x+coordinate.y*coordinate.y),0.,0.);
    buf[0]=mat4(vec4(6.5404263,-3.6126034,0.7590882,-1.13613),vec4(2.4582713,3.1660357,1.2219609,0.06276096),vec4(-5.478085,-6.159632,1.8701609,-4.7742867),vec4(6.039214,-5.542865,-0.90925294,3.251348))*buf[6]+mat4(vec4(0.8473259,-5.722911,3.975766,1.6522468),vec4(-0.24321538,0.5839259,-1.7661959,-5.350116),vec4(0.,0.,0.,0.),vec4(0.,0.,0.,0.))*buf[7]+vec4(0.21808943,1.1243913,-1.7969975,5.0294676);
    buf[1]=mat4(vec4(-3.3522482,-6.0612736,0.55641043,-4.4719114),vec4(0.8631464,1.7432913,5.643898,1.6106541),vec4(2.4941394,-3.5012043,1.7184316,6.357333),vec4(3.310376,8.209261,1.1355612,-1.165539))*buf[6]+mat4(vec4(5.24046,-13.034365,0.009859298,15.870829),vec4(2.987511,3.129433,-0.89023495,-1.6822904),vec4(0.,0.,0.,0.),vec4(0.,0.,0.,0.))*buf[7]+vec4(-5.9457836,-6.573602,-0.8812491,1.5436668);
    buf[0]=sigmoid(buf[0]);buf[1]=sigmoid(buf[1]);
    buf[2]=mat4(vec4(-15.219568,8.095543,-2.429353,-1.9381982),vec4(-5.951362,4.3115187,2.6393783,1.274315),vec4(-7.3145227,6.7297835,5.2473326,5.9411426),vec4(5.0796127,8.979051,-1.7278991,-1.158976))*buf[6]+mat4(vec4(-11.967154,-11.608155,6.1486754,11.237008),vec4(2.124141,-6.263192,-1.7050359,-0.7021966),vec4(0.,0.,0.,0.),vec4(0.,0.,0.,0.))*buf[7]+vec4(-4.17164,-3.2281182,-4.576417,-3.6401186);
    buf[3]=mat4(vec4(3.1832156,-13.738922,1.879223,3.233465),vec4(0.64300746,12.768129,1.9141049,0.50990224),vec4(-0.049295485,4.4807224,1.4733979,1.801449),vec4(5.0039253,13.000481,3.3991797,-4.5561905))*buf[6]+mat4(vec4(-0.1285731,7.720628,-3.1425676,4.742367),vec4(0.6393625,3.714393,-0.8108378,-0.39174938),vec4(0.,0.,0.,0.),vec4(0.,0.,0.,0.))*buf[7]+vec4(-1.1811101,-21.621881,0.7851888,1.2329718);
    buf[2]=sigmoid(buf[2]);buf[3]=sigmoid(buf[3]);
    buf[4]=mat4(vec4(5.214916,-7.183024,2.7228765,2.6592617),vec4(-5.601878,-25.3591,4.067988,0.4602802),vec4(-10.57759,24.286327,21.102104,37.546658),vec4(4.3024497,-1.9625226,2.3458803,-1.372816))*buf[0]+mat4(vec4(-17.6526,-10.507558,2.2587414,12.462782),vec4(6.265566,-502.75443,-12.642513,0.9112289),vec4(-10.983244,20.741234,-9.701768,-0.7635988),vec4(5.383626,1.4819539,-4.1911616,-4.8444734))*buf[1]+mat4(vec4(12.785233,-16.345072,-0.39901125,1.7955981),vec4(-30.48365,-1.8345358,1.4542528,-1.1118771),vec4(19.872723,-7.337935,-42.941723,-98.52709),vec4(8.337645,-2.7312303,-2.2927687,-36.142323))*buf[2]+mat4(vec4(-16.298317,3.5471997,-0.44300047,-9.444417),vec4(57.5077,-35.609753,16.163465,-4.1534753),vec4(-0.07470326,-3.8656476,-7.0901804,3.1523974),vec4(-12.559385,-7.077619,1.490437,-0.8211543))*buf[3]+vec4(-7.67914,15.927437,1.3207729,-1.6686112);
    buf[5]=mat4(vec4(-1.4109162,-0.372762,-3.770383,-21.367174),vec4(-6.2103205,-9.35908,0.92529047,8.82561),vec4(11.460242,-22.348068,13.625772,-18.693201),vec4(-0.3429052,-3.9905605,-2.4626114,-0.45033523))*buf[0]+mat4(vec4(7.3481627,-4.3661838,-6.3037653,-3.868115),vec4(1.5462853,6.5488915,1.9701879,-0.58291394),vec4(6.5858274,-2.2180402,3.7127688,-1.3730392),vec4(-5.7973905,10.134961,-2.3395722,-5.965605))*buf[1]+mat4(vec4(-2.5132585,-6.6685553,-1.4029363,-0.16285264),vec4(-0.37908727,0.53738135,4.389061,-1.3024765),vec4(-0.70647055,2.0111287,-5.1659346,-3.728635),vec4(-13.562562,10.487719,-0.9173751,-2.6487076))*buf[2]+mat4(vec4(-8.645013,6.5546675,-6.3944063,-5.5933375),vec4(-0.57783127,-1.077275,36.91025,5.736769),vec4(14.283112,3.7146652,7.1452246,-4.5958776),vec4(2.7192075,3.6021907,-4.366337,-2.3653464))*buf[3]+vec4(-5.9000807,-4.329569,1.2427121,8.59503);
    buf[4]=sigmoid(buf[4]);buf[5]=sigmoid(buf[5]);
    buf[6]=mat4(vec4(-1.61102,0.7970257,1.4675229,0.20917463),vec4(-28.793737,-7.1390953,1.5025433,4.656581),vec4(-10.94861,39.66238,0.74318546,-10.095605),vec4(-0.7229728,-1.5483948,0.7301322,2.1687684))*buf[0]+mat4(vec4(3.2547753,21.489103,-1.0194173,-3.3100595),vec4(-3.7316632,-3.3792162,-7.223193,-0.23685838),vec4(13.1804495,0.7916005,5.338587,5.687114),vec4(-4.167605,-17.798311,-6.815736,-1.6451967))*buf[1]+mat4(vec4(0.604885,-7.800309,-7.213122,-2.741014),vec4(-3.522382,-0.12359311,-0.5258442,0.43852118),vec4(9.6752825,-22.853785,2.062431,0.099892326),vec4(-4.3196306,-17.730087,2.5184598,5.30267))*buf[2]+mat4(vec4(-6.545563,-15.790176,-6.0438633,-5.415399),vec4(-43.591583,28.551912,-16.00161,18.84728),vec4(4.212382,8.394307,3.0958717,8.657522),vec4(-5.0237565,-4.450633,-4.4768,-5.5010443))*buf[3]+mat4(vec4(1.6985557,-67.05806,6.897715,1.9004834),vec4(1.8680354,2.3915145,2.5231109,4.081538),vec4(11.158006,1.7294737,2.0738268,7.386411),vec4(-4.256034,-306.24686,8.258898,-17.132736))*buf[4]+mat4(vec4(1.6889864,-4.5852966,3.8534803,-6.3482175),vec4(1.3543309,-1.2640043,9.932754,2.9079645),vec4(-5.2770967,0.07150358,-0.13962056,3.3269649),vec4(28.34703,-4.918278,6.1044083,4.085355))*buf[5]+vec4(6.6818056,12.522166,-3.7075126,-4.104386);
    buf[7]=mat4(vec4(-8.265602,-4.7027016,5.098234,0.7509808),vec4(8.6507845,-17.15949,16.51939,-8.884479),vec4(-4.036479,-2.3946867,-2.6055532,-1.9866527),vec4(-2.2167742,-1.8135649,-5.9759874,4.8846445))*buf[0]+mat4(vec4(6.7790847,3.5076547,-2.8191125,-2.7028968),vec4(-5.743024,-0.27844876,1.4958696,-5.0517144),vec4(13.122226,15.735168,-2.9397483,-4.101023),vec4(-14.375265,-5.030483,-6.2599335,2.9848232))*buf[1]+mat4(vec4(4.0950394,-0.94011575,-5.674733,4.755022),vec4(4.3809423,4.8310084,1.7425908,-3.437416),vec4(2.117492,0.16342592,-104.56341,16.949184),vec4(-5.22543,-2.994248,3.8350096,-1.9364246))*buf[2]+mat4(vec4(-5.900337,1.7946124,-13.604192,-3.8060522),vec4(6.6583457,31.911177,25.164474,91.81147),vec4(11.840538,4.1503043,-0.7314397,6.768467),vec4(-6.3967767,4.034772,6.1714606,-0.32874924))*buf[3]+mat4(vec4(3.4992442,-196.91893,-8.923708,2.8142626),vec4(3.4806502,-3.1846354,5.1725626,5.1804223),vec4(-2.4009497,15.585794,1.2863957,2.0252278),vec4(-71.25271,-62.441242,-8.138444,0.50670296))*buf[4]+mat4(vec4(-12.291733,-11.176166,-7.3474145,4.390294),vec4(10.805477,5.6337385,-0.9385842,-4.7348723),vec4(-12.869276,-7.039391,5.3029537,7.5436664),vec4(1.4593618,8.91898,3.5101583,5.840625))*buf[5]+vec4(2.2415268,-6.705987,-0.98861027,-2.117676);
    buf[7]=sigmoid(buf[7]);
    return vec4(buf[7].x,buf[7].y,buf[7].z,1.);
}

void mainImage(out vec4 fragColor,in vec2 fragCoord){
    vec2 uv=fragCoord/uResolution.xy*2.-1.;
    uv.x *= uResolution.x / uResolution.y;
    uv.y*=-1.;
    uv+=uWarp*vec2(sin(uv.y*6.283+uTime*0.5),cos(uv.x*6.283+uTime*0.5))*0.05;
    fragColor=cppn_fn(uv,0.1*sin(0.3*uTime),0.1*sin(0.69*uTime),0.1*sin(0.44*uTime));
}

void main(){
    vec4 col;mainImage(col,gl_FragCoord.xy);
    col.rgb=hueShiftRGB(col.rgb,uHueShift);
    float scanline_val=sin(gl_FragCoord.y*uScanFreq)*0.5+0.5;
    col.rgb*=1.-(scanline_val*scanline_val)*uScan;
    col.rgb+=(rand(gl_FragCoord.xy+uTime)-0.5)*uNoise;
    gl_FragColor=vec4(clamp(col.rgb,0.0,1.0),1.0);
}
`;

function initDarkVeil(ctn, opts = {}) {
  const hueShift = opts.hueShift ?? 0;
  const noiseIntensity = opts.noiseIntensity ?? 0.1;
  const scanlineIntensity = opts.scanlineIntensity ?? 0.2;
  const speed = opts.speed ?? 0.5;
  const scanlineFrequency = opts.scanlineFrequency ?? 2.0;
  const warpAmount = opts.warpAmount ?? 0.15;
  const resolutionScale = opts.resolutionScale ?? 1;

  const renderer = new Renderer({
    dpr: Math.min(window.devicePixelRatio, 2),
    alpha: true
  });

  const gl = renderer.gl;
  gl.canvas.style.width = '100%';
  gl.canvas.style.height = '100%';
  ctn.appendChild(gl.canvas);

  const geometry = new Triangle(gl);

  const program = new Program(gl, {
    vertex: VEIL_VERT,
    fragment: VEIL_FRAG,
    uniforms: {
      uTime: { value: 0 },
      uResolution: { value: new Vec2() },
      uHueShift: { value: hueShift },
      uNoise: { value: noiseIntensity },
      uScan: { value: scanlineIntensity },
      uScanFreq: { value: scanlineFrequency },
      uWarp: { value: warpAmount }
    }
  });

  const mesh = new Mesh(gl, { geometry, program });

  const resize = () => {
    const w = ctn.clientWidth || window.innerWidth;
    const h = ctn.clientHeight || window.innerHeight;
    renderer.setSize(w * resolutionScale, h * resolutionScale);
    program.uniforms.uResolution.value.set(w, h);
  };

  window.addEventListener('resize', resize);
  resize();

  const start = performance.now();
  let rafId;

  const loop = () => {
    program.uniforms.uTime.value = ((performance.now() - start) / 1000) * speed;
    try {
      renderer.render({ scene: mesh });
    } catch(e) {}
    rafId = requestAnimationFrame(loop);
  };

  loop();

  return () => {
    if (rafId) cancelAnimationFrame(rafId);
    window.removeEventListener('resize', resize);
    if (ctn && gl.canvas.parentNode === ctn) ctn.removeChild(gl.canvas);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  };
}


// ==========================================
// MAIN WEBGL BACKGROUND CONTROLLER
// ==========================================
export function renderWebGLBackground(targetContainer?: HTMLElement | null, type: string = 'strands'): () => void {
  const container = targetContainer || (typeof document !== 'undefined' ? document.getElementById('bg-webgl-container') : null);
  if (!container) return () => {};

  // Clean up previous animation context
  if (currentCleanup) {
    currentCleanup();
    currentCleanup = null;
  }
  container.innerHTML = '';

  currentActiveType = type;

  switch (type) {
    case 'strands':
      currentCleanup = initStrands(container, {
        colors: ["#F97316", "#7C3AED", "#06B6D4"],
        count: 3,
        speed: 0.5,
        amplitude: 1,
        waviness: 1,
        thickness: 0.7,
        glow: 2.6,
        taper: 3,
        spread: 1,
        intensity: 0.6,
        saturation: 1.5,
        opacity: 1,
        scale: 1.5,
        glass: false,
        refraction: 1,
        dispersion: 1,
        glassSize: 1
      });
      break;

    case 'siderays':
      currentCleanup = initSideRays(container, {
        speed: 2.2,
        rayColor1: "#F59E0B",
        rayColor2: "#38BDF8",
        intensity: 4.5,
        spread: 3.5,
        origin: "top-right",
        tilt: -5,
        saturation: 1.8,
        blend: 0.75,
        falloff: 0.85,
        opacity: 1.0
      });
      break;

    case 'plasmawave':
      currentCleanup = initPlasmaWave(container, {
        colors: ["#A855F7", "#06B6D4"],
        speed1: 0.05,
        speed2: 0.05,
        focalLength: 0.8,
        bend1: 1,
        bend2: 0.5,
        dir2: 1.0,
        rotationDeg: 0
      });
      break;

    case 'ferrofluid':
      currentCleanup = initFerrofluid(container, {
        colors: ["#ffffff", "#ffffff", "#ffffff"],
        speed: 0.5,
        scale: 1,
        turbulence: 1,
        fluidity: 0.1,
        rimWidth: 0.2,
        sharpness: 3,
        shimmer: 1,
        glow: 2,
        flowDirection: "down",
        opacity: 1,
        mouseInteraction: true,
        mouseStrength: 1,
        mouseRadius: 0.3
      });
      break;

    case 'softaurora':
      currentCleanup = initSoftAurora(container, {
        speed: 0.45,
        scale: 1.4,
        brightness: 0.65,
        color1: "#DC2626",
        color2: "#7F1D1D",
        noiseFrequency: 2.2,
        noiseAmplitude: 0.9,
        bandHeight: 0.5,
        bandSpread: 1.0,
        octaveDecay: 0.1,
        layerOffset: 0,
        colorSpeed: 0.8,
        enableMouseInteraction: true,
        mouseInfluence: 0.2
      });
      break;

    case 'dither':
      currentCleanup = initDither(container, {
        waveSpeed: 0.1,
        waveFrequency: 4,
        waveAmplitude: 0.4,
        waveColor: [0.85, 0.25, 0.95],
        colorNum: 6,
        pixelSize: 3,
        enableMouseInteraction: true,
        mouseRadius: 0.35
      });
      break;

    case 'darkveil':
      currentCleanup = initDarkVeil(container, {
        hueShift: 0,
        noiseIntensity: 0.1,
        scanlineIntensity: 0.2,
        speed: 0.5,
        scanlineFrequency: 2.0,
        warpAmount: 0.15,
        resolutionScale: 1
      });
      break;

    case 'acidsquares':
      currentCleanup = initAcidSquares(container, {
        color1: "#5227FF", color2: "#A855F7", color3: "#FFFFFF",
        speed: 0.7, zoom: 1.3, density: 10.0, glow: 1.0, mouseInteraction: true
      });
      break;

    case 'webthreads':
      currentCleanup = initWebThreads(container, {
        color1: "#5227FF", color2: "#FF9FFC", color3: "#FFFFFF",
        speed: 0.2, threadCount: 6, frequency: 5.0, mouseInteraction: true
      });
      break;

    case 'balatro':
      currentCleanup = initBalatro(container, {
        color1: "#DE443B", color2: "#006BB4", color3: "#162325",
        spinSpeed: 7.0, isRotate: true, mouseInteraction: true
      });
      break;

    case 'moltenmetal':
      currentCleanup = initMoltenMetal(container, {
        color1: "#5227FF", color2: "#FF9FFC", color3: "#FFFFFF",
        speed: 0.35, scale: 4, detail: 3, mouseInteraction: true
      });
      break;

    case 'topography':
      currentCleanup = initTopography(container, {
        lowColor: "#5227FF", midColor: "#FF9FFC", highColor: "#FFFFFF",
        speed: 0.35, morphAmount: 3.0, bands: 2.0, mouseInteraction: true
      });
      break;

    case 'lighttunnel':
      currentCleanup = initLightTunnel(container, {
        cableColor: "#A855F7", pulseColor: "#A855F7", tunnelColor: "#5227FF",
        speed: 0.1, cableCount: 20, mouseInteraction: true
      });
      break;

    default:
      break;
  }

  return () => {
    if (currentCleanup) {
      try { currentCleanup(); } catch {}
      currentCleanup = null;
    }
    if (container) {
      container.innerHTML = '';
    }
    currentActiveType = null;
  };
};

export function stopWebGLBackground(targetContainer?: HTMLElement | null) {
  const container = targetContainer || (typeof document !== 'undefined' ? document.getElementById('bg-webgl-container') : null);
  if (currentCleanup) {
    currentCleanup();
    currentCleanup = null;
  }
  if (container) {
    container.innerHTML = '';
  }
  currentActiveType = null;
};

// ==========================================
// NEW ULTRA SHADERS IMPLEMENTATIONS (OGL Vanilla)
// ==========================================
const hexToRgbArr = hex => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [1, 1, 1];
  return [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255];
};

const hexToVec4Arr = hex => {
  let hexStr = hex.replace('#', '');
  let r = 0, g = 0, b = 0, a = 1;
  if (hexStr.length === 6) {
    r = parseInt(hexStr.slice(0, 2), 16) / 255;
    g = parseInt(hexStr.slice(2, 4), 16) / 255;
    b = parseInt(hexStr.slice(4, 6), 16) / 255;
  } else if (hexStr.length === 8) {
    r = parseInt(hexStr.slice(0, 2), 16) / 255;
    g = parseInt(hexStr.slice(2, 4), 16) / 255;
    b = parseInt(hexStr.slice(4, 6), 16) / 255;
    a = parseInt(hexStr.slice(6, 8), 16) / 255;
  }
  return [r, g, b, a];
};

// 1. AcidSquares Shader
function initAcidSquares(ctn, opts = {}) {
  const {
    color1 = '#5227FF', color2 = '#A855F7', color3 = '#FFFFFF',
    detail = 'medium', speed = 0.7, waveDepth = 1, zoom = 1.3,
    density = 10.0, glow = 1.0, exposure = 2700, spread = 0.3,
    stepSize = 0.002, colorShift = 0, contrast = 1, brightness = 1.0,
    opacity = 1.0, mouseInteraction = true, mouseStrength = 0.1,
    mouseRadius = 0.35, grain = true, grainIntensity = 0.05
  } = opts;

  const renderer = new Renderer({
    webgl: 2, alpha: true, premultipliedAlpha: true, antialias: false,
    dpr: Math.min(window.devicePixelRatio || 1, 2)
  });
  const gl = renderer.gl; gl.clearColor(0, 0, 0, 0);
  const canvas = gl.canvas; canvas.style.width = '100%'; canvas.style.height = '100%'; canvas.style.display = 'block';
  ctn.appendChild(canvas);

  const geometry = new Triangle(gl);
  const uStepsVal = detail === 'low' ? 20 : detail === 'high' ? 48 : 32;

  const vert = `#version 300 es
  in vec2 position; void main() { gl_Position = vec4(position, 0.0, 1.0); }`;

  const frag = `#version 300 es
  precision highp float;
  uniform vec2 iResolution; uniform float iTime; uniform float uSpeed;
  uniform float uWaveDepth; uniform float uZoom; uniform float uDensity;
  uniform float uSpread; uniform float uStepSize; uniform float uGlow;
  uniform float uExposure; uniform float uColorShift; uniform float uContrast;
  uniform float uBrightness; uniform float uOpacity; uniform float uSteps;
  uniform vec3 uColor1; uniform vec3 uColor2; uniform vec3 uColor3;
  uniform vec2 uMouse; uniform float uMouseStrength; uniform float uMouseRadius;
  uniform float uEnableMouse; uniform float uMouseActive; uniform float uGrain;
  uniform float uGrainIntensity; out vec4 fragColor;

  void main() {
    vec2 frag = gl_FragCoord.xy; float zoom = max(uZoom, 0.05);
    float aspect = iResolution.x / iResolution.y;
    vec2 ndc = (2.0 * frag - iResolution.xy) / iResolution.y;
    vec2 dir = ndc * (0.5 / zoom);
    vec2 mouseNdc = vec2(uMouse.x * aspect, uMouse.y);
    float mr = max(uMouseRadius, 0.01); vec2 md = ndc - mouseNdc;
    float dent = exp(-dot(md, md) / (mr * mr)) * (3.0 * uMouseStrength * uEnableMouse * uMouseActive);
    float travel = sin(iTime * uSpeed) * uWaveDepth; float density = max(uDensity, 1.0);
    float spread = clamp(uSpread, 0.05, 0.6); float stepSize = max(uStepSize, 0.0005);
    float glowGain = max(uGlow, 0.0); vec3 tOffset = vec3(0.0, dent, travel);
    vec3 p = vec3(0.0); float s = 0.0; float glow = 0.0;
    for (int i = 0; i < 64; i++) {
      if (float(i) >= uSteps) break;
      p += vec3(dir * s, s); vec3 q = p + tOffset;
      s += density - length(q.xz) + length(ceil(q).xy);
      s = stepSize + abs(s) * spread; glow += glowGain / s;
    }
    float e = glow / max(uExposure, 1.0);
    float shimmer = 0.5 + 0.5 * dot(cos(iTime * uColorShift + p), vec3(0.3333));
    float xVal = e * uBrightness * mix(0.7, 1.05, shimmer);
    float v = clamp(xVal / (1.0 + abs(xVal)), 0.0, 1.0);
    v = clamp((v - 0.5) * uContrast + 0.5, 0.0, 1.0);
    vec3 col = mix(uColor1, uColor2, smoothstep(0.0, 0.55, v));
    col = mix(col, uColor3, smoothstep(0.55, 1.0, v)); col *= v;
    float a = clamp(v, 0.0, 1.0) * uOpacity; vec3 outRgb = col * a;
    if (uGrain > 0.5) {
      float gv = (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233)) + iTime) * 43758.5453) - 0.5) * uGrainIntensity;
      outRgb = clamp(outRgb + gv, 0.0, 1.0); a = clamp(a + gv, 0.0, 1.0);
    }
    fragColor = vec4(outRgb, a);
  }`;

  const program = new Program(gl, {
    vertex: vert, fragment: frag,
    uniforms: {
      iTime: { value: 0 }, iResolution: { value: new Float32Array([1, 1]) },
      uSpeed: { value: speed }, uWaveDepth: { value: waveDepth },
      uZoom: { value: zoom }, uDensity: { value: density },
      uSpread: { value: spread }, uStepSize: { value: stepSize },
      uGlow: { value: glow }, uExposure: { value: exposure },
      uColorShift: { value: colorShift }, uContrast: { value: contrast },
      uBrightness: { value: brightness }, uOpacity: { value: opacity },
      uSteps: { value: uStepsVal },
      uColor1: { value: new Float32Array(hexToRgbArr(color1)) },
      uColor2: { value: new Float32Array(hexToRgbArr(color2)) },
      uColor3: { value: new Float32Array(hexToRgbArr(color3)) },
      uMouse: { value: new Float32Array([0, 0]) },
      uMouseStrength: { value: mouseStrength }, uMouseRadius: { value: mouseRadius },
      uEnableMouse: { value: mouseInteraction ? 1.0 : 0.0 }, uMouseActive: { value: 0.0 },
      uGrain: { value: grain ? 1.0 : 0.0 }, uGrainIntensity: { value: grainIntensity }
    }
  });

  const mesh = new Mesh(gl, { geometry, program });
  const setSize = () => {
    const w = Math.max(1, ctn.clientWidth || window.innerWidth);
    const h = Math.max(1, ctn.clientHeight || window.innerHeight);
    renderer.setSize(w, h);
    program.uniforms.iResolution.value[0] = gl.drawingBufferWidth;
    program.uniforms.iResolution.value[1] = gl.drawingBufferHeight;
  };
  window.addEventListener('resize', setSize); setSize();

  let targetMouse = [0, 0]; let currentMouse = [0, 0];
  let mouseActiveTarget = 0; let mouseActive = 0;

  const onMouseMove = e => {
    const rect = ctn.getBoundingClientRect();
    targetMouse[0] = ((e.clientX - rect.left) / rect.width - 0.5) * 2.0;
    targetMouse[1] = -((e.clientY - rect.top) / rect.height - 0.5) * 2.0;
    mouseActiveTarget = 1;
  };
  const onMouseLeave = () => { mouseActiveTarget = 0; };
  ctn.addEventListener('mousemove', onMouseMove); ctn.addEventListener('mouseleave', onMouseLeave);

  let rafId = 0; const t0 = performance.now();
  const loop = t => {
    program.uniforms.iTime.value = (t - t0) * 0.001;
    currentMouse[0] += 0.05 * (targetMouse[0] - currentMouse[0]);
    currentMouse[1] += 0.05 * (targetMouse[1] - currentMouse[1]);
    program.uniforms.uMouse.value[0] = currentMouse[0];
    program.uniforms.uMouse.value[1] = currentMouse[1];
    mouseActive += 0.05 * (mouseActiveTarget - mouseActive);
    program.uniforms.uMouseActive.value = mouseActive;

    renderer.render({ scene: mesh });
    rafId = requestAnimationFrame(loop);
  };
  rafId = requestAnimationFrame(loop);

  return () => {
    cancelAnimationFrame(rafId);
    window.removeEventListener('resize', setSize);
    ctn.removeEventListener('mousemove', onMouseMove); ctn.removeEventListener('mouseleave', onMouseLeave);
    try { ctn.removeChild(canvas); } catch {}
  };
}

// 2. WebThreads Shader
function initWebThreads(ctn, opts = {}) {
  const {
    color1 = '#5227FF', color2 = '#FF9FFC', color3 = '#FFFFFF',
    speed = 0.2, threadCount = 6, frequency = 5.0, spread = 0.18,
    taper = 1.0, position = 0.5, glow = 0.02, falloff = 0.6,
    thickness = 1.1, brightness = 0.6, opacity = 1.0, mirror = true,
    grain = true, grainIntensity = 0.05, mouseInteraction = true, mouseStrength = 0.3
  } = opts;

  const renderer = new Renderer({
    webgl: 2, alpha: true, premultipliedAlpha: true, antialias: false,
    dpr: Math.min(window.devicePixelRatio || 1, 2)
  });
  const gl = renderer.gl; gl.clearColor(0, 0, 0, 0);
  const canvas = gl.canvas; canvas.style.width = '100%'; canvas.style.height = '100%'; canvas.style.display = 'block';
  ctn.appendChild(canvas);

  const geometry = new Triangle(gl);
  const vert = `#version 300 es
  in vec2 position; void main() { gl_Position = vec4(position, 0.0, 1.0); }`;

  const frag = `#version 300 es
  precision highp float;
  uniform vec2 iResolution; uniform float iTime; uniform float uSpeed;
  uniform float uThreadCount; uniform float uFrequency; uniform float uSpread;
  uniform float uTaper; uniform float uPosition; uniform float uGlow;
  uniform float uFalloff; uniform float uThickness; uniform float uBrightness;
  uniform float uOpacity; uniform float uMirror; uniform float uGrain;
  uniform float uGrainIntensity; uniform vec3 uColor1; uniform vec3 uColor2;
  uniform vec3 uColor3; uniform vec2 uMouse; uniform float uMouseStrength;
  uniform float uEnableMouse; uniform float uMouseActive; out vec4 fragColor;

  #define TAU 6.28318530718
  #define MAX_THREADS 10

  float glow(float x, float str, float dist) { return dist / pow(max(x, 1e-4), str); }

  void main() {
    vec2 uv = gl_FragCoord.xy / iResolution.xy;
    float n = max(uThreadCount, 1.0); float pinchX = 0.5;
    if (uEnableMouse > 0.5) { pinchX = mix(pinchX, uMouse.x, clamp(uMouseStrength, 0.0, 1.0) * uMouseActive); }
    float spreadDx = uSpread * abs(uv.x - pinchX);
    float baseT = iTime * uSpeed; float tauOverN = TAU / n;
    float mirror = uMirror > 0.5 ? sign(pinchX - uv.x) : 1.0;
    float invThickness = 1.0 / max(uThickness, 0.01);
    float xFreq = uv.x * uFrequency; float yOff = uv.y - uPosition;
    float ciScale = n > 1.0 ? 1.0 / (n - 1.0) : 0.0;
    vec3 col = vec3(0.0); float gsum = 0.0;

    for (int idx = 0; idx < MAX_THREADS; idx++) {
      float i = float(idx); if (i >= n) break;
      float amplitude = spreadDx * (1.0 + i * uTaper);
      float phase = (baseT + i * tauOverN) * mirror;
      float sdf = abs(yOff + sin(xFreq + phase) * amplitude) * invThickness;
      float g = glow(sdf, uFalloff, uGlow);
      float ci = i * ciScale;
      vec3 threadCol = mix(uColor1, uColor2, ci);
      col += g * threadCol; gsum += g;
    }
    float coreAmt = smoothstep(0.5, 2.2, gsum);
    col = mix(col, uColor3 * gsum, coreAmt * 0.5);
    float bright = uBrightness;
    if (uEnableMouse > 0.5) {
      vec2 md = uv - uMouse; float d2 = dot(md, md);
      bright += clamp(uMouseStrength, 0.0, 1.0) * uMouseActive * exp(-d2 * 6.0) * 0.6;
    }
    col *= bright; float alpha = clamp(gsum, 0.0, 1.0) * uOpacity;
    vec3 outRgb = col * alpha;
    if (uGrain > 0.5) {
      float gv = (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233)) + iTime) * 43758.5453) - 0.5) * uGrainIntensity;
      outRgb = clamp(outRgb + gv, 0.0, 1.0); alpha = clamp(alpha + gv, 0.0, 1.0);
    }
    fragColor = vec4(outRgb, alpha);
  }`;

  const program = new Program(gl, {
    vertex: vert, fragment: frag,
    uniforms: {
      iTime: { value: 0 }, iResolution: { value: new Float32Array([1, 1]) },
      uSpeed: { value: speed }, uThreadCount: { value: threadCount },
      uFrequency: { value: frequency }, uSpread: { value: spread },
      uTaper: { value: taper }, uPosition: { value: position },
      uGlow: { value: glow }, uFalloff: { value: falloff },
      uThickness: { value: thickness }, uBrightness: { value: brightness },
      uOpacity: { value: opacity }, uMirror: { value: mirror ? 1.0 : 0.0 },
      uGrain: { value: grain ? 1.0 : 0.0 }, uGrainIntensity: { value: grainIntensity },
      uColor1: { value: new Float32Array(hexToRgbArr(color1)) },
      uColor2: { value: new Float32Array(hexToRgbArr(color2)) },
      uColor3: { value: new Float32Array(hexToRgbArr(color3)) },
      uMouse: { value: new Float32Array([0.5, 0.5]) },
      uMouseStrength: { value: mouseStrength },
      uEnableMouse: { value: mouseInteraction ? 1.0 : 0.0 },
      uMouseActive: { value: 0.0 }
    }
  });

  const mesh = new Mesh(gl, { geometry, program });
  const setSize = () => {
    const w = Math.max(1, ctn.clientWidth || window.innerWidth);
    const h = Math.max(1, ctn.clientHeight || window.innerHeight);
    renderer.setSize(w, h);
    program.uniforms.iResolution.value[0] = gl.drawingBufferWidth;
    program.uniforms.iResolution.value[1] = gl.drawingBufferHeight;
  };
  window.addEventListener('resize', setSize); setSize();

  let targetMouse = [0.5, 0.5]; let currentMouse = [0.5, 0.5];
  let targetActive = 0; let currentActive = 0;

  const onMouseMove = e => {
    const rect = canvas.getBoundingClientRect();
    targetMouse[0] = (e.clientX - rect.left) / rect.width;
    targetMouse[1] = 1.0 - (e.clientY - rect.top) / rect.height;
    targetActive = 1;
  };
  const onMouseLeave = () => { targetActive = 0; };
  canvas.addEventListener('mousemove', onMouseMove); canvas.addEventListener('mouseleave', onMouseLeave);

  let rafId = 0; const t0 = performance.now();
  const loop = t => {
    program.uniforms.iTime.value = (t - t0) * 0.001;
    currentMouse[0] += 0.05 * (targetMouse[0] - currentMouse[0]);
    currentMouse[1] += 0.05 * (targetMouse[1] - currentMouse[1]);
    currentActive += 0.05 * (targetActive - currentActive);
    program.uniforms.uMouse.value[0] = currentMouse[0];
    program.uniforms.uMouse.value[1] = currentMouse[1];
    program.uniforms.uMouseActive.value = currentActive;

    renderer.render({ scene: mesh });
    rafId = requestAnimationFrame(loop);
  };
  rafId = requestAnimationFrame(loop);

  return () => {
    cancelAnimationFrame(rafId); window.removeEventListener('resize', setSize);
    canvas.removeEventListener('mousemove', onMouseMove); canvas.removeEventListener('mouseleave', onMouseLeave);
    try { ctn.removeChild(canvas); } catch {}
  };
}

// 3. Balatro Shader
function initBalatro(ctn, opts = {}) {
  const {
    spinRotation = -2.0, spinSpeed = 7.0, color1 = '#DE443B', color2 = '#006BB4',
    color3 = '#162325', contrast = 3.5, lighting = 0.4, spinAmount = 0.25,
    pixelFilter = 745.0, spinEase = 1.0, isRotate = true, mouseInteraction = true
  } = opts;

  const renderer = new Renderer();
  const gl = renderer.gl; gl.clearColor(0, 0, 0, 1);
  const canvas = gl.canvas; canvas.style.width = '100%'; canvas.style.height = '100%';
  ctn.appendChild(canvas);

  const geometry = new Triangle(gl);
  const vert = `
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
  }`;

  const frag = `
  precision highp float;
  uniform float iTime; uniform vec3 iResolution; uniform float uSpinRotation;
  uniform float uSpinSpeed; uniform vec4 uColor1; uniform vec4 uColor2;
  uniform vec4 uColor3; uniform float uContrast; uniform float uLighting;
  uniform float uSpinAmount; uniform float uPixelFilter; uniform float uSpinEase;
  uniform bool uIsRotate; uniform vec2 uMouse; varying vec2 vUv;

  vec4 effect(vec2 screenSize, vec2 screen_coords) {
    float pixel_size = length(screenSize.xy) / uPixelFilter;
    vec2 uv = (floor(screen_coords.xy * (1.0 / pixel_size)) * pixel_size - 0.5 * screenSize.xy) / length(screenSize.xy);
    float uv_len = length(uv);
    float speed = (uSpinRotation * uSpinEase * 0.2);
    if(uIsRotate){ speed = iTime * speed; }
    speed += 302.2;
    float mouseInfluence = (uMouse.x * 2.0 - 1.0);
    speed += mouseInfluence * 0.1;
    float new_pixel_angle = atan(uv.y, uv.x) + speed - uSpinEase * 20.0 * (uSpinAmount * uv_len + (1.0 - uSpinAmount));
    vec2 mid = (screenSize.xy / length(screenSize.xy)) / 2.0;
    uv = (vec2(uv_len * cos(new_pixel_angle) + mid.x, uv_len * sin(new_pixel_angle) + mid.y) - mid);
    uv *= 30.0;
    float baseSpeed = iTime * uSpinSpeed;
    speed = baseSpeed + mouseInfluence * 2.0;
    vec2 uv2 = vec2(uv.x + uv.y);
    for(int i = 0; i < 5; i++) {
      uv2 += sin(max(uv.x, uv.y)) + uv;
      uv += 0.5 * vec2(cos(5.1123314 + 0.353 * uv2.y + speed * 0.131121), sin(uv2.x - 0.113 * speed));
      uv -= cos(uv.x + uv.y) - sin(uv.x * 0.711 - uv.y);
    }
    float contrast_mod = (0.25 * uContrast + 0.5 * uSpinAmount + 1.2);
    float paint_res = min(2.0, max(0.0, length(uv) * 0.035 * contrast_mod));
    float c1p = max(0.0, 1.0 - contrast_mod * abs(1.0 - paint_res));
    float c2p = max(0.0, 1.0 - contrast_mod * abs(paint_res));
    float c3p = 1.0 - min(1.0, c1p + c2p);
    float light = (uLighting - 0.2) * max(c1p * 5.0 - 4.0, 0.0) + uLighting * max(c2p * 5.0 - 4.0, 0.0);
    return (0.3 / uContrast) * uColor1 + (1.0 - 0.3 / uContrast) * (uColor1 * c1p + uColor2 * c2p + vec4(c3p * uColor3.rgb, c3p * uColor1.a)) + light;
  }

  void main() { vec2 uv = vUv * iResolution.xy; gl_FragColor = effect(iResolution.xy, uv); }`;

  const program = new Program(gl, {
    vertex: vert, fragment: frag,
    uniforms: {
      iTime: { value: 0 },
      iResolution: { value: [gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height] },
      uSpinRotation: { value: spinRotation }, uSpinSpeed: { value: spinSpeed },
      uColor1: { value: hexToVec4Arr(color1) }, uColor2: { value: hexToVec4Arr(color2) },
      uColor3: { value: hexToVec4Arr(color3) }, uContrast: { value: contrast },
      uLighting: { value: lighting }, uSpinAmount: { value: spinAmount },
      uPixelFilter: { value: pixelFilter }, uSpinEase: { value: spinEase },
      uIsRotate: { value: isRotate }, uMouse: { value: [0.5, 0.5] }
    }
  });

  const mesh = new Mesh(gl, { geometry, program });
  const resize = () => {
    renderer.setSize(ctn.offsetWidth || window.innerWidth, ctn.offsetHeight || window.innerHeight);
    program.uniforms.iResolution.value = [gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height];
  };
  window.addEventListener('resize', resize); resize();

  let animationFrameId = 0;
  function update(time) {
    animationFrameId = requestAnimationFrame(update);
    program.uniforms.iTime.value = time * 0.001;
    renderer.render({ scene: mesh });
  }
  animationFrameId = requestAnimationFrame(update);

  const handleMouseMove = e => {
    if (!mouseInteraction) return;
    const rect = ctn.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = 1.0 - (e.clientY - rect.top) / rect.height;
    program.uniforms.uMouse.value = [x, y];
  };
  ctn.addEventListener('mousemove', handleMouseMove);

  return () => {
    cancelAnimationFrame(animationFrameId);
    window.removeEventListener('resize', resize);
    ctn.removeEventListener('mousemove', handleMouseMove);
    try { ctn.removeChild(canvas); } catch {}
  };
}

// 4. MoltenMetal Shader
function initMoltenMetal(ctn, opts = {}) {
  const {
    color1 = '#5227FF', color2 = '#FF9FFC', color3 = '#FFFFFF',
    speed = 0.35, scale = 4, detail = 3, glow = 1.6, coreSize = 0.1,
    swirl = 1, fold = -0.2, blackPoint = 0.05, brightness = 1.3,
    grain = true, grainIntensity = 0.05, mouseInteraction = true,
    mouseStrength = 0.3, opacity = 1.0
  } = opts;

  const renderer = new Renderer({
    webgl: 2, alpha: true, premultipliedAlpha: true, antialias: false,
    dpr: Math.min(window.devicePixelRatio || 1, 2)
  });
  const gl = renderer.gl; gl.clearColor(0, 0, 0, 0);
  const canvas = gl.canvas; canvas.style.width = '100%'; canvas.style.height = '100%'; canvas.style.display = 'block';
  ctn.appendChild(canvas);

  const geometry = new Triangle(gl);
  const vert = `#version 300 es
  in vec2 position; void main() { gl_Position = vec4(position, 0.0, 1.0); }`;

  const frag = `#version 300 es
  precision highp float;
  uniform vec2 iResolution; uniform float iTime; uniform float uSpeed;
  uniform float uScale; uniform float uDetail; uniform float uGlow;
  uniform float uCoreSize; uniform float uSwirl; uniform float uFold;
  uniform float uBlackPoint; uniform float uBrightness; uniform float uGrain;
  uniform float uGrainIntensity; uniform float uOpacity; uniform vec2 uMouse;
  uniform float uMouseStrength; uniform bool uEnableMouse; uniform vec3 uColor1;
  uniform vec3 uColor2; uniform vec3 uColor3; out vec4 fragColor;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

  void main() {
    float time = iTime * uSpeed;
    vec2 p = uScale * ((gl_FragCoord.xy - 0.5 * iResolution.xy) / iResolution.y) - 0.5;
    vec2 drift = vec2(0.0);
    if (uEnableMouse) { drift = (uMouse - 0.5) * uMouseStrength * 2.0; }
    p += drift; vec2 i = p; float c = 0.0;
    float r = length(p + vec2(sin(time), sin(time * 0.3 + 5.0)) * 0.5);
    float d = length(p); float rot = d + time + p.x * uSwirl;
    float cosRot = cos(rot);
    mat2 warp = mat2(cos(rot - sin(time / 5.0)), sin(rot), -sin(cosRot - time), cosRot) * uFold;
    float glowCore = uGlow * uCoreSize;
    for (float n = 0.0; n < 8.0; n++) {
      if (n >= uDetail) break;
      p *= warp; float t = r - time / (n + 3.0);
      i -= p + vec2(cos(t - i.x - r) + sin(t + i.y), sin(t - i.y) + cos(t + i.x) + r);
      c += glowCore / length(vec2(sin(i.x + t), cos(i.y + t)));
    }
    c /= 6.0; float intensity = max(c - uBlackPoint, 0.0) * uBrightness;
    float g = clamp(intensity, 0.0, 1.0);
    vec3 col = mix(uColor1, uColor2, smoothstep(0.0, 0.5, g));
    col = mix(col, uColor3, smoothstep(0.5, 1.0, g));
    float a = g;
    if (uGrain > 0.5) { float gr = hash(gl_FragCoord.xy + iTime); a += (gr - 0.5) * uGrainIntensity; }
    a = clamp(a, 0.0, 1.0) * uOpacity; fragColor = vec4(col * a, a);
  }`;

  const program = new Program(gl, {
    vertex: vert, fragment: frag,
    uniforms: {
      iTime: { value: 0 }, iResolution: { value: new Float32Array([1, 1]) },
      uSpeed: { value: speed }, uScale: { value: scale }, uDetail: { value: detail },
      uGlow: { value: glow }, uCoreSize: { value: coreSize }, uSwirl: { value: swirl },
      uFold: { value: fold }, uBlackPoint: { value: blackPoint }, uBrightness: { value: brightness },
      uGrain: { value: grain ? 1.0 : 0.0 }, uGrainIntensity: { value: grainIntensity },
      uOpacity: { value: opacity }, uMouse: { value: new Float32Array([0.5, 0.5]) },
      uMouseStrength: { value: mouseStrength }, uEnableMouse: { value: mouseInteraction },
      uColor1: { value: new Float32Array(hexToRgbArr(color1)) },
      uColor2: { value: new Float32Array(hexToRgbArr(color2)) },
      uColor3: { value: new Float32Array(hexToRgbArr(color3)) }
    }
  });

  const mesh = new Mesh(gl, { geometry, program });
  const setSize = () => {
    const w = Math.max(1, ctn.clientWidth || window.innerWidth);
    const h = Math.max(1, ctn.clientHeight || window.innerHeight);
    renderer.setSize(w, h);
    program.uniforms.iResolution.value[0] = gl.drawingBufferWidth;
    program.uniforms.iResolution.value[1] = gl.drawingBufferHeight;
  };
  window.addEventListener('resize', setSize); setSize();

  const targetMouse = [0.5, 0.5]; const currentMouse = [0.5, 0.5];
  const handleMouseMove = e => {
    const rect = canvas.getBoundingClientRect();
    targetMouse[0] = (e.clientX - rect.left) / rect.width;
    targetMouse[1] = 1.0 - (e.clientY - rect.top) / rect.height;
  };
  canvas.addEventListener('mousemove', handleMouseMove);

  let rafId = 0; const t0 = performance.now();
  const loop = t => {
    program.uniforms.iTime.value = (t - t0) * 0.001;
    currentMouse[0] += 0.05 * (targetMouse[0] - currentMouse[0]);
    currentMouse[1] += 0.05 * (targetMouse[1] - currentMouse[1]);
    program.uniforms.uMouse.value[0] = currentMouse[0];
    program.uniforms.uMouse.value[1] = currentMouse[1];
    renderer.render({ scene: mesh });
    rafId = requestAnimationFrame(loop);
  };
  rafId = requestAnimationFrame(loop);

  return () => {
    cancelAnimationFrame(rafId); window.removeEventListener('resize', setSize);
    canvas.removeEventListener('mousemove', handleMouseMove);
    try { ctn.removeChild(canvas); } catch {}
  };
}

// 5. Topography Shader
function initTopography(ctn, opts = {}) {
  const {
    lowColor = '#5227FF', midColor = '#FF9FFC', highColor = '#FFFFFF',
    speed = 0.35, morphAmount = 3.0, morphSpeed = 0.05, bands = 2.0,
    thickness = 0.01, scale = 1.0, glow = 0.5, contrast = 3.0,
    brightness = 1.0, opacity = 1.0, grain = true, grainIntensity = 0.05,
    mouseInteraction = true, mouseRadius = 0.3, mouseStrength = 0.4
  } = opts;

  const renderer = new Renderer({
    webgl: 2, alpha: true, premultipliedAlpha: true, antialias: false,
    dpr: Math.min(window.devicePixelRatio || 1, 2)
  });
  const gl = renderer.gl; gl.clearColor(0, 0, 0, 0);
  const canvas = gl.canvas; canvas.style.width = '100%'; canvas.style.height = '100%'; canvas.style.display = 'block';
  ctn.appendChild(canvas);

  const geometry = new Triangle(gl);
  const vert = `#version 300 es
  in vec2 position; void main() { gl_Position = vec4(position, 0.0, 1.0); }`;

  const frag = `#version 300 es
  precision highp float;
  uniform vec2 iResolution; uniform float iTime; uniform float uMorphAmount;
  uniform float uBands; uniform float uThickness; uniform float uScale;
  uniform float uGlow; uniform float uContrast; uniform float uBrightness;
  uniform float uOpacity; uniform vec3 uLow; uniform vec3 uMid; uniform vec3 uHigh;
  uniform vec2 uMouse; uniform float uMouseEnabled; uniform float uMouseRadius;
  uniform float uMouseStrength; uniform float uMouseActive; uniform float uGrain;
  uniform float uGrainIntensity; uniform vec4 uCtrlA; uniform vec4 uCtrlB;
  uniform vec4 uCtrlC; uniform vec4 uCtrlD; out vec4 fragColor;

  float bez(float t, vec4 c) {
    float w = 6.2831853 * t; return 0.5 * (c.x * sin(w) + c.y * cos(w) + c.z * sin(2.0 * w) + c.w * cos(2.0 * w));
  }
  float field(vec2 uv) {
    vec2 a = vec2(bez(uv.x, uCtrlA), bez(uv.x, uCtrlB));
    vec2 b = vec2(bez(uv.y, uCtrlC), bez(uv.y, uCtrlD));
    return distance(a, b);
  }
  vec3 elevationColor(float e) {
    vec3 c = mix(uLow, uMid, smoothstep(0.0, 0.5, e));
    return mix(c, uHigh, smoothstep(0.5, 1.0, e));
  }
  void main() {
    vec2 res = iResolution.xy; vec2 uv = gl_FragCoord.xy / res;
    vec2 suv = (uv - 0.5) / max(uScale, 0.001) + 0.5;
    float fv = field(suv);
    if (uMouseEnabled > 0.5) {
      vec2 d = uv - uMouse; d.x *= res.x / max(res.y, 1.0);
      float r = max(uMouseRadius, 0.001);
      fv += exp(-dot(d, d) / (r * r)) * uMouseStrength * uMouseActive;
    }
    float f = fv * uBands; float frac = fract(f); float lineDist = min(frac, 1.0 - frac);
    float aa = fwidth(f) + 0.0001; float mask = 1.0 - smoothstep(uThickness - aa, uThickness + aa, lineDist);
    float glowR = uThickness + uGlow * 0.5 + aa; float glow = (1.0 - smoothstep(uThickness, glowR, lineDist)) * step(0.0001, uGlow);
    float elev = clamp(fv / (uMorphAmount * 2.5 + 0.001), 0.0, 1.0);
    vec3 lineCol = elevationColor(elev);
    float coverage = clamp(mask + glow * 0.55, 0.0, 1.0); coverage = pow(coverage, max(uContrast, 0.001));
    vec3 outColor = lineCol * uBrightness; float outAlpha = coverage;
    if (uGrain > 0.5) {
      float g = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233)) + iTime) * 43758.5453);
      outAlpha += (g - 0.5) * uGrainIntensity;
    }
    float a = clamp(outAlpha, 0.0, 1.0) * uOpacity;
    fragColor = vec4(clamp(outColor, 0.0, 1.0) * a, a);
  }`;

  const program = new Program(gl, {
    vertex: vert, fragment: frag,
    uniforms: {
      iTime: { value: 0 }, iResolution: { value: new Float32Array([1, 1]) },
      uSpeed: { value: speed }, uMorphAmount: { value: morphAmount },
      uMorphSpeed: { value: morphSpeed }, uBands: { value: bands },
      uThickness: { value: thickness }, uScale: { value: scale },
      uGlow: { value: glow }, uContrast: { value: contrast },
      uBrightness: { value: brightness }, uOpacity: { value: opacity },
      uGrain: { value: grain ? 1.0 : 0.0 }, uGrainIntensity: { value: grainIntensity },
      uLow: { value: new Float32Array(hexToRgbArr(lowColor)) },
      uMid: { value: new Float32Array(hexToRgbArr(midColor)) },
      uHigh: { value: new Float32Array(hexToRgbArr(highColor)) },
      uMouse: { value: new Float32Array([0.5, 0.5]) },
      uMouseEnabled: { value: mouseInteraction ? 1.0 : 0.0 },
      uMouseRadius: { value: mouseRadius }, uMouseStrength: { value: mouseStrength },
      uMouseActive: { value: 0.0 },
      uCtrlA: { value: new Float32Array([0, 0, 0, 0]) }, uCtrlB: { value: new Float32Array([0, 0, 0, 0]) },
      uCtrlC: { value: new Float32Array([0, 0, 0, 0]) }, uCtrlD: { value: new Float32Array([0, 0, 0, 0]) }
    }
  });

  const mesh = new Mesh(gl, { geometry, program });
  const setSize = () => {
    const w = Math.max(1, ctn.clientWidth || window.innerWidth);
    const h = Math.max(1, ctn.clientHeight || window.innerHeight);
    renderer.setSize(w, h);
    program.uniforms.iResolution.value[0] = gl.drawingBufferWidth;
    program.uniforms.iResolution.value[1] = gl.drawingBufferHeight;
  };
  window.addEventListener('resize', setSize); setSize();

  let targetMouse = [0.5, 0.5]; let currentMouse = [0.5, 0.5];
  let mouseActiveTarget = 0; let mouseActive = 0;
  const onMouseMove = e => {
    const rect = canvas.getBoundingClientRect();
    targetMouse[0] = (e.clientX - rect.left) / rect.width;
    targetMouse[1] = 1.0 - (e.clientY - rect.top) / rect.height;
    mouseActiveTarget = 1;
  };
  const onMouseLeave = () => { mouseActiveTarget = 0; };
  canvas.addEventListener('mousemove', onMouseMove); canvas.addEventListener('mouseleave', onMouseLeave);

  const ctrlArrays = [
    program.uniforms.uCtrlA.value, program.uniforms.uCtrlB.value,
    program.uniforms.uCtrlC.value, program.uniforms.uCtrlD.value
  ];
  const CTRL_INDICES = [[1, -2, 3, -4], [9, -8, 7, -6], [5, 2, 5, -5], [-1, -3, 8, 9]];

  let rafId = 0; const t0 = performance.now();
  const loop = t => {
    const time = (t - t0) * 0.001;
    program.uniforms.iTime.value = time;
    const ma = morphAmount; const sp = speed; const msp = morphSpeed;
    for (let g = 0; g < 4; g++) {
      const arr = ctrlArrays[g]; const idx = CTRL_INDICES[g];
      for (let j = 0; j < 4; j++) {
        const i = idx[j]; arr[j] = ma * Math.sin(time * sp * Math.sin(i * msp) + i);
      }
    }
    currentMouse[0] += 0.05 * (targetMouse[0] - currentMouse[0]);
    currentMouse[1] += 0.05 * (targetMouse[1] - currentMouse[1]);
    program.uniforms.uMouse.value[0] = currentMouse[0];
    program.uniforms.uMouse.value[1] = currentMouse[1];
    mouseActive += 0.05 * (mouseActiveTarget - mouseActive);
    program.uniforms.uMouseActive.value = mouseActive;

    renderer.render({ scene: mesh });
    rafId = requestAnimationFrame(loop);
  };
  rafId = requestAnimationFrame(loop);

  return () => {
    cancelAnimationFrame(rafId); window.removeEventListener('resize', setSize);
    canvas.removeEventListener('mousemove', onMouseMove); canvas.removeEventListener('mouseleave', onMouseLeave);
    try { ctn.removeChild(canvas); } catch {}
  };
}

// 6. LightTunnel Shader
function initLightTunnel(ctn, opts = {}) {
  const {
    cableColor = '#A855F7', pulseColor = '#A855F7', tunnelColor = '#5227FF',
    speed = 0.1, cableCount = 20, thickness = 0.35, rimWidth = 0.15,
    glow = 1.0, brightness = 1.0, grain = true, grainIntensity = 0.05,
    opacity = 1.0, mouseInteraction = true, mouseStrength = 0.1
  } = opts;

  const renderer = new Renderer({
    webgl: 2, alpha: true, premultipliedAlpha: true, antialias: false,
    dpr: Math.min(window.devicePixelRatio || 1, 2)
  });
  const gl = renderer.gl; gl.clearColor(0, 0, 0, 0);
  const canvas = gl.canvas; canvas.style.width = '100%'; canvas.style.height = '100%'; canvas.style.display = 'block';
  ctn.appendChild(canvas);

  const geometry = new Triangle(gl);
  const vert = `#version 300 es
  in vec2 position; void main() { gl_Position = vec4(position, 0.0, 1.0); }`;

  const frag = `#version 300 es
  precision highp float;
  uniform vec2 iResolution; uniform float iTime; uniform float uSpeed;
  uniform float uCableCount; uniform float uThickness; uniform float uRimWidth;
  uniform vec2 uMouseOffset; uniform float uGlow; uniform float uBrightness;
  uniform float uOpacity; uniform vec3 uCableColor; uniform vec3 uPulseColor;
  uniform vec3 uTunnelColor; uniform float uGrain; uniform float uGrainIntensity;
  out vec4 fragColor;

  void main() {
    vec2 res = iResolution.xy;
    vec2 uv = (gl_FragCoord.xy - 0.5 * res) / min(res.y, res.x);
    uv -= uMouseOffset; uv /= 2.0;
    float r = length(uv); float angle = atan(uv.y, uv.x);
    float depth = -log(r + 0.0001);
    float finalAngle = fract((angle / 6.2831853) + 0.5);
    float cablesCount = floor(uCableCount);
    float cableID = floor(finalAngle * cablesCount);
    float gvX = (fract(finalAngle * cablesCount) - 0.5);
    float rand = fract(sin(cableID * 12.9898) * 43758.5453);
    float randSpeed = (0.4 + rand * 0.6) * uSpeed * 8.0;
    float cableThick = uThickness * 0.35 * (0.6 + rand * 0.4);
    vec3 cableCol = mix(uCableColor, uPulseColor, rand * 0.25);
    float scroll = depth + (iTime * randSpeed);
    float pulseFact = fract(scroll);
    float distToCore = abs(gvX);
    float wireMask = smoothstep(cableThick, cableThick - 0.05, distToCore);
    float rimGlow = smoothstep(uRimWidth * 0.15 + 0.01, 0.0, abs(distToCore - cableThick));
    float dataPulse = 1.0 - smoothstep(0.1, 0.3, abs(pulseFact - 0.5));
    vec3 fiberCol = cableCol * rimGlow * 1.3 * uGlow + uPulseColor * dataPulse * 3.0;
    float distFade = smoothstep(0.0, 0.5, r) * smoothstep(2.0, 1.1, r);
    float inten = clamp(wireMask * 0.2 + rimGlow + dataPulse, 0.0, 1.0) * distFade;
    vec3 finalCol = fiberCol * uBrightness; float alpha = clamp(inten, 0.0, 1.0) * uOpacity;
    vec3 outRgb = finalCol * alpha;
    if (uGrain > 0.5) {
      float gv = (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233)) + iTime) * 43758.5453) - 0.5) * uGrainIntensity;
      outRgb = clamp(outRgb + gv, 0.0, 1.0); alpha = clamp(alpha + gv, 0.0, 1.0);
    }
    fragColor = vec4(outRgb, alpha);
  }`;

  const program = new Program(gl, {
    vertex: vert, fragment: frag,
    uniforms: {
      iTime: { value: 0 }, iResolution: { value: new Float32Array([1, 1]) },
      uSpeed: { value: speed }, uCableCount: { value: cableCount },
      uThickness: { value: thickness }, uRimWidth: { value: rimWidth },
      uMouseOffset: { value: new Float32Array([0, 0]) },
      uGlow: { value: glow }, uBrightness: { value: brightness },
      uOpacity: { value: opacity }, uGrain: { value: grain ? 1.0 : 0.0 },
      uGrainIntensity: { value: grainIntensity },
      uCableColor: { value: new Float32Array(hexToRgbArr(cableColor)) },
      uPulseColor: { value: new Float32Array(hexToRgbArr(pulseColor)) },
      uTunnelColor: { value: new Float32Array(hexToRgbArr(tunnelColor)) }
    }
  });

  const mesh = new Mesh(gl, { geometry, program });
  const setSize = () => {
    const w = Math.max(1, ctn.clientWidth || window.innerWidth);
    const h = Math.max(1, ctn.clientHeight || window.innerHeight);
    renderer.setSize(w, h);
    program.uniforms.iResolution.value[0] = gl.drawingBufferWidth;
    program.uniforms.iResolution.value[1] = gl.drawingBufferHeight;
  };
  window.addEventListener('resize', setSize); setSize();

  let targetMouse = [0.5, 0.5]; let currentMouse = [0.5, 0.5];
  const handleMouseMove = e => {
    const rect = canvas.getBoundingClientRect();
    targetMouse[0] = (e.clientX - rect.left) / rect.width;
    targetMouse[1] = 1.0 - (e.clientY - rect.top) / rect.height;
  };
  canvas.addEventListener('mousemove', handleMouseMove);

  let rafId = 0; const t0 = performance.now();
  const loop = t => {
    program.uniforms.iTime.value = (t - t0) * 0.001;
    if (mouseInteraction) {
      currentMouse[0] += 0.05 * (targetMouse[0] - currentMouse[0]);
      currentMouse[1] += 0.05 * (targetMouse[1] - currentMouse[1]);
    }
    program.uniforms.uMouseOffset.value[0] = (currentMouse[0] - 0.5) * mouseStrength;
    program.uniforms.uMouseOffset.value[1] = (currentMouse[1] - 0.5) * mouseStrength;

    renderer.render({ scene: mesh });
    rafId = requestAnimationFrame(loop);
  };
  rafId = requestAnimationFrame(loop);

  return () => {
    cancelAnimationFrame(rafId); window.removeEventListener('resize', setSize);
    canvas.removeEventListener('mousemove', handleMouseMove);
    try { ctn.removeChild(canvas); } catch {}
  };
}


if (typeof window !== 'undefined') {
  (window as any).renderWebGLBackground = renderWebGLBackground;
  (window as any).stopWebGLBackground = stopWebGLBackground;
  (window as any).BACKGROUND_PRESETS = BACKGROUND_PRESETS;
}
