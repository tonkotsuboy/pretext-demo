import { prepare, layout } from "@chenglou/pretext";
import { FONT, LINE_HEIGHT, jaTexts, waitForFonts, el, highlight } from "./shared.js";

function runBenchmark() {
  const texts = [];
  for (let i = 0; i < 500; i++) {
    texts.push(jaTexts[i % jaTexts.length]);
  }

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

  const prepStart = performance.now();
  const prepared = texts.map((t) => prepare(t, FONT));
  const prepTime = performance.now() - prepStart;

  const layoutStart = performance.now();
  for (const p of prepared) {
    layout(p, 300, LINE_HEIGHT);
  }
  const layoutTime = performance.now() - layoutStart;

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

async function init() {
  await waitForFonts();
  document.getElementById("run-bench").addEventListener("click", runBenchmark);
  highlight();
}

init();
