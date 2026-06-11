import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Easing } from "remotion";

const NAVY = "#070b16";
const ACCENT = "#4f9cff";
const GREEN = "#2ee6a6";
const ORANGE = "#ffa94d";
const PURPLE = "#9b8cff";

const STAGES = [
  { label: "Raw Data", sub: "原始資料", color: ACCENT },
  { label: "EDA", sub: "探索", color: PURPLE },
  { label: "Cleaning", sub: "清理", color: "#7db4ff" },
  { label: "Model", sub: "建模", color: ORANGE },
  { label: "Validate", sub: "驗證", color: GREEN },
];

const Bg: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / 30;
  const blob = (x: number, y: number, c: string, ph: number, s: number) => ({
    position: "absolute" as const,
    width: s, height: s, borderRadius: "50%", filter: "blur(80px)", opacity: 0.5,
    background: c,
    left: x + Math.sin(t * 0.4 + ph) * 60,
    top: y + Math.cos(t * 0.33 + ph) * 50,
    transform: `scale(${1 + 0.12 * Math.sin(t * 0.5 + ph)})`,
  });
  return (
    <AbsoluteFill style={{ background: `radial-gradient(1200px 800px at 18% 12%, rgba(79,156,255,.18), transparent 60%), radial-gradient(1000px 700px at 85% 85%, rgba(155,140,255,.16), transparent 60%), linear-gradient(160deg,#070b16,#0e1430 55%,#141c3d)` }}>
      <div style={blob(120, 60, "#2f6df6", 0, 520)} />
      <div style={blob(1300, 620, "#8a5cff", 2, 480)} />
      <div style={blob(1000, 80, "#1fb6a8", 4, 360)} />
      <AbsoluteFill style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px)", backgroundSize: "64px 64px", maskImage: "radial-gradient(circle at 50% 50%, black, transparent 80%)", transform: `translate(${Math.sin(t * 0.2) * 18}px,${Math.cos(t * 0.18) * 14}px)` }} />
    </AbsoluteFill>
  );
};

export const Proof: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();

  // kinetic title
  const titleSp = spring({ frame, fps, config: { damping: 14, stiffness: 90 } });
  const titleY = interpolate(titleSp, [0, 1], [40, 0]);
  const kicker = spring({ frame: frame - 6, fps, config: { damping: 16 } });

  // pipeline geometry
  const n = STAGES.length;
  const margin = 230;
  const span = width - margin * 2;
  const xs = STAGES.map((_, i) => margin + (span * i) / (n - 1));
  const yLine = 600;
  const boxStart = 30;
  const perStage = 16;

  // travelling glow dot progress (after boxes appear)
  const dotStart = boxStart + perStage * n + 6;
  const dotProg = interpolate(frame, [dotStart, dotStart + 90], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.ease) });
  const dotX = interpolate(dotProg, [0, 1], [xs[0], xs[n - 1]]);

  // final line of text
  const tagSp = spring({ frame: frame - (dotStart + 70), fps, config: { damping: 18 } });

  return (
    <AbsoluteFill style={{ fontFamily: "'Noto Sans TC','PingFang TC',system-ui,sans-serif", color: "#eef2fb" }}>
      <Bg />

      <div style={{ position: "absolute", top: 150, width: "100%", textAlign: "center", opacity: kicker, transform: `translateY(${interpolate(kicker, [0, 1], [20, 0])}px)` }}>
        <div style={{ fontSize: 26, letterSpacing: 8, color: ACCENT, fontWeight: 800 }}>THE PIPELINE</div>
      </div>
      <div style={{ position: "absolute", top: 210, width: "100%", textAlign: "center", opacity: titleSp, transform: `translateY(${titleY}px)` }}>
        <div style={{ fontSize: 76, fontWeight: 900, letterSpacing: -1 }}>
          一條<span style={{ background: "linear-gradient(100deg,#7db4ff,#b9a8ff 55%,#7df0c8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>可重跑</span>的分析流水線
        </div>
      </div>

      {/* connecting line, drawn under boxes */}
      <svg width={width} height={1080} style={{ position: "absolute", inset: 0 }}>
        {xs.slice(0, -1).map((x, i) => {
          const segStart = boxStart + perStage * (i + 1);
          const draw = interpolate(frame, [segStart, segStart + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return <line key={i} x1={x + 95} y1={yLine} x2={x + 95 + (xs[i + 1] - x - 190) * draw} y2={yLine} stroke="rgba(255,255,255,.22)" strokeWidth={3} />;
        })}
      </svg>

      {STAGES.map((s, i) => {
        const sp = spring({ frame: frame - (boxStart + perStage * i), fps, config: { damping: 13, stiffness: 110 } });
        const scale = interpolate(sp, [0, 1], [0.6, 1]);
        const op = interpolate(sp, [0, 1], [0, 1]);
        const lift = interpolate(sp, [0, 1], [30, 0]);
        const active = dotProg > 0 && Math.abs(dotX - xs[i]) < 90;
        const glow = active ? `0 0 40px ${s.color}aa` : `0 12px 36px rgba(0,0,0,.45)`;
        return (
          <div key={i} style={{ position: "absolute", left: xs[i] - 95, top: yLine - 55, width: 190, height: 110, opacity: op, transform: `translateY(${lift}px) scale(${scale})` }}>
            <div style={{ width: "100%", height: "100%", borderRadius: 18, background: "rgba(255,255,255,.05)", border: `1px solid ${active ? s.color : "rgba(255,255,255,.12)"}`, boxShadow: glow, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", transition: "none" }}>
              <div style={{ fontSize: 30, fontWeight: 800, color: s.color }}>{s.label}</div>
              <div style={{ fontSize: 18, color: "#9aa4bd", marginTop: 4 }}>{s.sub}</div>
            </div>
          </div>
        );
      })}

      {/* travelling glow dot */}
      {dotProg > 0 && dotProg < 1 && (
        <div style={{ position: "absolute", left: dotX - 9, top: yLine - 9, width: 18, height: 18, borderRadius: "50%", background: "#fff", boxShadow: `0 0 24px 8px ${ACCENT}` }} />
      )}

      <div style={{ position: "absolute", top: 760, width: "100%", textAlign: "center", opacity: tagSp, transform: `translateY(${interpolate(tagSp, [0, 1], [24, 0])}px)` }}>
        <div style={{ fontSize: 36, color: "#cfe" }}>改一個條件，整條流水線<span style={{ color: GREEN, fontWeight: 800 }}>一鍵重跑</span>——結果一模一樣。</div>
      </div>
    </AbsoluteFill>
  );
};
