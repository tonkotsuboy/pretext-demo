import { prepare, layout } from "@chenglou/pretext";
import { FONT, LINE_HEIGHT, waitForFonts, highlight } from "./shared.js";

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

async function init() {
  await waitForFonts();
  updateReflow();
  document.getElementById("width-slider").addEventListener("input", updateReflow);
  highlight();
}

init();
