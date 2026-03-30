import { prepareWithSegments } from "@chenglou/pretext";

// ─── Config ───
const COLS = 56;
const ROWS = 36;
const FIELD_RES = 2; // oversampling
const FIELD_W = COLS * FIELD_RES;
const FIELD_H = ROWS * FIELD_RES;
const NUM_PARTICLES = 100;
const DECAY = 0.82;
const LINE_H = 15;

// ─── Japanese character palette ───
// Characters sorted roughly by visual density (dark → light)
const JP_CHARS = [
  // Heavy kanji (including 豚骨!)
  "龍", "鬱", "驚", "轟", "響", "鑑", "雷", "闇", "覇", "魔",
  "黒", "鉄", "壁", "影", "暗", "深", "重", "厚", "密", "濃",
  "豚", "骨",
  // Emoji
  "🐷",
  // Medium kanji
  "風", "光", "水", "火", "花", "雨", "雪", "空", "月", "星",
  "夢", "心", "命", "道", "森", "海", "山", "川", "音", "色",
  // Light kanji
  "一", "二", "十", "人", "大", "口", "日", "上", "下", "中",
  // Katakana (medium)
  "ア", "イ", "ウ", "エ", "オ", "カ", "キ", "ク", "ケ", "コ",
  "サ", "シ", "ス", "セ", "ソ", "タ", "チ", "ツ", "テ", "ト",
  "ナ", "ニ", "ヌ", "ネ", "ノ",
  // Hiragana (lighter)
  "あ", "い", "う", "え", "お", "か", "き", "く", "け", "こ",
  "さ", "し", "す", "せ", "そ", "た", "ち", "つ", "て", "と",
  // Very light
  "。", "、", "・", "ー", "〜",
];

// Standard ASCII brightness ramp for monospace panel
const ASCII_RAMP = " .:-=+*#%@";

// ─── Font measurement with Pretext ───
const FONTS = [
  '300 12px "Noto Serif JP"',
  '500 12px "Noto Serif JP"',
  '700 12px "Noto Serif JP"',
  '900 12px "Noto Serif JP"',
];

const WEIGHT_CLASSES = ["w3", "w5", "w7", "w9"];

// Build palette: { char, font, weightClass, width, brightness }
let palette = [];

function measureCharWidth(ch, font) {
  const prepared = prepareWithSegments(ch, font);
  return prepared.widths.length > 0 ? prepared.widths[0] : 0;
}

// Estimate brightness by measuring on a tiny canvas
function measureBrightness(ch, font) {
  const size = 24;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "#fff";
  ctx.font = font.replace("12px", "20px");
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillText(ch, size / 2, size / 2);
  const data = ctx.getImageData(0, 0, size, size).data;
  let sum = 0;
  for (let i = 0; i < data.length; i += 4) {
    sum += data[i];
  }
  return sum / (size * size);
}

async function buildPalette() {
  await document.fonts.ready;
  await document.fonts.load('300 12px "Noto Serif JP"', "龍あ");
  await document.fonts.load('500 12px "Noto Serif JP"', "龍あ");
  await document.fonts.load('700 12px "Noto Serif JP"', "龍あ");
  await document.fonts.load('900 12px "Noto Serif JP"', "龍あ");

  for (let fi = 0; fi < FONTS.length; fi++) {
    const font = FONTS[fi];
    const wClass = WEIGHT_CLASSES[fi];
    for (const ch of JP_CHARS) {
      const width = measureCharWidth(ch, font);
      const brightness = measureBrightness(ch, font);
      palette.push({ char: ch, font, weightClass: wClass, width, brightness });
    }
  }
  // Sort by brightness
  palette.sort((a, b) => a.brightness - b.brightness);
}

// ─── Brightness field ───
const field = new Float32Array(FIELD_W * FIELD_H);

// ─── Particles & Attractors ───
const particles = [];
const attractors = [
  { x: 0.3, y: 0.4, vx: 0.003, vy: 0.002, strength: 0.22 },
  { x: 0.7, y: 0.6, vx: -0.002, vy: 0.003, strength: 0.06 },
];

function initParticles() {
  for (let i = 0; i < NUM_PARTICLES; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = 0.1 + Math.random() * 0.2;
    particles.push({
      x: 0.5 + Math.cos(angle) * r,
      y: 0.5 + Math.sin(angle) * r,
      vx: (Math.random() - 0.5) * 0.008,
      vy: (Math.random() - 0.5) * 0.008,
    });
  }
}

// Precomputed radial stamp
function makeStamp(radius, peak) {
  const size = radius * 2 + 1;
  const stamp = new Float32Array(size * size);
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const dist = Math.sqrt(dx * dx + dy * dy) / radius;
      stamp[(dy + radius) * size + (dx + radius)] =
        dist < 1 ? peak * (1 - dist * dist) : 0;
    }
  }
  return { data: stamp, size, radius };
}

const particleStamp = makeStamp(3, 0.6);
const attractorStamp = makeStamp(8, 0.35);

function splatStamp(stamp, cx, cy) {
  const { data, size, radius } = stamp;
  const sx = Math.round(cx * FIELD_W);
  const sy = Math.round(cy * FIELD_H);
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const fx = sx + dx;
      const fy = sy + dy;
      if (fx < 0 || fx >= FIELD_W || fy < 0 || fy >= FIELD_H) continue;
      const val = data[(dy + radius) * size + (dx + radius)];
      const idx = fy * FIELD_W + fx;
      field[idx] = Math.min(1, field[idx] + val);
    }
  }
}

function updateSimulation() {
  // Move attractors
  for (const a of attractors) {
    a.x += a.vx;
    a.y += a.vy;
    if (a.x < 0.05 || a.x > 0.95) a.vx *= -1;
    if (a.y < 0.05 || a.y > 0.95) a.vy *= -1;
    a.x = Math.max(0.02, Math.min(0.98, a.x));
    a.y = Math.max(0.02, Math.min(0.98, a.y));
  }

  // Update particles
  for (const p of particles) {
    for (const a of attractors) {
      const dx = a.x - p.x;
      const dy = a.y - p.y;
      const dist = Math.max(0.01, Math.sqrt(dx * dx + dy * dy));
      const force = a.strength / (dist * dist + 0.05);
      p.vx += (dx / dist) * force * 0.001;
      p.vy += (dy / dist) * force * 0.001;
    }
    // Noise
    p.vx += (Math.random() - 0.5) * 0.001;
    p.vy += (Math.random() - 0.5) * 0.001;
    // Damping
    p.vx *= 0.98;
    p.vy *= 0.98;
    // Move
    p.x += p.vx;
    p.y += p.vy;
    // Wrap
    if (p.x < 0) p.x += 1;
    if (p.x > 1) p.x -= 1;
    if (p.y < 0) p.y += 1;
    if (p.y > 1) p.y -= 1;
  }

  // Decay field
  for (let i = 0; i < field.length; i++) {
    field[i] *= DECAY;
  }

  // Splat particles
  for (const p of particles) {
    splatStamp(particleStamp, p.x, p.y);
  }

  // Splat attractors
  for (const a of attractors) {
    splatStamp(attractorStamp, a.x, a.y);
  }
}

// ─── Source canvas rendering ───
// Canvas draws in CSS pixel space matching the panel, but we need to
// map particle coords (0-1) to the same visual region as the character grid.
let canvasCSSWidth = 0;
let canvasCSSHeight = 0;

function renderSourceCanvas(canvas) {
  const ctx = canvas.getContext("2d");
  const w = canvasCSSWidth;
  const h = canvasCSSHeight;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#05050a";
  ctx.fillRect(0, 0, w, h);

  // Particles as glowing dots
  ctx.globalCompositeOperation = "lighter";
  for (const p of particles) {
    const px = p.x * w;
    const py = p.y * h;
    const grad = ctx.createRadialGradient(px, py, 0, px, py, 6);
    grad.addColorStop(0, "rgba(99, 102, 241, 0.8)");
    grad.addColorStop(1, "rgba(99, 102, 241, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(px - 6, py - 6, 12, 12);
  }

  // Attractors
  for (const a of attractors) {
    const ax = a.x * w;
    const ay = a.y * h;
    const grad = ctx.createRadialGradient(ax, ay, 0, ax, ay, 20);
    grad.addColorStop(0, "rgba(167, 139, 250, 0.6)");
    grad.addColorStop(1, "rgba(167, 139, 250, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(ax - 20, ay - 20, 40, 40);
  }

  ctx.globalCompositeOperation = "source-over";
}

// ─── Character lookup ───
function findChar(brightness) {
  // Binary search in sorted palette
  let lo = 0;
  let hi = palette.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (palette[mid].brightness < brightness) lo = mid + 1;
    else hi = mid;
  }

  // Search nearby for best match
  let best = palette[lo];
  let bestErr = Math.abs(best.brightness - brightness);
  const range = 8;
  for (let i = Math.max(0, lo - range); i < Math.min(palette.length, lo + range); i++) {
    const err = Math.abs(palette[i].brightness - brightness);
    if (err < bestErr) {
      bestErr = err;
      best = palette[i];
    }
  }
  return best;
}

// ─── Render text outputs ───
function sampleField(col, row) {
  let sum = 0;
  const baseX = col * FIELD_RES;
  const baseY = row * FIELD_RES;
  for (let dy = 0; dy < FIELD_RES; dy++) {
    for (let dx = 0; dx < FIELD_RES; dx++) {
      const fx = Math.min(FIELD_W - 1, baseX + dx);
      const fy = Math.min(FIELD_H - 1, baseY + dy);
      sum += field[fy * FIELD_W + fx];
    }
  }
  return sum / (FIELD_RES * FIELD_RES);
}

function renderProportional(container) {
  const fragment = document.createDocumentFragment();

  for (let row = 0; row < ROWS; row++) {
    const lineEl = document.createElement("div");
    lineEl.style.height = LINE_H + "px";
    lineEl.style.lineHeight = LINE_H + "px";
    lineEl.style.whiteSpace = "nowrap";
    lineEl.style.overflow = "hidden";

    for (let col = 0; col < COLS; col++) {
      const val = sampleField(col, row);
      if (val < 0.02) {
        const sp = document.createElement("span");
        sp.textContent = "\u3000"; // fullwidth space
        sp.className = "w3 a1";
        lineEl.appendChild(sp);
        continue;
      }

      const brightness = val * 255;
      const entry = findChar(brightness);
      const alphaLevel = Math.max(1, Math.min(10, Math.ceil(val * 10)));

      const sp = document.createElement("span");
      sp.textContent = entry.char;
      sp.className = `${entry.weightClass} a${alphaLevel}`;
      lineEl.appendChild(sp);
    }

    fragment.appendChild(lineEl);
  }

  container.replaceChildren(fragment);
}

function renderMonospace(container) {
  let text = "";
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const val = sampleField(col, row);
      const idx = Math.min(ASCII_RAMP.length - 1, Math.floor(val * ASCII_RAMP.length));
      text += ASCII_RAMP[idx];
    }
    text += "\n";
  }
  container.textContent = text;
}

// ─── Main loop ───
let lastTime = performance.now();
let frameCount = 0;
let fps = 0;

function loop() {
  const now = performance.now();
  frameCount++;
  if (now - lastTime > 1000) {
    fps = frameCount;
    frameCount = 0;
    lastTime = now;
    document.getElementById("fps-counter").textContent = `${fps} fps`;
  }

  const canvas = document.getElementById("source-canvas");
  const propOut = document.getElementById("proportional-output");
  const monoOut = document.getElementById("monospace-output");

  updateSimulation();
  renderSourceCanvas(canvas);
  renderProportional(propOut);
  renderMonospace(monoOut);

  requestAnimationFrame(loop);
}

// ─── Init ───
async function init() {
  const canvas = document.getElementById("source-canvas");
  const panel = canvas.parentElement;
  const panelRect = panel.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  // Match canvas drawing area to character grid proportions
  // Grid: COLS wide, ROWS * LINE_H tall
  // Scale to fit within the panel
  const gridAspect = COLS / ROWS;
  const panelAspect = panelRect.width / panelRect.height;

  if (panelAspect > gridAspect) {
    // Panel is wider than grid — fit to height
    canvasCSSHeight = panelRect.height;
    canvasCSSWidth = canvasCSSHeight * gridAspect;
  } else {
    // Panel is taller than grid — fit to width
    canvasCSSWidth = panelRect.width;
    canvasCSSHeight = canvasCSSWidth / gridAspect;
  }

  canvas.width = canvasCSSWidth * dpr;
  canvas.height = canvasCSSHeight * dpr;
  canvas.style.width = canvasCSSWidth + "px";
  canvas.style.height = canvasCSSHeight + "px";
  canvas.getContext("2d").scale(dpr, dpr);

  await buildPalette();
  initParticles();

  document.getElementById("code-toggle").addEventListener("click", () => {
    document.getElementById("code-panel").classList.toggle("open");
  });

  requestAnimationFrame(loop);
}

init();
