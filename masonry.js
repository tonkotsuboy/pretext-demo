import { prepare, layout } from "@chenglou/pretext";
import { jaTexts, waitForFonts, el, highlight } from "./shared.js";

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

async function init() {
  await waitForFonts();
  buildMasonry();

  document.getElementById("col-slider").addEventListener("input", (e) => {
    document.getElementById("col-count").textContent = e.target.value;
    buildMasonry();
  });

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(buildMasonry, 100);
  });

  highlight();
}

init();
