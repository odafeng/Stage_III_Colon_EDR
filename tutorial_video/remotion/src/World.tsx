import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, Easing, OffthreadVideo, staticFile, Sequence } from "remotion";

// ---------------------------------------------------------------------------
// Style A — one continuous world, one camera. No scenes, no crossfades, no
// caption band on the canvas. The narration IS the in-world kinetic content;
// the three real screen recordings are monitors the camera flies into.
// ---------------------------------------------------------------------------

const ACCENT = "#4f9cff", GREEN = "#2ee6a6", PURPLE = "#9b8cff", ORANGE = "#ffa94d", RED = "#ff6b6b", GOLD = "#ffd479";
const FONT = "'PingFang TC','Noto Sans TC',system-ui,sans-serif";
const MONO = "ui-monospace,Menlo,monospace";
const ease = Easing.bezier(0.42, 0, 0.18, 1);
const ease3 = Easing.bezier(0.2, 0.7, 0.2, 1);

const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const rise = (local: number, start: number, dist = 26, dur = 20) => ({
  opacity: interpolate(local, [start, start + dur], [0, 1], clamp),
  transform: `translateY(${interpolate(local, [start, start + dur], [dist, 0], { ...clamp, easing: ease3 })}px)`,
});
const grow = (local: number, start: number, dur = 24) =>
  interpolate(local, [start, start + dur], [0, 1], { ...clamp, easing: ease3 });

// ---- timeline -------------------------------------------------------------
type Seg = { id: string; dur: number; x: number; scale: number; clip?: string; clipFrames?: number; start: number; end: number; clipStart: number };
const LEAD = 24, TAIL = 12;
const RAW: Omit<Seg, "start" | "end" | "clipStart">[] = [
  { id: "open", dur: 360, x: 1200, scale: 1.0 },
  { id: "flow", dur: 430, x: 3600, scale: 1.08 },
  { id: "struct", dur: 520, x: 6000, scale: 1.06 },
  { id: "git", dur: 540, x: 8400, scale: 1.06 },
  { id: "priv", dur: 570, x: 10800, scale: 1.04 },
  { id: "edaDemo", dur: 1115 + LEAD + TAIL, x: 13200, scale: 1.0, clip: "clips/vidEDA.mp4", clipFrames: 1115 },
  { id: "modelDemo", dur: 1044 + LEAD + TAIL, x: 15600, scale: 1.0, clip: "clips/vidModel.mp4", clipFrames: 1044 },
  { id: "verifyDemo", dur: 871 + LEAD + TAIL, x: 18000, scale: 1.0, clip: "clips/vidA.mp4", clipFrames: 871 },
  { id: "rules", dur: 430, x: 20400, scale: 1.08 },
  { id: "start", dur: 520, x: 22800, scale: 1.04 },
  { id: "close", dur: 430, x: 25200, scale: 1.0 },
];
const TRAVEL = 28;
const SEG: Seg[] = [];
{
  let cur = 0;
  for (let i = 0; i < RAW.length; i++) {
    if (i > 0) cur += TRAVEL;
    const r = RAW[i];
    const start = cur;
    const end = cur + r.dur;
    SEG.push({ ...r, start, end, clipStart: start + LEAD });
    cur = end;
  }
}
export const WORLD_TOTAL = SEG[SEG.length - 1].end;
const WORLD_W = 26400;
const byId = (id: string) => SEG.find((s) => s.id === id)!;

// ---- camera keyframes -----------------------------------------------------
const CAM: { f: number; x: number; s: number }[] = [];
const push = (f: number, x: number, s: number) => CAM.push({ f, x, s });
{
  const close = byId("close");
  push(0, SEG[0].x, 0.6);
  push(78, SEG[0].x, SEG[0].scale);
  push(SEG[0].end, SEG[0].x, SEG[0].scale);
  for (let i = 1; i < SEG.length; i++) {
    const p = SEG[i - 1], c = SEG[i];
    push((p.end + c.start) / 2, (p.x + c.x) / 2, Math.min(p.scale, c.scale) * 0.82); // travel dip = real pull-back
    push(c.start, c.x, c.scale * 0.95);
    push(c.start + Math.min(70, c.dur * 0.25), c.x, c.scale);
    if (c.id === "close") {
      push(c.start + 150, c.x, c.scale);
      push(c.start + 320, WORLD_W / 2, (1920 / WORLD_W) * 0.92); // pull all the way back: reveal the whole pipeline
      push(c.end, WORLD_W / 2, (1920 / WORLD_W) * 0.92);
    } else {
      push(c.end, c.x, c.scale);
    }
  }
}
const camAt = (f: number, k: "x" | "s") =>
  interpolate(f, CAM.map((c) => c.f), CAM.map((c) => c[k]), { ...clamp, easing: ease });

// ---- demo captions (from subs/*.srt) --------------------------------------
type Cue = [number, number, string];
const EDA: Cue[] = [
  [0, 3.6, "給 Claude Code 一個 prompt：對去識別化資料做 EDA，寫成 notebook，原始檔唯讀"],
  [3.6, 7.8, "它先摸清楚資料：共 330 筆、40 個欄位"],
  [7.8, 12.4, "看各欄缺失：Chart_No 整欄空白、復發欄位多為空"],
  [12.4, 16.6, "看分布：診斷年份、性別、復發率約 17%"],
  [16.6, 20.9, "做一致性檢查，還抓到 CEA 取對數對不上原值"],
  [20.9, 23.1, "AI 思考、整理結果中"],
  [23.1, 27.3, "寫出 01_eda.ipynb（22 格、4 張圖），原始檔全程沒被改"],
  [27.3, 30.2, "它把發現分三級——紅燈：一定要處理"],
  [30.2, 31.8, "黃燈：要留意（只含第三期、競爭風險）"],
  [31.8, 34.1, "綠燈：已通過檢查"],
  [34.1, 37.2, "重點：AI 標出問題，最後怎麼做由你決定"],
];
const MODEL: Cue[] = [
  [0.4, 4.55, "下一個 prompt：用 recurrence 當結局，抓出「術後一年內復發」的病人，指定四個變數，建一個 logistic regression——而且務必寫成 notebook。"],
  [4.55, 8.71, "AI 先把結局定義清楚：復發日期減手術日期 ≤ 365 天，才算一年內復發。"],
  [8.71, 14.97, "它組好你指定的四個變數，並提醒：CEA 缺 81 筆、事件只有 32、EPV 約 8——偏低，要留意。"],
  [14.97, 18.96, "重點一：要求它把每一步「寫成 notebook」，而不是只在對話裡丟一段答案。"],
  [18.96, 23.74, "模型配適完成，印出每個變數的 OR 與信賴區間。"],
  [23.74, 27.49, "看到 LNR 的 CI 是 0.06 到 389 嗎？這種爆寬的信賴區間，就是樣本太少、模型不穩的警訊——AI 不會替你做臨床判斷。"],
  [27.49, 31.79, "重點二：notebook 一定要你自己打開、逐格檢查——這正是為什麼你需要一點 pandas 與 Python 基礎。"],
  [31.79, 35.0, "所以接下來，我會打開 03_modeling.ipynb，自己跑一遍、逐格確認每一步。"],
];
const VERIFY: Cue[] = [
  [0, 4, "接著就打開剛建好的 03_modeling.ipynb，逐格自己跑一遍（只讀清理好的資料，不動原始檔）"],
  [4, 7, "先確認最關鍵的：outcome 定義對不對、有沒有把「復發日期」這種偷看答案的欄位拿掉"],
  [7, 13, "往下看它怎麼選變數、怎麼建模——重點是每一格我都看得懂、對得上臨床判斷"],
  [13, 14.8, "對照剛剛那張 OR 表，看每個變數讓復發風險增減多少"],
  [14.8, 16.7, "模型表現的數字也親眼確認過（這份合成資料只比亂猜好一點）"],
  [16.7, 18.3, "校準、風險分組這些方法學細節，這支影片就不深入"],
  [18.3, 21.3, "但每一格我都看過，確認程式真的照我要的跑、沒有黑箱"],
  [21.3, 29.05, "檢查完成——流程可重現，原始資料完全沒被動過"],
];

const DemoCaption: React.FC<{ cues: Cue[] }> = ({ cues }) => {
  const f = useCurrentFrame();
  const t = f / 30;
  const cue = cues.find((c) => t >= c[0] && t < c[1]);
  if (!cue) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 58, display: "flex", justifyContent: "center", padding: "0 80px" }}>
      <div style={{ maxWidth: 1520, background: "rgba(6,10,20,.84)", border: "1px solid rgba(120,150,220,.28)", borderRadius: 14, padding: "14px 28px", fontSize: 32, lineHeight: 1.5, color: "#eef2fb", textAlign: "center", fontFamily: FONT, boxShadow: "0 12px 34px rgba(0,0,0,.55)" }}>
        {cue[2]}
      </div>
    </div>
  );
};

// ---- in-world frame wrapper for canvas regions ----------------------------
const Frame: React.FC<{ x: number; children: React.ReactNode }> = ({ x, children }) => (
  <div style={{ position: "absolute", left: x - 960, top: 0, width: 1920, height: 1080 }}>{children}</div>
);
const Eyebrow: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ fontSize: 24, letterSpacing: 8, color: ACCENT, fontWeight: 800, ...style }}>{children}</div>
);

// ===========================================================================
// Region components — each gets its local frame (= globalFrame - seg.start)
// ===========================================================================

const Open: React.FC<{ local: number }> = ({ local }) => (
  <Frame x={byId("open").x}>
    <div style={{ position: "absolute", left: 360, top: 348, width: 1200 }}>
      <div style={{ ...rise(local, 0, 16), fontSize: 24, letterSpacing: 10, color: ACCENT, fontWeight: 800 }}>臨床研究 × AI</div>
      <div style={{ ...rise(local, 8), fontSize: 78, fontWeight: 900, marginTop: 26, lineHeight: 1.18 }}>你不必變成工程師。</div>
      <div style={{ ...rise(local, 42), fontSize: 52, fontWeight: 700, marginTop: 30, color: "#cdd6ea" }}>用白話指揮 AI 寫程式，</div>
      <div style={{ ...rise(local, 74), fontSize: 52, fontWeight: 800, marginTop: 8 }}>
        然後 <span style={{ color: GREEN }}>親自驗收</span>。
      </div>
      <div style={{ ...rise(local, 120), fontSize: 30, marginTop: 34, color: "#8d97b0" }}>把臨床研究，變成一條可重跑的分析流水線。</div>
    </div>
  </Frame>
);

const node = (label: string, sub: string, color: string, on: number, local: number, x: number, pulse = false) => {
  const a = grow(local, on);
  return (
    <div style={{ position: "absolute", left: x - 140, top: 470, width: 280, opacity: a, transform: `scale(${0.85 + a * 0.15})`, transformOrigin: "50% 50%" }}>
      <div style={{ background: "rgba(12,18,38,.9)", border: `2px solid ${color}`, borderRadius: 20, padding: "26px 18px", textAlign: "center", boxShadow: `0 0 ${pulse ? 36 : 18}px ${color}44` }}>
        <div style={{ fontSize: 34, fontWeight: 900, color }}>{label}</div>
        <div style={{ fontSize: 22, color: "#aab4ce", marginTop: 8 }}>{sub}</div>
      </div>
    </div>
  );
};
const Arrow: React.FC<{ x1: number; x2: number; y: number; on: number; local: number; color?: string }> = ({ x1, x2, y, on, local, color = "#6f7fae" }) => {
  const a = grow(local, on, 16);
  return (
    <div style={{ position: "absolute", left: x1, top: y, width: (x2 - x1) * a, height: 3, background: color, transformOrigin: "0 50%" }}>
      <div style={{ position: "absolute", right: -2, top: -6, width: 0, height: 0, borderTop: "8px solid transparent", borderBottom: "8px solid transparent", borderLeft: `12px solid ${color}`, opacity: a > 0.9 ? 1 : 0 }} />
    </div>
  );
};

const Flow: React.FC<{ local: number }> = ({ local }) => {
  const x = byId("flow").x;
  return (
    <Frame x={x}>
      <div style={{ position: "absolute", left: 290, top: 285, ...rise(local, 0, 16) }}>
        <Eyebrow>你的工作方式</Eyebrow>
        <div style={{ fontSize: 50, fontWeight: 900, marginTop: 14 }}>說白話、讓 AI 寫、你來驗收</div>
      </div>
      {node("你", "用白話說需求", ACCENT, 18, local, 420)}
      <Arrow x1={560} x2={820} y={600} on={40} local={local} />
      {node("AI", "寫出程式碼", PURPLE, 50, local, 960)}
      <Arrow x1={1100} x2={1360} y={600} on={72} local={local} />
      {node("你", "親自驗收", GREEN, 84, local, 1500, true)}
      {/* loop-back arrow */}
      <div style={{ position: "absolute", left: 420, top: 760, width: 1080, opacity: grow(local, 120, 20) }}>
        <div style={{ height: 3, background: "#4a567f", position: "relative" }}>
          <div style={{ position: "absolute", left: -2, top: -6, width: 0, height: 0, borderTop: "8px solid transparent", borderBottom: "8px solid transparent", borderRight: "12px solid #4a567f" }} />
        </div>
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 28, color: "#9aa4bd" }}>改一句話，整條再跑一次</div>
      </div>
    </Frame>
  );
};

const treeRows: [string, string, string][] = [
  ["專案/", "", ""],
  ["├─ data/raw/", "原始資料，永不修改", RED],
  ["├─ data/processed/", "清理後的輸出", ""],
  ["├─ notebooks/", "", ""],
  ["├─ figures/   tables/", "", ""],
  ["├─ manuscripts/", "", ""],
  ["└─ requirements.txt", "可重現的環境清單", ""],
];
const Struct: React.FC<{ local: number }> = ({ local }) => (
  <Frame x={byId("struct").x}>
    <div style={{ position: "absolute", left: 360, top: 210, ...rise(local, 0, 16) }}>
      <Eyebrow>地基一 · 結構化資料夾</Eyebrow>
      <div style={{ fontSize: 48, fontWeight: 900, marginTop: 12 }}>每個研究，當成一個專案</div>
    </div>
    <div style={{ position: "absolute", left: 360, top: 380, width: 760, fontFamily: MONO, fontSize: 30, lineHeight: 1.95 }}>
      {treeRows.map((r, i) => (
        <div key={i} style={{ ...rise(local, 30 + i * 10, 14), display: "flex", alignItems: "center", gap: 14, color: r[2] ? "#ffd0cf" : "#cfe0ff" }}>
          <span>{r[0]}</span>
          {r[1] && <span style={{ fontSize: 21, color: r[2] || "#7f8bad", fontFamily: FONT }}>— {r[1]}</span>}
          {r[2] && <span style={{ fontSize: 22 }}>🔒</span>}
        </div>
      ))}
    </div>
    <div style={{ position: "absolute", left: 1220, top: 480, width: 360, ...rise(local, 130, 20) }}>
      <div style={{ fontSize: 32, lineHeight: 1.7, color: "#dbe3f5" }}>
        <span style={{ color: RED, fontWeight: 800 }}>raw 唯讀</span>，所有清理都用程式輸出到 <span style={{ color: GREEN }}>processed</span>。
      </div>
      <div style={{ fontSize: 26, lineHeight: 1.7, color: "#8d97b0", marginTop: 22 }}>可重現，從結構開始。</div>
    </div>
  </Frame>
);

const Git: React.FC<{ local: number }> = ({ local }) => {
  const commits = [["v1.0", "初始分析"], ["v1.1", "加排除條件"], ["v1.2", "重跑全部圖表"]];
  return (
    <Frame x={byId("git").x}>
      <div style={{ position: "absolute", left: 360, top: 250, ...rise(local, 0, 16) }}>
        <Eyebrow>地基二 · Git 與版本控制</Eyebrow>
        <div style={{ fontSize: 48, fontWeight: 900, marginTop: 12 }}>每一步都有存檔點</div>
      </div>
      {/* commit timeline */}
      <div style={{ position: "absolute", left: 360, top: 510, width: 900 }}>
        <div style={{ position: "absolute", left: 0, top: 18, width: 860 * grow(local, 28, 30), height: 4, background: `linear-gradient(90deg,${ACCENT},${PURPLE})` }} />
        {commits.map((c, i) => (
          <div key={i} style={{ position: "absolute", left: i * 300, top: 0, opacity: grow(local, 36 + i * 16, 14) }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#0c1226", border: `3px solid ${ACCENT}`, boxShadow: `0 0 16px ${ACCENT}66` }} />
            <div style={{ marginTop: 14, fontFamily: MONO, fontSize: 26, color: "#cfe0ff", fontWeight: 700 }}>{c[0]}</div>
            <div style={{ fontSize: 20, color: "#8d97b0", marginTop: 4, width: 150 }}>{c[1]}</div>
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 360, top: 720, fontFamily: MONO, fontSize: 28, color: GREEN, ...rise(local, 90, 16) }}>
        git add → commit <span style={{ color: "#8d97b0" }}>（本機存檔點）</span> → push <span style={{ color: "#8d97b0" }}>（送上 GitHub）</span>
      </div>
      <div style={{ position: "absolute", left: 360, top: 784, width: 1200, fontSize: 30, color: "#dbe3f5", lineHeight: 1.6, ...rise(local, 120, 16) }}>
        Git＝本機的存檔點；GitHub＝專案在雲端的家。reviewer 要你重跑？<span style={{ color: GOLD }}>一個指令回到任何版本。</span>
      </div>
    </Frame>
  );
};

const Priv: React.FC<{ local: number }> = ({ local }) => {
  const x = byId("priv").x;
  return (
    <Frame x={x}>
      <div style={{ position: "absolute", left: 360, top: 170, ...rise(local, 0, 16) }}>
        <Eyebrow>地基三 · 病人個資隔離</Eyebrow>
        <div style={{ fontSize: 48, fontWeight: 900, marginTop: 12 }}>資料外洩有兩條路</div>
      </div>
      {/* source box */}
      <div style={{ position: "absolute", left: 230, top: 503, width: 260, padding: "26px 0", textAlign: "center", borderRadius: 18, background: "rgba(255,107,107,.12)", border: `2px solid ${RED}`, opacity: grow(local, 20) }}>
        <div style={{ fontSize: 30, fontWeight: 800, color: "#ffd0cf" }}>病人個資</div>
        <div style={{ fontSize: 20, color: "#aeb8d0", marginTop: 6 }}>姓名 · 病歷號 · 生日</div>
      </div>
      {/* path 1: GitHub blocked */}
      <Arrow x1={490} x2={760} y={500} on={40} local={local} color="#6f7fae" />
      <div style={{ position: "absolute", left: 770, top: 450, width: 380, opacity: grow(local, 60, 16) }}>
        <div style={{ fontSize: 30, fontWeight: 800 }}>① GitHub</div>
        <div style={{ fontSize: 25, color: GREEN, marginTop: 6 }}>✓ 用 .gitignore 把 data/ 關在門外</div>
      </div>
      {/* path 2: cloud AI passes through */}
      <Arrow x1={490} x2={760} y={640} on={64} local={local} color={ORANGE} />
      <div style={{ position: "absolute", left: 770, top: 590, width: 460, opacity: grow(local, 86, 16) }}>
        <div style={{ fontSize: 30, fontWeight: 800 }}>② 雲端 AI</div>
        <div style={{ fontSize: 25, color: ORANGE, marginTop: 6 }}>✗ .gitignore 擋不住——AI 用你的權限直接讀檔</div>
      </div>
      <div style={{ position: "absolute", left: 230, top: 780, width: 1480, ...rise(local, 120, 18) }}>
        <div style={{ fontSize: 40, fontWeight: 900, lineHeight: 1.4 }}>
          資料夾不是圍牆。<span style={{ color: GOLD }}>個資與雲端 AI，永遠不要在同一台機器。</span>
        </div>
        <div style={{ fontSize: 26, color: "#8d97b0", marginTop: 16 }}>去識別化在院內完成；姓名、病歷號 → 研究編號，對照表永遠留在院內。</div>
      </div>
    </Frame>
  );
};

const Monitor: React.FC<{ seg: Seg; cues: Cue[]; tag: string }> = ({ seg, cues, tag }) => {
  const f = useCurrentFrame();
  const playing = f >= seg.clipStart && f < seg.clipStart + (seg.clipFrames || 0);
  return (
    <div style={{ position: "absolute", left: seg.x - 992, top: -32, width: 1984, height: 1144, borderRadius: 22, background: "#05070e", border: "2px solid rgba(120,150,220,.35)", boxShadow: "0 40px 120px rgba(0,0,0,.6)", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 32, top: 32, width: 1920, height: 1080, overflow: "hidden", background: playing ? "#000" : "linear-gradient(135deg,#0c1730,#070d1c)" }}>
        {playing && (
          <Sequence from={seg.clipStart} durationInFrames={seg.clipFrames} layout="none">
            <OffthreadVideo src={staticFile(seg.clip!)} style={{ width: 1920, height: 1080, objectFit: "fill" }} />
            <DemoCaption cues={cues} />
          </Sequence>
        )}
        {!playing && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24, color: "#6b7ba8", fontFamily: MONO, letterSpacing: 6 }}>
            <div style={{ fontSize: 64, color: ACCENT, opacity: 0.7 }}>▶</div>
            <div style={{ fontSize: 48 }}>{tag}</div>
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, top: 0, backgroundImage: "repeating-linear-gradient(0deg, rgba(120,150,220,.05) 0px, rgba(120,150,220,.05) 2px, transparent 2px, transparent 6px)" }} />
          </div>
        )}
      </div>
    </div>
  );
};

const Rules: React.FC<{ local: number }> = ({ local }) => {
  const cards = [
    ["①", "一定要寫成 notebook", "要求 AI 把每一步存成 .ipynb，而不是在對話裡丟一段答案——這樣才能重跑、才留得下證據。", ACCENT],
    ["②", "一定要自己打開檢查", "逐格跑過、看懂每一步。AI 不會替你做臨床判斷，最後拍板的是主治醫師。", GREEN],
  ];
  return (
    <Frame x={byId("rules").x}>
      <div style={{ position: "absolute", left: 360, top: 280, ...rise(local, 0, 16) }}>
        <Eyebrow>兩個鐵則</Eyebrow>
        <div style={{ fontSize: 48, fontWeight: 900, marginTop: 12 }}>方便，不能用安全去換</div>
      </div>
      {cards.map((c, i) => (
        <div key={i} style={{ position: "absolute", left: 360 + i * 620, top: 480, width: 560, padding: "34px 36px", borderRadius: 22, background: "rgba(12,18,38,.88)", border: `2px solid ${c[3]}55`, ...rise(local, 30 + i * 28, 30) }}>
          <div style={{ fontSize: 56, fontWeight: 900, color: c[3] }}>{c[0]}</div>
          <div style={{ fontSize: 36, fontWeight: 800, marginTop: 14 }}>{c[1]}</div>
          <div style={{ fontSize: 26, color: "#aeb8d0", marginTop: 18, lineHeight: 1.7 }}>{c[2]}</div>
        </div>
      ))}
    </Frame>
  );
};

const Start: React.FC<{ local: number }> = ({ local }) => {
  const steps = [
    ["用 Google Colab 起步", "打開瀏覽器就能寫，套件都裝好了——把時間花在分析，不是修環境。"],
    ["不會裝環境？叫 AI 幫你建", "連需要哪種程式語言都不用先懂，AI 會偵測並幫你安裝。"],
    ["投資一點基礎", "一點 pandas 與 Python ＋ 你的臨床判斷——這是 AI 取代不了的部分。"],
  ];
  return (
    <Frame x={byId("start").x}>
      <div style={{ position: "absolute", left: 360, top: 235, ...rise(local, 0, 16) }}>
        <Eyebrow>怎麼開始</Eyebrow>
        <div style={{ fontSize: 48, fontWeight: 900, marginTop: 12 }}>今天就能跨出第一步</div>
      </div>
      {steps.map((s, i) => (
        <div key={i} style={{ position: "absolute", left: 360, top: 420 + i * 168, width: 1200, display: "flex", gap: 26, alignItems: "flex-start", ...rise(local, 34 + i * 26, 24) }}>
          <div style={{ width: 56, height: 56, flexShrink: 0, borderRadius: "50%", background: ACCENT, color: "#06101f", fontWeight: 900, fontSize: 30, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</div>
          <div>
            <div style={{ fontSize: 36, fontWeight: 800 }}>{s[0]}</div>
            <div style={{ fontSize: 27, color: "#aeb8d0", marginTop: 8, lineHeight: 1.6 }}>{s[1]}</div>
          </div>
        </div>
      ))}
    </Frame>
  );
};

// ===========================================================================
// World — spine + stations always present; regions + monitors placed in world
// ===========================================================================
export const World: React.FC = () => {
  const f = useCurrentFrame();
  const camX = camAt(f, "x");
  const s = camAt(f, "s");
  const camY = 540; // no ambient drift — text must sit perfectly still while being read
  const tx = 960 - camX * s, ty = 540 - camY * s;
  const px = tx * 0.4, py = ty * 0.4;

  const trackProgress = interpolate(f, [60, byId("close").start + 120], [0, 1], clamp);
  const close = byId("close");
  const pulse = interpolate(f, [close.start + 320, close.end], [400, WORLD_W - 400], clamp);
  const wide = interpolate(f, [close.start + 250, close.start + 340], [0, 1], clamp);
  const finale = interpolate(f, [close.start + 350, close.start + 400], [0, 1], clamp);
  const spineOp = interpolate(s, [0.75, 1.0], [1, 0.1], clamp); // bright when pulled back, faint on close-ups

  return (
    <AbsoluteFill style={{ background: "radial-gradient(1500px 1000px at 50% 42%, #101a3a, #070b16 72%)", fontFamily: FONT, color: "#eef2fb", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `translate(${px}px,${py}px)`, backgroundImage: "radial-gradient(rgba(255,255,255,.1) 1.4px, transparent 1.4px)", backgroundSize: "130px 130px", opacity: 0.45 }} />

      <div style={{ position: "absolute", left: 0, top: 0, width: WORLD_W, height: 1080, transform: `translate(${tx}px,${ty}px) scale(${s})`, transformOrigin: "0 0" }}>
        {/* pipeline spine — fades out when the camera pushes into content */}
        <div style={{ position: "absolute", left: 300, top: 536, width: WORLD_W - 600, height: 8, borderRadius: 4, background: "linear-gradient(90deg,#16213f,#243663,#16213f)", opacity: spineOp }} />
        <div style={{ position: "absolute", left: 300, top: 536, width: (WORLD_W - 600) * trackProgress, height: 8, borderRadius: 4, background: `linear-gradient(90deg,${ACCENT},${PURPLE},${ORANGE},${GREEN})`, boxShadow: `0 0 26px ${ACCENT}88`, opacity: spineOp }} />
        {SEG.map((g) => {
          const lit = interpolate(f, [g.start - 30, g.start], [0.25, 1], clamp);
          return <div key={g.id} style={{ position: "absolute", left: g.x - 11, top: 536 + 4 - 11, width: 22, height: 22, borderRadius: "50%", background: ACCENT, opacity: (0.35 + lit * 0.65) * spineOp, boxShadow: `0 0 ${18 * lit}px ${ACCENT}` }} />;
        })}
        {f > close.start + 318 && <div style={{ position: "absolute", left: pulse - 8, top: 536 - 4, width: 16, height: 16, borderRadius: "50%", background: "#fff", boxShadow: `0 0 30px 10px ${GREEN}` }} />}

        {/* canvas regions */}
        <Open local={f - byId("open").start} />
        <Flow local={f - byId("flow").start} />
        <Struct local={f - byId("struct").start} />
        <Git local={f - byId("git").start} />
        <Priv local={f - byId("priv").start} />
        <Rules local={f - byId("rules").start} />
        <Start local={f - byId("start").start} />

        {/* demo monitors */}
        <Monitor seg={byId("edaDemo")} cues={EDA} tag="● EDA" />
        <Monitor seg={byId("modelDemo")} cues={MODEL} tag="● MODELING" />
        <Monitor seg={byId("verifyDemo")} cues={VERIFY} tag="● VERIFY" />

        {/* station labels visible on the wide reveal */}
        {[["原始資料", byId("open").x], ["指揮", byId("flow").x], ["結構", byId("struct").x], ["Git", byId("git").x], ["個資", byId("priv").x], ["EDA", byId("edaDemo").x], ["建模", byId("modelDemo").x], ["驗收", byId("verifyDemo").x], ["鐵則", byId("rules").x], ["起步", byId("start").x]].map((l, i) => (
          <div key={i} style={{ position: "absolute", left: (l[1] as number) - 100, top: 470, width: 200, textAlign: "center", fontSize: 30, fontWeight: 800, color: "#cfe0ff", opacity: wide }}>{l[0] as string}</div>
        ))}
      </div>

      {/* screen-space finale */}
      <div style={{ position: "absolute", left: 0, top: 150, width: "100%", textAlign: "center", opacity: interpolate(f, [close.start, close.start + 40, close.start + 230, close.start + 280], [0, 1, 1, 0], clamp) }}>
        <div style={{ fontSize: 56, fontWeight: 900 }}>Vibe coding —— 但要 <span style={{ color: GREEN }}>親自驗收</span>。</div>
      </div>
      <div style={{ position: "absolute", left: 0, bottom: 210, width: "100%", textAlign: "center", opacity: finale, transform: `translateY(${(1 - finale) * 20}px)` }}>
        <div style={{ fontSize: 46, fontWeight: 800 }}>可重現 · 透明 · <span style={{ color: ACCENT }}>完全由你掌控</span></div>
        <div style={{ fontSize: 26, color: "#8d97b0", marginTop: 28 }}>本影片所有資料與成果皆為虛構合成，僅供教學使用</div>
      </div>
    </AbsoluteFill>
  );
};
