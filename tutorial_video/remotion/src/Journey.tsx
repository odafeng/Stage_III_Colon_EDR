import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";

const ACCENT = "#4f9cff", GREEN = "#2ee6a6", PURPLE = "#9b8cff", ORANGE = "#ffa94d", RED = "#ff6b6b";
const FONT = "'PingFang TC','Noto Sans TC',system-ui,sans-serif";
const MONO = "ui-monospace,Menlo,monospace";

const WORLD_W = 6200;
const ease = Easing.bezier(0.5, 0, 0.2, 1);

// ---- camera path: [frame, worldX, scale] ; y stays ~540 with a tiny drift ----
const CAM: [number, number, number][] = [
  [0, 3100, 0.4], [55, 3100, 0.4],
  [130, 760, 1.05], [185, 760, 1.05],
  [255, 1880, 1.05], [305, 1880, 1.05],
  [375, 3080, 1.05], [425, 3080, 1.05],
  [495, 4280, 1.05], [545, 4280, 1.05],
  [615, 5480, 1.05], [675, 5480, 1.05],
  [760, 3100, 0.42], [1000, 3100, 0.42],
];
const camAt = (f: number, i: 1 | 2) =>
  interpolate(f, CAM.map((k) => k[0]), CAM.map((k) => k[i]), { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });

const STATIONS = [
  { x: 760, label: "Raw Data", sub: "原始資料", color: ACCENT },
  { x: 1880, label: "EDA", sub: "探索", color: PURPLE },
  { x: 3080, label: "Cleaning", sub: "清理", color: "#7db4ff" },
  { x: 4280, label: "Model", sub: "建模", color: ORANGE },
  { x: 5480, label: "Validate", sub: "驗證", color: GREEN },
];
const arrival = [130, 255, 375, 495, 615];

// ---- per-station mini visualisations (animate from local frame) ----------
const Viz: React.FC<{ idx: number; local: number }> = ({ idx, local }) => {
  if (idx === 0) {
    // messy spreadsheet materialising, two red missing cells
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,64px)", gap: 8 }}>
        {Array.from({ length: 16 }).map((_, i) => {
          const a = interpolate(local, [6 + i * 2.5, 16 + i * 2.5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const miss = i === 5 || i === 10;
          return <div key={i} style={{ height: 34, borderRadius: 6, opacity: a, transform: `scale(${0.6 + a * 0.4})`, background: miss ? "rgba(255,107,107,.25)" : "rgba(255,255,255,.12)", border: `1px solid ${miss ? RED : "rgba(255,255,255,.18)"}` }} />;
        })}
      </div>
    );
  }
  if (idx === 1) {
    // distribution bars growing
    const hs = [70, 130, 180, 120, 60];
    return (
      <div style={{ display: "flex", alignItems: "flex-end", gap: 16, height: 200 }}>
        {hs.map((h, i) => {
          const a = interpolate(local, [8 + i * 6, 26 + i * 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return <div key={i} style={{ width: 46, height: h * a, borderRadius: 8, background: `linear-gradient(180deg,${PURPLE},#5a4fd0)` }} />;
        })}
      </div>
    );
  }
  if (idx === 2) {
    // a red (dirty) cell turns clean/green
    const t = interpolate(local, [20, 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const col = t < 0.5 ? RED : GREEN;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
        <div style={{ width: 150, height: 150, borderRadius: 18, background: `${col}26`, border: `2px solid ${col}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 60 }}>{t < 0.5 ? "✗" : "✓"}</div>
        <div style={{ fontSize: 34, color: col, fontFamily: MONO }}>{t < 0.5 ? "NaN" : "clean"}</div>
      </div>
    );
  }
  if (idx === 3) {
    // OR rows appearing; last (LNR) flagged red — ties to the real content
    const rows = [["T_stage", "0.84", false], ["N_stage", "0.59", false], ["Log_CEA", "1.33", false], ["LNR", "4.89  ⚠", true]] as const;
    return (
      <div style={{ fontFamily: MONO, fontSize: 30 }}>
        {rows.map((r, i) => {
          const a = interpolate(local, [10 + i * 8, 24 + i * 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return <div key={i} style={{ opacity: a, transform: `translateX(${(1 - a) * 20}px)`, color: r[2] ? RED : "#cfe", lineHeight: 1.7 }}>{r[0].padEnd(10)} OR {r[1]}</div>;
        })}
      </div>
    );
  }
  // idx 4: validate check draws in
  const a = interpolate(local, [10, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 130, color: GREEN, transform: `scale(${0.5 + a * 0.5})`, opacity: a }}>✓</div>
      <div style={{ fontSize: 26, color: "#9aa4bd", fontFamily: MONO, marginTop: 8, opacity: interpolate(local, [30, 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>hold-out 2021</div>
    </div>
  );
};

export const Journey: React.FC = () => {
  const f = useCurrentFrame();
  const camX = camAt(f, 1);
  const s = camAt(f, 2);
  const camY = 540 + Math.sin(f / 38) * 16; // never perfectly still
  const tx = 960 - camX * s;
  const ty = 540 - camY * s;

  // parallax far layer (moves a fraction of the camera)
  const px = (960 - camX * s) * 0.35, py = (540 - camY * s) * 0.35;

  // travelling light pulse on the track during the final wide reveal
  const pulse = interpolate(f, [770, 980], [400, 5800], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const wide = interpolate(f, [690, 770], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const trackY = 540;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(1400px 900px at 50% 40%, #101a3a, #070b16 70%)", fontFamily: FONT, color: "#eef2fb", overflow: "hidden" }}>
      {/* parallax starfield/grid */}
      <AbsoluteFill style={{ transform: `translate(${px}px,${py}px)`, backgroundImage: "radial-gradient(rgba(255,255,255,.12) 1.4px, transparent 1.4px)", backgroundSize: "120px 120px", opacity: 0.5 }} />

      {/* the world */}
      <div style={{ position: "absolute", left: 0, top: 0, width: WORLD_W, height: 1080, transform: `translate(${tx}px,${ty}px) scale(${s})`, transformOrigin: "0 0" }}>
        {/* pipeline track */}
        <div style={{ position: "absolute", left: 420, top: trackY - 4, width: 5360, height: 8, borderRadius: 4, background: "linear-gradient(90deg,#1d2b54,#2c3e7a,#1d2b54)", boxShadow: "0 0 30px rgba(79,156,255,.25)" }} />
        {/* lit overlay grows as we travel */}
        <div style={{ position: "absolute", left: 420, top: trackY - 4, width: interpolate(f, [60, 670], [0, 5360], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), height: 8, borderRadius: 4, background: `linear-gradient(90deg,${ACCENT},${PURPLE},${GREEN})`, boxShadow: `0 0 24px ${ACCENT}` }} />
        {/* travelling pulse on reveal */}
        {f > 765 && <div style={{ position: "absolute", left: pulse - 10, top: trackY - 10, width: 20, height: 20, borderRadius: "50%", background: "#fff", boxShadow: `0 0 30px 10px ${ACCENT}` }} />}

        {STATIONS.map((st, i) => {
          const local = f - arrival[i];
          const lit = interpolate(f, [arrival[i] - 30, arrival[i]], [0.25, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const pop = interpolate(local, [-30, 6], [0.8, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={i} style={{ position: "absolute", left: st.x - 230, top: trackY - 330, width: 460 }}>
              {/* node dot on the track */}
              <div style={{ position: "absolute", left: 230 - 16, top: 330 - 16, width: 32, height: 32, borderRadius: "50%", background: st.color, boxShadow: `0 0 ${20 * lit}px ${st.color}`, opacity: 0.4 + lit * 0.6 }} />
              {/* stem */}
              <div style={{ position: "absolute", left: 230 - 1, top: 220, width: 2, height: 110, background: `${st.color}66` }} />
              {/* panel */}
              <div style={{ position: "absolute", left: 0, top: 0, width: 460, minHeight: 220, transform: `scale(${pop})`, transformOrigin: "50% 100%", opacity: lit, background: "rgba(12,18,38,.82)", border: `1px solid ${st.color}66`, borderRadius: 22, padding: "26px 30px", boxShadow: `0 24px 60px rgba(0,0,0,.5), 0 0 ${30 * lit}px ${st.color}33`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                  <div style={{ fontSize: 36, fontWeight: 900, color: st.color }}>{st.label}</div>
                  <div style={{ fontSize: 22, color: "#9aa4bd" }}>{st.sub}</div>
                </div>
                <Viz idx={i} local={local} />
              </div>
            </div>
          );
        })}

        {/* title that lives in the world, near the start, fades as we dive in */}
        <div style={{ position: "absolute", left: 3100 - 700, top: 120, width: 1400, textAlign: "center", opacity: interpolate(f, [0, 30, 60, 95], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
          <div style={{ fontSize: 26, letterSpacing: 10, color: ACCENT, fontWeight: 800 }}>THE PIPELINE</div>
          <div style={{ fontSize: 60, fontWeight: 900, marginTop: 10 }}>一條<span style={{ background: "linear-gradient(100deg,#7db4ff,#b9a8ff 55%,#7df0c8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>可重跑</span>的分析流水線</div>
        </div>
      </div>

      {/* final tagline (screen-space, on the wide reveal) */}
      <div style={{ position: "absolute", left: 0, bottom: 150, width: "100%", textAlign: "center", opacity: wide, transform: `translateY(${(1 - wide) * 24}px)` }}>
        <div style={{ fontSize: 40, fontWeight: 700 }}>改一個條件，<span style={{ color: GREEN }}>整條流水線一鍵重跑</span>。</div>
      </div>
    </AbsoluteFill>
  );
};
