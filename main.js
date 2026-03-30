import {
  prepare,
  prepareWithSegments,
  layout,
  layoutWithLines,
  layoutNextLine,
  setLocale,
} from "@chenglou/pretext";

import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";

setLocale("ja");

const FONT = '16px "Noto Sans JP"';
const LINE_HEIGHT = 28;

// ─── Japanese sample texts ───
const jaTexts = [
  "桜の花が風に舞い散る春の午後、古い寺院の境内を歩いていると、どこからともなく鐘の音が聞こえてきた。",
  "量子コンピュータの実用化により、従来のスーパーコンピュータでは数万年かかる計算が数分で完了する時代が到来した。",
  "東京の地下鉄は世界でも最も複雑な路線網を持つが、その正確さと効率性は他の追随を許さない。",
  "夏目漱石の「吾輩は猫である」は、猫の視点から人間社会を風刺的に描いた日本近代文学の傑作である。",
  "人工知能が創作した俳句「古池や 蛙飛び込む 水の音」—— いや、これは芭蕉だった。AIにはまだ早い。",
  "深夜のコンビニで肉まんを買う。湯気が立ち上る瞬間、小さな幸福が掌の中に収まる。",
  "富士山の頂から見る日の出は、言葉では表現しきれない荘厳さを持っている。雲海の彼方から光が差し込む瞬間、世界が金色に染まる。",
  "日本の四季は料理にも反映される。春の筍、夏の鮎、秋の松茸、冬の河豚。旬を大切にする文化が食卓を彩る。",
  "新幹線の車窓から見える風景は、都市と田園が交互に現れる日本の縮図だ。",
  "プログラミングとは、人間の思考をコンピュータが理解できる形に翻訳する芸術である。",
  "京都の路地裏には、百年以上続く小さな和菓子屋がひっそりと佇んでいる。",
  "雨上がりの虹を見て、子どもたちが歓声を上げる。その純粋な喜びに、大人たちも思わず微笑む。",
  "日本語の「木漏れ日」という言葉は、木の葉の隙間から差し込む日光を意味する。英語には直訳がない。",
  "ラーメン一杯に込められた職人の技。麺の太さ、スープの温度、チャーシューの厚み。すべてが計算されている。",
  "渋谷のスクランブル交差点。一度の信号で最大3000人が交差する、世界最大級の交差点だ。",
  "宮崎駿の作品は、自然と人間の共存というテーマを幻想的な世界観で描き続けている。",
  "日本庭園の「借景」とは、庭の外にある山や森を風景の一部として取り込む技法である。",
  "温泉に浸かりながら雪景色を眺める。これぞ日本の冬の醍醐味だ。",
  "活版印刷の時代から現代のWebフォントまで、文字組版の技術は進化し続けている。Pretextはその最新形だ。",
  "能の舞台では、演者の一歩一歩が宇宙の動きを表現する。静寂の中に無限の表現がある。",
  "TypeScriptの型システムは、実行前にバグを発見する強力な味方だ。型安全は開発者の安眠を守る。",
  "北海道のラベンダー畑は、夏になると紫の絨毯が丘陵を覆い尽くす絶景となる。",
  "「間」という概念は日本文化の核心にある。音楽の休符、建築の余白、会話の沈黙。すべてに意味がある。",
  "秋葉原は電気街からオタク文化の聖地へと変貌を遂げた。今やその文化は世界中に影響を与えている。",
];

const chatMessages = [
  { side: "left", text: "ねえ、Pretextって知ってる？" },
  { side: "right", text: "DOMのリフローなしでテキストの高さを計測できるライブラリだよね！" },
  { side: "left", text: "そう！Canvas APIを使って計測するから、500個のテキストブロックでも0.09msで再計算できるんだって" },
  { side: "right", text: "日本語のCJK文字にも対応してるの？" },
  { side: "left", text: "もちろん！Intl.Segmenterを使ってるから、日本語・中国語・韓国語・アラビア語・絵文字まで全部OK" },
  { side: "right", text: "最高じゃん" },
  { side: "left", text: "しかもlayoutNextLineを使えば、画像の回り込みレイアウトもできる。CSSのfloatみたいなことがCanvas上で実現できるよ" },
  { side: "right", text: "マジで革命的" },
];

// ─── Wait for fonts ───
async function waitForFonts() {
  await document.fonts.ready;
  await document.fonts.load('16px "Noto Sans JP"', "テスト");
  await document.fonts.load('18px "Noto Sans JP"', "テスト");
  await document.fonts.load('700 18px "Noto Sans JP"', "テスト");
}

// ─── Utility: safe DOM element creation ───
function el(tag, attrs = {}, children = []) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "textContent") e.textContent = v;
    else if (k === "className") e.className = v;
    else e.setAttribute(k, v);
  }
  for (const c of children) {
    if (typeof c === "string") e.appendChild(document.createTextNode(c));
    else e.appendChild(c);
  }
  return e;
}

// ─── Demo 1: Performance Benchmark ───
function runBenchmark() {
  const texts = [];
  for (let i = 0; i < 500; i++) {
    texts.push(jaTexts[i % jaTexts.length]);
  }

  // DOM measurement
  const container = document.createElement("div");
  container.style.cssText =
    'position:absolute;visibility:hidden;font:16px "Noto Sans JP";line-height:1.75;width:300px;word-break:normal;overflow-wrap:break-word;';
  document.body.appendChild(container);

  const domStart = performance.now();
  for (const text of texts) {
    container.textContent = text;
    container.offsetHeight;
  }
  const domTime = performance.now() - domStart;
  document.body.removeChild(container);

  // Pretext: prepare
  const prepStart = performance.now();
  const prepared = texts.map((t) => prepare(t, FONT));
  const prepTime = performance.now() - prepStart;

  // Pretext: layout
  const layoutStart = performance.now();
  for (const p of prepared) {
    layout(p, 300, LINE_HEIGHT);
  }
  const layoutTime = performance.now() - layoutStart;

  // Results - build DOM safely
  const resultsEl = document.getElementById("perf-results");
  resultsEl.replaceChildren(
    el("div", { style: "margin-bottom:0.5rem" }, [
      "DOM計測: ",
      el("strong", { style: "color:#ef4444", textContent: `${domTime.toFixed(1)}ms` }),
    ]),
    el("div", { style: "margin-bottom:0.5rem" }, [
      "Pretext prepare: ",
      el("strong", { style: "color:var(--accent2)", textContent: `${prepTime.toFixed(1)}ms` }),
      " (初回のみ)",
    ]),
    el("div", {}, [
      "Pretext layout: ",
      el("strong", { style: "color:var(--accent3)", textContent: `${layoutTime.toFixed(2)}ms` }),
      " (リサイズ時はこれだけ！)",
    ])
  );

  const barsEl = document.getElementById("perf-bars");
  const maxTime = Math.max(domTime, layoutTime, prepTime);

  function makeBarRow(label, cssClass, time, maxT) {
    return el("div", { className: "perf-bar-row" }, [
      el("span", { className: "perf-bar-label", textContent: label }),
      el("div", {
        className: `perf-bar ${cssClass}`,
        style: `width:${Math.max((time / maxT) * 100, 2)}%`,
        textContent: time < 1 ? `${time.toFixed(2)}ms` : `${time.toFixed(1)}ms`,
      }),
    ]);
  }

  barsEl.replaceChildren(
    makeBarRow("DOM", "dom", domTime, maxTime),
    makeBarRow("prepare", "pretext-bar", prepTime, maxTime),
    makeBarRow("layout", "pretext-bar", layoutTime, maxTime)
  );
}

// ─── Demo 2: Masonry Layout ───
const cardPadding = 40;
const cardTagHeight = 20;
const gap = 12;

function buildMasonry() {
  const container = document.getElementById("masonry-container");
  const cols = parseInt(document.getElementById("col-slider").value);
  const containerWidth = container.offsetWidth;
  const colWidth = (containerWidth - gap * (cols - 1)) / cols;
  const textWidth = colWidth - 40;

  const colHeights = new Array(cols).fill(0);
  const fragment = document.createDocumentFragment();

  const colors = ["#6366f1", "#a78bfa", "#34d399", "#f472b6", "#fbbf24", "#38bdf8"];

  for (let i = 0; i < jaTexts.length; i++) {
    const text = jaTexts[i];
    const prepared = prepare(text, '14px "Noto Sans JP"');
    const { height } = layout(prepared, textWidth, 24);
    const cardHeight = height + cardPadding + cardTagHeight;

    let minCol = 0;
    for (let c = 1; c < cols; c++) {
      if (colHeights[c] < colHeights[minCol]) minCol = c;
    }

    const x = minCol * (colWidth + gap);
    const y = colHeights[minCol];
    const color = colors[i % colors.length];

    const card = el("div", {
      className: "masonry-card",
      style: `left:${x}px;top:${y}px;width:${colWidth}px;height:${cardHeight}px`,
    }, [
      el("span", { className: "card-tag", style: `color:${color}`, textContent: `TEXT #${String(i + 1).padStart(2, "0")}` }),
      el("div", { className: "card-text", textContent: text }),
    ]);
    fragment.appendChild(card);

    colHeights[minCol] += cardHeight + gap;
  }

  container.replaceChildren(fragment);
  container.style.height = Math.max(...colHeights) + "px";
}

// ─── Demo 3: Chat Bubbles (CSS vs Pretext comparison) ───
function buildChat(maxWidth) {
  const cssContainer = document.getElementById("chat-css");
  const ptContainer = document.getElementById("chat-pretext");
  const cssFragment = document.createDocumentFragment();
  const ptFragment = document.createDocumentFragment();

  const bubbleFont = '14px "Noto Sans JP"';
  const bubblePadding = 32; // horizontal padding total
  const lineH = 24;

  for (let i = 0; i < chatMessages.length; i++) {
    const { side, text } = chatMessages[i];

    // CSS version: just max-width, browser decides
    const cssBubble = el("div", {
      className: `bubble ${side}`,
      style: `max-width:${maxWidth}px`,
    }, [
      text,
      el("div", { className: "bubble-meta", textContent: "CSS max-width" }),
    ]);
    cssFragment.appendChild(cssBubble);

    // Pretext version: find optimal narrower width
    const prepared = prepareWithSegments(text, bubbleFont);
    const textMaxW = maxWidth - bubblePadding;
    const baseResult = layoutWithLines(prepared, textMaxW, lineH);

    // Binary search for minimum width that keeps same line count
    let lo = 60;
    let hi = textMaxW;
    let bestW = textMaxW;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      const { lineCount } = layout(prepared, mid, lineH);
      if (lineCount <= baseResult.lineCount) {
        bestW = mid;
        hi = mid - 1;
      } else {
        lo = mid + 1;
      }
    }

    const optResult = layout(prepared, bestW, lineH);
    const ptBubble = el("div", {
      className: `bubble ${side}`,
      style: `max-width:${bestW + bubblePadding}px`,
    }, [
      text,
      el("div", { className: "bubble-meta", textContent: `${optResult.lineCount}行 / 幅${bestW + bubblePadding}px (Pretext最適化)` }),
    ]);
    ptFragment.appendChild(ptBubble);
  }

  cssContainer.replaceChildren(cssFragment);
  ptContainer.replaceChildren(ptFragment);
}

// ─── Demo 4: Canvas Rendering ───
function drawCanvas() {
  const canvas = document.getElementById("text-canvas");
  const dpr = window.devicePixelRatio || 1;
  const cssW = 800;
  const cssH = 500;
  canvas.width = cssW * dpr;
  canvas.height = cssH * dpr;
  canvas.style.width = cssW + "px";
  canvas.style.height = cssH + "px";

  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);

  // Background
  ctx.fillStyle = "#12121a";
  ctx.fillRect(0, 0, cssW, cssH);

  // Obstacle
  const obstacle = { x: 480, y: 30, w: 280, h: 200, r: 16 };

  ctx.fillStyle = "#1e1e2e";
  ctx.beginPath();
  ctx.roundRect(obstacle.x, obstacle.y, obstacle.w, obstacle.h, obstacle.r);
  ctx.fill();
  ctx.strokeStyle = "#6366f1";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = "#6366f1";
  ctx.font = '500 13px "IBM Plex Mono"';
  ctx.fillText("障害物 (画像エリア)", obstacle.x + 16, obstacle.y + 28);
  ctx.fillStyle = "#8888a0";
  ctx.font = '12px "IBM Plex Mono"';
  ctx.fillText("layoutNextLine()で回り込み", obstacle.x + 16, obstacle.y + 50);

  const longText =
    "活版印刷の時代から現代のWebタイポグラフィまで、文字の組版技術は絶え間なく進化を続けてきた。グーテンベルクの活版印刷機が知識の民主化をもたらしたように、Webフォントとレイアウトエンジンの進化はデジタル空間における表現の可能性を大きく広げた。しかし、ブラウザのDOMレイアウト計算は依然としてパフォーマンスのボトルネックとなっている。テキストの高さを知るためにgetBoundingClientRect()を呼ぶたびに、ブラウザは同期的にレイアウトを再計算しなければならない。Pretextはこの問題をCanvas APIによる事前計測で解決する。prepare()で一度テキストを解析すれば、その後のlayout()はO(n)の純粋な算術計算のみ。リフローゼロ。アロケーションゼロ。日本語のような文字単位で改行するCJKテキストにも、Intl.Segmenterを活用して完全に対応している。";

  const font = '16px "Noto Sans JP"';
  const prepared = prepareWithSegments(longText, font);
  const lineH = 28;
  const margin = { x: 32, y: 36 };
  const fullWidth = cssW - margin.x * 2;

  ctx.fillStyle = "#e8e8f0";
  ctx.font = font;

  let cursor = { segmentIndex: 0, graphemeIndex: 0 };
  let y = margin.y;
  let lineNum = 0;

  while (true) {
    let availableWidth = fullWidth;
    const lineBottom = y + lineH;
    if (y < obstacle.y + obstacle.h && lineBottom > obstacle.y) {
      availableWidth = obstacle.x - margin.x - 16;
    }

    const line = layoutNextLine(prepared, cursor, availableWidth);
    if (line === null) break;

    ctx.fillStyle = "#e8e8f0";
    ctx.font = font;
    ctx.fillText(line.text, margin.x, y + 20);
    cursor = line.end;
    y += lineH;
    lineNum++;

    if (y > cssH - margin.y) break;
  }

  // Line numbers
  ctx.fillStyle = "#2a2a3a";
  ctx.font = '11px "IBM Plex Mono"';
  for (let i = 0; i < lineNum; i++) {
    ctx.fillText(String(i + 1).padStart(2, " "), 8, margin.y + i * lineH + 20);
  }
}

// ─── Demo 5: Live Reflow ───
const reflowText =
  "Pretextは@chenglou氏が開発した、DOMリフローなしでマルチラインテキストの高さを計測できるJavaScriptライブラリです。Canvas APIを利用してテキスト幅を事前計測し、キャッシュすることで、レイアウト計算を純粋な算術演算として実行します。500個のテキストブロックのlayout()にかかる時間はわずか0.09ms。従来のDOM計測では30ms以上かかっていた処理が、300倍以上高速化されます。日本語・中国語・韓国語などのCJKテキスト、アラビア語の双方向テキスト、絵文字にも完全対応。Intl.Segmenterを活用した正確な文字セグメンテーションにより、ブラウザのネイティブレイアウトと高い精度で一致する結果を得られます。";

let reflowPrepared;

function updateReflow() {
  const slider = document.getElementById("width-slider");
  const width = parseInt(slider.value);
  const box = document.getElementById("reflow-box");

  if (!reflowPrepared) {
    reflowPrepared = prepare(reflowText, FONT);
  }

  const start = performance.now();
  const { height, lineCount } = layout(reflowPrepared, width - 48, LINE_HEIGHT);
  const elapsed = performance.now() - start;

  box.style.width = width + "px";
  box.textContent = reflowText;
  box.style.height = height + 48 + "px";

  document.getElementById("reflow-width").textContent = `幅: ${width}px`;
  document.getElementById("reflow-lines").textContent = `${lineCount}行`;
  document.getElementById("reflow-time").textContent = `${elapsed.toFixed(3)}ms`;
}

// ─── Init ───
async function init() {
  await waitForFonts();

  document.getElementById("run-bench").addEventListener("click", runBenchmark);

  buildMasonry();
  buildChat(320);
  drawCanvas();
  updateReflow();

  document.getElementById("col-slider").addEventListener("input", (e) => {
    document.getElementById("col-count").textContent = e.target.value;
    buildMasonry();
  });

  document.getElementById("bubble-width-slider").addEventListener("input", (e) => {
    const w = parseInt(e.target.value);
    document.getElementById("bubble-width-value").textContent = w + "px";
    buildChat(w);
  });

  document.getElementById("width-slider").addEventListener("input", updateReflow);

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      buildMasonry();
      drawCanvas();
    }, 100);
  });

  Prism.highlightAll();
}

init();
