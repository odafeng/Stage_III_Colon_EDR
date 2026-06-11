import React from "react";
import { HybridOpen } from "../HybridOpen";
import { Scene, Heading, Divider, CardGrid, Compare, FlowSteps, BulletRows, CodeCard, Lead, Note } from "../components";
import { ACCENT, GREEN, PURPLE, RED, ORANGE } from "../theme";

export type DeckScene = { dur: number; node: React.ReactNode };

const BG_DATA = "bg_data.mp4", BG_CODE = "bg_code.mp4", BG_SEC = "bg_secure.mp4", BG_MODEL = "bg_model.mp4", BG_PIPE = "bg_pipe.mp4";

// =====================================================================
// NEW STRUCTURE (2026-06): one spine — three foundations for a clinician
//   0  cold open (Veo + Vibe Coding hook + title)
//   1  concept: you direct AI + verify
//   2  the three foundations (preview)
//   3-4  FOUNDATION ONE  結構化資料夾
//   5-7  FOUNDATION TWO  Git 與版本控制
//   8-10 FOUNDATION THREE 病人個資隔離
//   11   demo lead-in            -> [vidEDA] [vidModel]
//   12   two rules (notebook+verify) -> [vidA]
//   13-15 how to start / payoff / outro
// =====================================================================
export const SCENES: Record<number, DeckScene> = {
  0: { dur: 510, node: <HybridOpen /> },

  1: {
    dur: 200,
    node: (
      <Scene bg={BG_CODE} caption="你不必變成工程師。你用白話說出要什麼，AI 把它寫成程式；你負責讀懂、驗收。就像指揮一個不會累的住院醫師——但簽名的人，是你。">
        <Lead top={300} size={54}>你不必變成<span style={{ color: ACCENT }}>工程師</span></Lead>
        <Note top={450} delay={14}>你用白話說出要什麼，AI 把它寫成程式；你負責<b style={{ color: "#fff" }}>讀懂、驗收</b>。<br />就像指揮一個不會累的住院醫師——但<b style={{ color: "#fff" }}>簽名的人，是你</b>。</Note>
      </Scene>
    ),
  },
  2: {
    dur: 260,
    node: (
      <Scene bg={BG_DATA} caption="要安全、可重現地把 AI 帶進研究，先打好三個地基：結構化資料夾、Git 版本控制、病人個資隔離。">
        <Heading>要做得「對」，先打好<span style={{ color: GREEN }}>三個地基</span></Heading>
        <CardGrid
          top={370}
          cardW={440}
          cards={[
            { icon: "🗂️", title: "結構化資料夾", color: ACCENT, body: "東西永遠找得到、能重現" },
            { icon: "🕘", title: "Git 版本控制", color: PURPLE, body: "每次改動都有紀錄、能還原" },
            { icon: "🔒", title: "病人個資隔離", color: GREEN, body: "個資永遠不進這個流程" },
          ]}
        />
      </Scene>
    ),
  },

  // ==== FOUNDATION ONE 結構化資料夾 ====
  3: { dur: 90, node: <Divider bg={BG_DATA} num="01" en="FOUNDATION ONE" title="結構化資料夾" caption="" /> },
  4: {
    dur: 330,
    node: (
      <Scene bg={BG_DATA} caption="固定的資料夾結構：raw 原始資料唯讀（像病歷正本不能塗改）、processed 放程式輸出、figures／tables／notebooks 各就各位。可重現，從這個結構開始。">
        <Heading>把每個研究，當成一個<span style={{ color: ACCENT }}>專案</span></Heading>
        <CodeCard
          top={300}
          w={1000}
          lines={[
            <span key="a">📁 project/</span>,
            <span key="b">├── 📂 data/</span>,
            <span key="c" style={{ color: "#ff8a8a" }}>│   ├── 🔒 raw/{"        "}# 唯讀，永不直接改</span>,
            <span key="d">│   └── ⚙️ processed/{"  "}# 程式輸出的副本</span>,
            <span key="e">├── 📊 figures/{"   "}📋 tables/</span>,
            <span key="f">├── 📓 notebooks/</span>,
            <span key="g">└── 📋 requirements.txt</span>,
          ]}
        />
        <Note top={820} delay={26} size={29}>鐵律：<b style={{ color: "#ff8a8a" }}>raw 原始資料唯讀</b>——像病歷正本不能塗改。所有清理都輸出到 processed 副本。可重現，從這裡開始。</Note>
      </Scene>
    ),
  },

  // ==== FOUNDATION TWO Git 與版本控制 ====
  5: { dur: 90, node: <Divider bg={BG_CODE} num="02" en="FOUNDATION TWO" title="Git 與版本控制" caption="" /> },
  6: {
    dur: 270,
    node: (
      <Scene bg={BG_CODE} caption="先分清楚：Git 是版本控制「工具」，跑在你自己的電腦上；GitHub 是雲端平台，是你專案在網路上的家，可以備份、分享、協作。">
        <Heading>先分清楚：<span style={{ color: ACCENT }}>Git</span> 和 <span style={{ color: PURPLE }}>GitHub</span></Heading>
        <Compare
          top={350}
          colW={620}
          cols={[
            { title: "Git", tag: "版本控制「工具」", tone: "neutral", items: ["跑在你自己的電腦上", "幫每次修改存檔、能退回"] },
            { title: "GitHub", tag: "雲端平台", tone: "neutral", items: ["你專案在網路上的家", "備份、分享、協作"] },
          ]}
        />
      </Scene>
    ),
  },
  7: {
    dur: 360,
    node: (
      <Scene bg={BG_CODE} caption="版本控制就是你的存檔點：改完存 1.0、再改存 1.1，改壞了一個指令就退回。add 裝箱、commit 封箱貼標籤、push 寄到 GitHub——每次 commit 都是可回去的存檔點，也是 reviewer 要的『可重現』。">
        <Heading>版本控制：你的<span style={{ color: GREEN }}>存檔點</span></Heading>
        <FlowSteps
          top={350}
          delay={12}
          steps={[
            { big: "git add", sm: "裝進箱子 📦", color: ACCENT },
            { big: "git commit", sm: "封箱貼標籤 🏷️", color: PURPLE },
            { big: "git push", sm: "寄到 GitHub ☁️", color: GREEN },
          ]}
        />
        <Note top={560} delay={40}>改完存 1.0、再改存 1.1，改壞了一個指令就退回。每次 commit 都是<b style={{ color: "#fff" }}>可回去的存檔點</b>——也是 reviewer 要的「可重現」。</Note>
      </Scene>
    ),
  },

  // ==== FOUNDATION THREE 病人個資隔離 ====
  8: { dur: 90, node: <Divider bg={BG_SEC} num="03" en="FOUNDATION THREE" title="病人個資隔離" caption="" /> },
  9: {
    dur: 300,
    node: (
      <Scene bg={BG_SEC} caption="鐵則：病人個資永遠不進這個流程。去識別化在院內完成——姓名／病歷號／身分證換成研究編號、出生年月日換成年齡、日期換成相對天數，對照表留在院內。">
        <Heading>個資，<span style={{ color: RED }}>永遠不進這個流程</span></Heading>
        <BulletRows
          top={340}
          delay={12}
          rows={[
            { icon: "🆔", color: ACCENT, body: <>姓名 · 病歷號 · 身分證字號　→　<b style={{ color: "#fff" }}>研究編號</b></> },
            { icon: "🎂", color: ACCENT, body: <>出生年月日　→　<b style={{ color: "#fff" }}>年齡</b></> },
            { icon: "📅", color: ACCENT, body: <>就診日期　→　<b style={{ color: "#fff" }}>相對天數</b></> },
            { icon: "🏥", color: GREEN, body: <>對照表留在院內，<b style={{ color: "#fff" }}>永遠不放進專案資料夾</b>。</> },
          ]}
        />
      </Scene>
    ),
  },
  10: {
    dur: 330,
    node: (
      <Scene bg={BG_SEC} caption="外洩有兩條路：第一條是 GitHub，用 .gitignore 把 data／關掉；第二條是 AI 本身——它用你的權限讀檔，資料夾不是圍牆。最可靠的是：個資和雲端 AI，永遠不要放在同一台機器。">
        <Heading>外洩有<span style={{ color: ORANGE }}>兩條路</span></Heading>
        <Compare
          top={340}
          colW={620}
          cols={[
            { title: "路徑一：GitHub", tag: "擋得住", tone: "good", items: ["用 .gitignore 把 data/ 關掉", "不會被追蹤、不會上傳"] },
            { title: "路徑二：AI", tag: "資料夾不是圍牆", tone: "warn", items: ["它用你的權限讀檔", "讀取不受資料夾限制"] },
          ]}
        />
        <Note top={820} delay={30} size={29}>最可靠的：個資 和 雲端 AI，<b style={{ color: "#fff" }}>永遠不要放在同一台機器</b>。</Note>
      </Scene>
    ),
  },

  // ==== 實際長怎樣 + 驗收（真實錄影） ====
  11: {
    dur: 210,
    node: (
      <Scene bg={BG_DATA} caption="三個地基打好了，來看實際怎麼跑。接下來都是真實畫面：用白話指揮 AI，然後親自驗收。">
        <Lead top={340} size={52}>三個地基打好了——<br />來看<span style={{ color: ACCENT }}>實際怎麼跑</span></Lead>
        <Note top={560} delay={18}>接下來都是真實畫面：用白話指揮 AI，然後<b style={{ color: "#fff" }}>親自驗收</b>。</Note>
      </Scene>
    ),
  },
  // -> clips: vidEDA, vidModel
  12: {
    dur: 240,
    node: (
      <Scene bg={BG_MODEL} caption="交給 AI 的兩個鐵則：① 一定要它寫成 notebook，而不是只丟一段結果；② 你一定要自己打開、逐格檢查。這就是為什麼你需要一點 Python——是看得懂，不是從零寫。">
        <Heading>交給 AI 的<span style={{ color: GREEN }}>兩個鐵則</span></Heading>
        <BulletRows
          top={350}
          delay={12}
          rows={[
            { icon: "①", color: GREEN, title: "一定要它「寫成 notebook」", body: "而不是只在對話框丟你一段結果。" },
            { icon: "②", color: GREEN, title: "你一定要自己「打開、逐格檢查」", body: "outcome 定義、每個係數，都要對得上你的臨床判斷。" },
          ]}
        />
        <Note top={780} delay={30} size={29}>所以你需要一點 Python——是<b style={{ color: "#fff" }}>看得懂</b>，不是從零寫。</Note>
      </Scene>
    ),
  },
  // -> clip: vidA

  // ==== 怎麼開始 / 收尾 ====
  13: {
    dur: 300,
    node: (
      <Scene bg={BG_PIPE} caption="不會程式怎麼開始？不用裝嚇人的東西：開瀏覽器用 Google Colab，或叫 AI 幫你建環境。先把資料夾和 git 建好，再從一個 EDA 開始。你要投資的只有兩樣：看得懂 notebook 的基礎 Python，加上你本來就有的臨床判斷。">
        <Heading>不會程式，<span style={{ color: ACCENT }}>怎麼開始？</span></Heading>
        <BulletRows
          top={350}
          delay={12}
          rows={[
            { icon: "☁️", color: ACCENT, body: <>不用裝嚇人的東西：開瀏覽器用 <b style={{ color: "#fff" }}>Google Colab</b>，或直接叫 AI 幫你建環境。</> },
            { icon: "🧱", color: PURPLE, body: <>先把<b style={{ color: "#fff" }}>資料夾 + git</b> 建好，再從一個 <b style={{ color: "#fff" }}>EDA</b> 開始。</> },
            { icon: "📈", color: GREEN, body: <>投資兩樣：<b style={{ color: "#fff" }}>看得懂 notebook 的基礎 Python</b> ＋ 你本來就有的臨床判斷。</> },
          ]}
        />
      </Scene>
    ),
  },
  14: {
    dur: 240,
    node: (
      <Scene bg={BG_PIPE} caption="你換到的是：100% 可重現的分析、附上 code 最透明（reviewer 質疑也不怕）、而且完全由你掌控。">
        <Heading>你<span style={{ color: GREEN }}>換到的</span></Heading>
        <BulletRows
          top={360}
          delay={12}
          rows={[
            { icon: "🔁", color: ACCENT, body: <><b style={{ color: "#fff" }}>100% 可重現</b>的分析，誰跑、何時跑都一樣。</> },
            { icon: "🔍", color: PURPLE, body: <>附上 code <b style={{ color: "#fff" }}>最透明</b>，reviewer 質疑方法學也不怕。</> },
            { icon: "🎯", color: GREEN, body: <>整個流程<b style={{ color: "#fff" }}>完全由你掌控</b>。</> },
          ]}
        />
      </Scene>
    ),
  },
  15: {
    dur: 210,
    node: (
      <Scene bg={BG_PIPE} brand={false} caption="">
        <Lead top={360} size={96}><span style={{ background: "linear-gradient(100deg,#7db4ff,#b9a8ff 55%,#7df0c8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Reproducible.</span></Lead>
        <Note top={520} delay={16} size={34}>可重現 · 透明 · <b style={{ color: "#fff" }}>完全由你掌控</b></Note>
        <div style={{ position: "absolute", left: 0, top: 980, width: "100%", textAlign: "center", fontSize: 20, color: "#6b7590" }}>
          本影片所有資料與成果皆為虛構合成，僅供教學使用
        </div>
      </Scene>
    ),
  },
};
