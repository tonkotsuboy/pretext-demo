import {
  prepareWithSegments,
  layoutWithLines,
  layoutNextLine,
  setLocale,
} from "@chenglou/pretext";

setLocale("ja");

// ─── Text content ───
const HEADLINE = "腹減りダッツカールトン！";

const BODY_TEXT =
  "「おなか吹田市」自体は面白いんだけど、TBG観点から言えば高くはないんだよね。TBGの指標として「一つの言葉にたくさんの意味を持たせられるか」があるんだけど、他の重要な指標に「誰も思いついてないか？」がある。おなか系ギャグの「おなか吹田市」はTBG界隈だとよく使われる言葉で、ほかだと「お腹ヘリコプター」や「おなかオードリー・ヘップバーン」等があることはよく知っているよね？これらはすでに誰かが思いついた言葉で、Twitterで検索してすぐヒットするからTBGポイントが低くなってしまう。我が今おなか系で攻めるんだったら"おなかヘッドレストUI"、これだね。正論おじさんたちが「ヘッドレストUIってなんだよ、ヘッドレスUIだろ」って言ってくることは織り込み済みで、TBGに造形が深い人なら「いや違う…！あえてヘッドレス"ト"にすることで、おなか・ヘッド・ヘッドレストの3つの意味を持たせてTBGポイントを上げにきている…！これはTBGの匠のWAZA…！」と理解してくれるんだよね。この高みまで登ってきてね。そこは「はらへりだつ」ではないでしょうか？たった一文字縮めただけ、かと思われるかもしれませんが、この一文字を縮めたことにより「腹減りのため離脱する」「腹へ向かって離脱する（魂は全て腹という名の天国へ収束する）」という2つの意味を持たせられます。一つの言葉に複数の意味を持たせられるほどTBGスコア（とんこつの爆笑ギャグスコア）が高くなります。ただし、「はらへりだつ」だと素っ気なさが目立つため、「腹減りダッツ！」とするのが望ましいでしょう。こうすることで、第三の意味「私はいま腹が減っているんだ」が追加され、TBGスコアが上がります。このあたりまでやると及第点を取得できるでしょう。なお、私レベルになると最終的に「腹減りダッツカールトン！」を生み出します。";

const PULLQUOTE_TEXTS = [
  "一つの言葉に複数の意味を持たせられるほど、TBGスコアが高くなる。",
  "なお、私レベルになると最終的に「腹減りダッツカールトン！」を生み出します。",
];

const DROP_CAP_CHAR = "腹";

// ─── Fonts ───
const BODY_FONT = '16px "Noto Serif JP"';
const BODY_LINE_H = 30;
const HEADLINE_FONT_BASE = '"Noto Sans JP"';
const PQ_FONT = '300 15px "Noto Sans JP"';
const PQ_LINE_H = 26;
const DROP_CAP_FONT = '900 72px "Noto Serif JP"';

// ─── Orbs ───
const orbDefs = [
  { x: 0.25, y: 0.35, r: 70, vx: 0.4, vy: 0.3, color: "rgba(99,102,241,0.18)", border: "rgba(129,140,248,0.4)" },
  { x: 0.65, y: 0.45, r: 55, vx: -0.3, vy: 0.5, color: "rgba(192,132,252,0.15)", border: "rgba(192,132,252,0.35)" },
  { x: 0.45, y: 0.7, r: 85, vx: 0.2, vy: -0.4, color: "rgba(244,114,182,0.12)", border: "rgba(244,114,182,0.3)" },
  { x: 0.8, y: 0.25, r: 45, vx: -0.5, vy: 0.2, color: "rgba(52,211,153,0.15)", border: "rgba(52,211,153,0.35)" },
];

let orbs = [];
let dragging = null;
let dragOffset = { x: 0, y: 0 };
let stillAnimating = true;

// ─── DOM pools ───
const linePool = [];
const headlinePool = [];
const pqPool = [];
const orbEls = [];

function getOrCreateEl(pool, idx, className, parent) {
  if (idx < pool.length) {
    pool[idx].style.display = "";
    return pool[idx];
  }
  const el = document.createElement("div");
  el.className = className;
  parent.appendChild(el);
  pool.push(el);
  return el;
}

function hideExcess(pool, count) {
  for (let i = count; i < pool.length; i++) {
    pool[i].style.display = "none";
  }
}

// ─── Geometry: circle-line intersection ───
function circleBlockedInterval(cx, cy, r, bandTop, bandBottom, pad) {
  const top = bandTop - pad;
  const bottom = bandBottom + pad;
  if (top >= cy + r || bottom <= cy - r) return null;
  const minDy = (cy >= top && cy <= bottom) ? 0 : (cy < top ? top - cy : cy - bottom);
  if (minDy >= r) return null;
  const maxDx = Math.sqrt(r * r - minDy * minDy);
  return { left: cx - maxDx - pad, right: cx + maxDx + pad };
}

function carveSlots(base, blocked) {
  let slots = [base];
  for (const interval of blocked) {
    const next = [];
    for (const slot of slots) {
      if (interval.right <= slot.left || interval.left >= slot.right) {
        next.push(slot);
      } else {
        if (interval.left > slot.left) next.push({ left: slot.left, right: interval.left });
        if (interval.right < slot.right) next.push({ left: interval.right, right: slot.right });
      }
    }
    slots = next;
  }
  return slots.filter((s) => s.right - s.left >= 60);
}

// ─── Layout engine ───
function layoutColumn(prepared, startCursor, regionX, regionY, regionW, regionH, lineHeight, circles) {
  const lines = [];
  let cursor = { ...startCursor };
  let y = regionY;
  let exhausted = false;

  while (y + lineHeight <= regionY + regionH && !exhausted) {
    const blocked = [];
    for (const c of circles) {
      const interval = circleBlockedInterval(c.x, c.y, c.r, y, y + lineHeight, 12);
      if (interval) blocked.push(interval);
    }

    const slots = carveSlots({ left: regionX, right: regionX + regionW }, blocked);

    for (const slot of slots) {
      const slotWidth = slot.right - slot.left;
      const line = layoutNextLine(prepared, cursor, slotWidth);
      if (line === null) {
        exhausted = true;
        break;
      }
      lines.push({ x: slot.left, y, text: line.text, width: line.width });
      cursor = line.end;
    }

    y += lineHeight;
  }

  return { lines, cursor, exhausted };
}

// ─── Prepared text cache ───
let preparedBody;
let preparedPQs;
let preparedHeadlines = new Map();

async function prepareTexts() {
  await document.fonts.ready;
  await document.fonts.load('16px "Noto Serif JP"', "活版印刷");
  await document.fonts.load('900 48px "Noto Sans JP"', "言葉は光");
  await document.fonts.load('300 15px "Noto Sans JP"', "リフロー");

  preparedBody = prepareWithSegments(BODY_TEXT, BODY_FONT);
  preparedPQs = PULLQUOTE_TEXTS.map((t) => prepareWithSegments(t, PQ_FONT));
}

function getPreparedHeadline(fontSize) {
  const key = fontSize;
  if (preparedHeadlines.has(key)) return preparedHeadlines.get(key);
  const font = `900 ${fontSize}px ${HEADLINE_FONT_BASE}`;
  const prepared = prepareWithSegments(HEADLINE, font);
  preparedHeadlines.set(key, { prepared, font });
  return { prepared, font };
}

// ─── Fit headline ───
function fitHeadline(maxWidth, maxHeight) {
  let lo = 24;
  let hi = 120;
  let bestSize = lo;

  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const { prepared } = getPreparedHeadline(mid);
    const result = layoutWithLines(prepared, maxWidth, mid * 1.15);
    if (result.height <= maxHeight && result.lineCount <= 2) {
      bestSize = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  return bestSize;
}

// ─── Main render ───
const stage = document.getElementById("stage");

function render() {
  const start = performance.now();
  const W = window.innerWidth;
  const H = window.innerHeight - 40; // top bar

  const margin = Math.max(32, W * 0.06);
  const contentW = W - margin * 2;
  const contentTop = 56;

  // Update orb physics
  for (const orb of orbs) {
    if (orb === dragging) continue;
    orb.x += orb.vx;
    orb.y += orb.vy;

    // Bounce
    if (orb.x - orb.r < margin || orb.x + orb.r > W - margin) orb.vx *= -1;
    if (orb.y - orb.r < contentTop + 40 || orb.y + orb.r > H) orb.vy *= -1;
    orb.x = Math.max(margin + orb.r, Math.min(W - margin - orb.r, orb.x));
    orb.y = Math.max(contentTop + 40 + orb.r, Math.min(H - orb.r, orb.y));

    // Orb-orb repulsion
    for (const other of orbs) {
      if (other === orb) continue;
      const dx = orb.x - other.x;
      const dy = orb.y - other.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = orb.r + other.r + 20;
      if (dist < minDist && dist > 0) {
        const force = (minDist - dist) * 0.02;
        orb.vx += (dx / dist) * force;
        orb.vy += (dy / dist) * force;
      }
    }

    // Damping
    orb.vx *= 0.998;
    orb.vy *= 0.998;
  }

  // ─── Headline ───
  const headlineSize = fitHeadline(contentW, 140);
  const { prepared: headlinePrepared, font: headlineFont } = getPreparedHeadline(headlineSize);
  const headlineResult = layoutWithLines(headlinePrepared, contentW, headlineSize * 1.15);

  let hlIdx = 0;
  for (const line of headlineResult.lines) {
    const el = getOrCreateEl(headlinePool, hlIdx, "headline-line", stage);
    el.style.left = margin + "px";
    el.style.top = (contentTop + line.start.segmentIndex * headlineSize * 1.15) + "px";
    el.style.fontSize = headlineSize + "px";
    el.style.lineHeight = (headlineSize * 1.15) + "px";
    el.textContent = line.text;
    hlIdx++;
  }
  hideExcess(headlinePool, hlIdx);

  const bodyTop = contentTop + headlineResult.height + 32;

  // ─── Body text with obstacle avoidance ───
  const circleObs = orbs.map((o) => ({ x: o.x, y: o.y, r: o.r }));

  const isTwoCol = contentW > 600;
  const gap = 40;
  const colW = isTwoCol ? (contentW - gap) / 2 : contentW;
  const bodyH = H - bodyTop - 20;

  let lineIdx = 0;

  if (isTwoCol) {
    // Column 1
    const col1 = layoutColumn(preparedBody, { segmentIndex: 0, graphemeIndex: 0 },
      margin, bodyTop, colW, bodyH, BODY_LINE_H, circleObs);

    for (const line of col1.lines) {
      const el = getOrCreateEl(linePool, lineIdx, "text-line", stage);
      el.style.left = line.x + "px";
      el.style.top = line.y + "px";
      el.style.font = BODY_FONT;
      el.style.lineHeight = BODY_LINE_H + "px";
      el.textContent = line.text;
      lineIdx++;
    }

    // Column 2
    if (!col1.exhausted) {
      const col2 = layoutColumn(preparedBody, col1.cursor,
        margin + colW + gap, bodyTop, colW, bodyH, BODY_LINE_H, circleObs);

      for (const line of col2.lines) {
        const el = getOrCreateEl(linePool, lineIdx, "text-line", stage);
        el.style.left = line.x + "px";
        el.style.top = line.y + "px";
        el.style.font = BODY_FONT;
        el.style.lineHeight = BODY_LINE_H + "px";
        el.textContent = line.text;
        lineIdx++;
      }
    }
  } else {
    const col = layoutColumn(preparedBody, { segmentIndex: 0, graphemeIndex: 0 },
      margin, bodyTop, colW, bodyH, BODY_LINE_H, circleObs);

    for (const line of col.lines) {
      const el = getOrCreateEl(linePool, lineIdx, "text-line", stage);
      el.style.left = line.x + "px";
      el.style.top = line.y + "px";
      el.style.font = BODY_FONT;
      el.style.lineHeight = BODY_LINE_H + "px";
      el.textContent = line.text;
      lineIdx++;
    }
  }

  hideExcess(linePool, lineIdx);

  // ─── Orb elements ───
  for (let i = 0; i < orbs.length; i++) {
    const orb = orbs[i];
    const el = getOrCreateEl(orbEls, i, "orb", stage);
    el.style.left = (orb.x - orb.r) + "px";
    el.style.top = (orb.y - orb.r) + "px";
    el.style.width = (orb.r * 2) + "px";
    el.style.height = (orb.r * 2) + "px";
    el.style.background = orb.color;
    el.style.border = `1px solid ${orb.border}`;
  }
  hideExcess(orbEls, orbs.length);

  const elapsed = performance.now() - start;
  document.getElementById("layout-time").textContent = `layout: ${elapsed.toFixed(2)}ms / frame`;

  if (stillAnimating) {
    requestAnimationFrame(render);
  }
}

// ─── Interaction ───
function setupInteraction() {
  const stageEl = document.getElementById("stage");

  stageEl.addEventListener("pointerdown", (e) => {
    for (const orb of orbs) {
      const dx = e.clientX - orb.x;
      const dy = (e.clientY - 40) - orb.y;
      if (Math.sqrt(dx * dx + dy * dy) < orb.r + 10) {
        dragging = orb;
        dragOffset.x = dx;
        dragOffset.y = dy;
        orb.vx = 0;
        orb.vy = 0;
        stageEl.style.cursor = "grabbing";
        e.preventDefault();
        return;
      }
    }
  });

  window.addEventListener("pointermove", (e) => {
    if (!dragging) {
      // Hover cursor
      let hovering = false;
      for (const orb of orbs) {
        const dx = e.clientX - orb.x;
        const dy = (e.clientY - 40) - orb.y;
        if (Math.sqrt(dx * dx + dy * dy) < orb.r + 10) {
          hovering = true;
          break;
        }
      }
      stageEl.style.cursor = hovering ? "grab" : "default";
      return;
    }
    dragging.x = e.clientX - dragOffset.x;
    dragging.y = (e.clientY - 40) - dragOffset.y;
  });

  window.addEventListener("pointerup", () => {
    if (dragging) {
      stageEl.style.cursor = "grab";
      dragging = null;
    }
  });
}

// ─── Init ───
async function init() {
  await prepareTexts();

  const W = window.innerWidth;
  const H = window.innerHeight;

  // Initialize orbs with absolute positions
  for (const def of orbDefs) {
    orbs.push({
      x: def.x * W,
      y: def.y * H,
      r: def.r,
      vx: def.vx,
      vy: def.vy,
      color: def.color,
      border: def.border,
    });
  }

  setupInteraction();

  window.addEventListener("resize", () => {
    // Clamp orbs
    for (const orb of orbs) {
      orb.x = Math.min(window.innerWidth - orb.r, Math.max(orb.r, orb.x));
      orb.y = Math.min(window.innerHeight - orb.r, Math.max(orb.r, orb.y));
    }
  });

  requestAnimationFrame(render);
}

init();
