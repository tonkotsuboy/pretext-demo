import { prepareWithSegments, layout } from "@chenglou/pretext";
import { chatMessages, waitForFonts, el, highlight } from "./shared.js";

const bubbleFont = '14px "Noto Sans JP"';
const bubblePadding = 32;
const bubbleLineH = 24;

let preparedBubbles = [];
let cssBubbleEls = [];
let ptBubbleEls = [];
let ptMetaEls = [];

function initChat() {
  const cssContainer = document.getElementById("chat-css");
  const ptContainer = document.getElementById("chat-pretext");

  for (let i = 0; i < chatMessages.length; i++) {
    const { side, text } = chatMessages[i];
    preparedBubbles.push(prepareWithSegments(text, bubbleFont));

    const cssMeta = el("div", { className: "bubble-meta", textContent: "fit-content" });
    const cssBubble = el("div", { className: `bubble ${side}` }, [text, cssMeta]);
    cssBubble.style.width = "fit-content";
    cssContainer.appendChild(cssBubble);
    cssBubbleEls.push(cssBubble);

    const ptMeta = el("div", { className: "bubble-meta" });
    const ptBubble = el("div", { className: `bubble ${side}` }, [text, ptMeta]);
    ptContainer.appendChild(ptBubble);
    ptBubbleEls.push(ptBubble);
    ptMetaEls.push(ptMeta);
  }
}

function updateChat(maxWidth) {
  const textMaxW = maxWidth - bubblePadding;

  for (let i = 0; i < chatMessages.length; i++) {
    cssBubbleEls[i].style.maxWidth = maxWidth + "px";
    cssBubbleEls[i].style.width = "fit-content";

    const prepared = preparedBubbles[i];
    const baseLineCount = layout(prepared, textMaxW, bubbleLineH).lineCount;

    let lo = 60;
    let hi = textMaxW;
    let bestW = textMaxW;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (layout(prepared, mid, bubbleLineH).lineCount <= baseLineCount) {
        bestW = mid;
        hi = mid - 1;
      } else {
        lo = mid + 1;
      }
    }

    const tightWidth = bestW + bubblePadding;
    ptBubbleEls[i].style.maxWidth = tightWidth + "px";
    ptBubbleEls[i].style.width = tightWidth + "px";
    ptMetaEls[i].textContent = `${baseLineCount}行 / 幅${tightWidth}px (shrinkwrap)`;
  }
}

async function init() {
  await waitForFonts();
  initChat();
  updateChat(320);

  document.getElementById("bubble-width-slider").addEventListener("input", (e) => {
    const w = parseInt(e.target.value);
    document.getElementById("bubble-width-value").textContent = w + "px";
    updateChat(w);
  });

  highlight();
}

init();
