import { setLocale } from "@chenglou/pretext";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";

setLocale("ja");

export const FONT = '16px "Noto Sans JP"';
export const LINE_HEIGHT = 28;

export const jaTexts = [
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

export const chatMessages = [
  { side: "left", text: "ねえ、Pretextって知ってる？" },
  { side: "right", text: "DOMのリフローなしでテキストの高さを計測できるライブラリだよね！" },
  { side: "left", text: "そう！Canvas APIを使って計測するから、500個のテキストブロックでも0.09msで再計算できるんだって" },
  { side: "right", text: "日本語のCJK文字にも対応してるの？" },
  { side: "left", text: "もちろん！Intl.Segmenterを使ってるから、日本語・中国語・韓国語・アラビア語・絵文字まで全部OK" },
  { side: "right", text: "最高じゃん" },
  { side: "left", text: "しかもlayoutNextLineを使えば、画像の回り込みレイアウトもできる。CSSのfloatみたいなことがCanvas上で実現できるよ" },
  { side: "right", text: "マジで革命的" },
];

export async function waitForFonts() {
  await document.fonts.ready;
  await document.fonts.load('16px "Noto Sans JP"', "テスト");
  await document.fonts.load('14px "Noto Sans JP"', "テスト");
  await document.fonts.load('18px "Noto Sans JP"', "テスト");
}

export function el(tag, attrs = {}, children = []) {
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

export function highlight() {
  Prism.highlightAll();
}
