import { prepareWithSegments, layoutNextLine } from "@chenglou/pretext";
import { waitForFonts, highlight } from "./shared.js";

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

  ctx.fillStyle = "#12121a";
  ctx.fillRect(0, 0, cssW, cssH);

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

  ctx.fillStyle = "#2a2a3a";
  ctx.font = '11px "IBM Plex Mono"';
  for (let i = 0; i < lineNum; i++) {
    ctx.fillText(String(i + 1).padStart(2, " "), 8, margin.y + i * lineH + 20);
  }
}

async function init() {
  await waitForFonts();
  drawCanvas();

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(drawCanvas, 100);
  });

  highlight();
}

init();
