import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, OffthreadVideo, staticFile } from "remotion";
import { Bg, Brand, Caption, ACCENT, GREEN, TEXT, MUTED, FONT } from "./theme";

// blurred, slowly-drifting thematic b-roll backdrop. heavy dark overlay keeps
// foreground content legible and turns any residual b-roll text into texture.
export const BrollBg: React.FC<{ src: string; dark?: number }> = ({ src, dark = 0.86 }) => {
  const f = useCurrentFrame();
  const sc = 1.16 + Math.sin(f / 130) * 0.03;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${sc})`, filter: "blur(18px)" }}>
        <OffthreadVideo src={staticFile(`broll/${src}`)} muted loop playbackRate={0.4} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      <AbsoluteFill style={{ background: `radial-gradient(1300px 800px at 50% 46%, rgba(7,11,22,${dark - 0.16}), rgba(7,11,22,${dark}) 78%)` }} />
    </AbsoluteFill>
  );
};

// ---- animation helper: staggered rise + fade ------------------------------
export function useRise(delay = 0, dy = 28, cfg: { damping?: number; stiffness?: number } = {}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: cfg.damping ?? 16, stiffness: cfg.stiffness ?? 95 } });
  return { s, opacity: s, ty: (1 - s) * dy };
}

// ---- Scene shell: bg + brand + caption ------------------------------------
export const Scene: React.FC<{ seed?: number; caption: string; brand?: boolean; bg?: string; children: React.ReactNode }> = ({ seed = 0, caption, brand = true, bg, children }) => (
  <AbsoluteFill style={{ fontFamily: FONT, color: TEXT }}>
    {bg ? <BrollBg src={bg} /> : <Bg seed={seed} />}
    {brand && <Brand />}
    {children}
    <Caption text={caption} />
  </AbsoluteFill>
);

const row: React.CSSProperties = { position: "absolute", left: 0, width: "100%", textAlign: "center" };

// ---- Heading (top of a content scene) -------------------------------------
export const Heading: React.FC<{ top?: number; size?: number; children: React.ReactNode }> = ({ top = 150, size = 50, children }) => {
  const { opacity, ty } = useRise(0, 24);
  return (
    <div style={{ ...row, top, fontSize: size, fontWeight: 800, opacity, transform: `translateY(${ty}px)`, padding: "0 120px" }}>
      {children}
    </div>
  );
};

// ---- Divider: full-scene section break ------------------------------------
export const Divider: React.FC<{ num: string; en: string; title: string; caption: string; seed?: number; bg?: string }> = ({ num, en, title, caption, seed = 0, bg }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const numSp = spring({ frame, fps, config: { damping: 14, stiffness: 90 } });
  const line = interpolate(frame, [12, 34], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const enSp = spring({ frame: frame - 10, fps, config: { damping: 18 } });
  const titleSp = spring({ frame: frame - 18, fps, config: { damping: 16, stiffness: 90 } });
  return (
    <Scene seed={seed} caption={caption} brand={false} bg={bg}>
      <div style={{ ...row, top: 360, fontSize: 200, fontWeight: 900, color: "rgba(255,255,255,.10)", opacity: numSp, transform: `scale(${interpolate(numSp, [0, 1], [0.7, 1])})`, letterSpacing: -4 }}>{num}</div>
      <div style={{ ...row, top: 470, fontSize: 26, letterSpacing: 12, color: ACCENT, fontWeight: 800, opacity: enSp }}>{en}</div>
      <div style={{ ...row, top: 520 }}>
        <div style={{ height: 4, width: interpolate(line, [0, 1], [0, 240]), margin: "0 auto", borderRadius: 2, background: "linear-gradient(90deg,#4f9cff,#2ee6a6)" }} />
      </div>
      <div style={{ ...row, top: 556, fontSize: 64, fontWeight: 900, opacity: titleSp, transform: `translateY(${interpolate(titleSp, [0, 1], [26, 0])}px)` }}>{title}</div>
    </Scene>
  );
};

// ---- card type ------------------------------------------------------------
export type Card = { icon?: string; title?: string; body?: React.ReactNode; color?: string };

// ---- CardGrid: N cards in a row, staggered spring-in ----------------------
export const CardGrid: React.FC<{ cards: Card[]; top?: number; delay?: number; cardW?: number; gap?: number; h?: number }> = ({ cards, top = 360, delay = 8, cardW = 420, gap = 30, h = 360 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const totalW = cards.length * cardW + (cards.length - 1) * gap;
  return (
    <div style={{ position: "absolute", top, left: "50%", transform: "translateX(-50%)", width: totalW, height: h, display: "flex", gap }}>
      {cards.map((c, i) => {
        const s = spring({ frame: frame - delay - i * 8, fps, config: { damping: 14, stiffness: 110 } });
        return (
          <div key={i} style={{ width: cardW, background: "rgba(255,255,255,.05)", border: `1px solid ${(c.color ?? ACCENT)}44`, borderRadius: 22, padding: "40px 38px", opacity: s, transform: `translateY(${interpolate(s, [0, 1], [40, 0])}px) scale(${interpolate(s, [0, 1], [0.92, 1])})` }}>
            {c.icon && <div style={{ fontSize: 52 }}>{c.icon}</div>}
            {c.title && <div style={{ fontSize: 34, fontWeight: 800, color: c.color ?? ACCENT, marginTop: 14 }}>{c.title}</div>}
            {c.body && <div style={{ fontSize: 25, color: "#c7d0e6", lineHeight: 1.55, marginTop: 14 }}>{c.body}</div>}
          </div>
        );
      })}
    </div>
  );
};

// ---- Compare: two columns (e.g. good vs bad) ------------------------------
export type Col = { title: string; tag?: string; items?: React.ReactNode[]; tone?: "good" | "warn" | "neutral" };
const toneColor = (t?: string) => (t === "good" ? GREEN : t === "warn" ? "#ffb259" : ACCENT);
export const Compare: React.FC<{ cols: Col[]; top?: number; delay?: number; colW?: number }> = ({ cols, top = 340, delay = 8, colW = 600 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ position: "absolute", top, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 40 }}>
      {cols.map((c, i) => {
        const s = spring({ frame: frame - delay - i * 10, fps, config: { damping: 15, stiffness: 100 } });
        const col = toneColor(c.tone);
        return (
          <div key={i} style={{ width: colW, background: "rgba(255,255,255,.045)", border: `1px solid ${col}55`, borderRadius: 22, padding: "34px 40px", opacity: s, transform: `translateY(${interpolate(s, [0, 1], [36, 0])}px)` }}>
            <div style={{ fontSize: 34, fontWeight: 800, color: col }}>{c.title}</div>
            {c.tag && <div style={{ fontSize: 22, color: MUTED, marginTop: 6 }}>{c.tag}</div>}
            <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 14 }}>
              {(c.items ?? []).map((it, k) => (
                <div key={k} style={{ fontSize: 26, color: "#cdd6ea", lineHeight: 1.5, display: "flex", gap: 12 }}>
                  <span style={{ color: col, flex: "none" }}>{c.tone === "good" ? "✓" : c.tone === "warn" ? "•" : "›"}</span>
                  <span>{it}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ---- FlowSteps: horizontal pipeline with drawn arrows ---------------------
export type Step = { big: string; sm?: string; color?: string };
export const FlowSteps: React.FC<{ steps: Step[]; top?: number; delay?: number }> = ({ steps, top = 420, delay = 8 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ position: "absolute", top, left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 20 }}>
      {steps.map((s, i) => {
        const sp = spring({ frame: frame - delay - i * 12, fps, config: { damping: 14, stiffness: 110 } });
        const ar = interpolate(frame, [delay + i * 12 + 6, delay + i * 12 + 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const col = s.color ?? ACCENT;
        return (
          <React.Fragment key={i}>
            {i > 0 && <div style={{ fontSize: 40, color: MUTED, opacity: ar, transform: `translateX(${interpolate(ar, [0, 1], [-10, 0])}px)` }}>→</div>}
            <div style={{ minWidth: 220, textAlign: "center", background: "rgba(255,255,255,.05)", border: `1px solid ${col}55`, borderRadius: 18, padding: "26px 30px", opacity: sp, transform: `scale(${interpolate(sp, [0, 1], [0.85, 1])})` }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: col }}>{s.big}</div>
              {s.sm && <div style={{ fontSize: 22, color: MUTED, marginTop: 8 }}>{s.sm}</div>}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ---- BulletRows: stacked rows sliding in from left ------------------------
export const BulletRows: React.FC<{ rows: Card[]; top?: number; delay?: number; rowW?: number; gap?: number }> = ({ rows, top = 340, delay = 8, rowW = 1280, gap = 22 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ position: "absolute", top, left: "50%", transform: "translateX(-50%)", width: rowW, display: "flex", flexDirection: "column", gap }}>
      {rows.map((r, i) => {
        const s = spring({ frame: frame - delay - i * 12, fps, config: { damping: 15, stiffness: 110 } });
        const col = r.color ?? ACCENT;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 24, background: "rgba(255,255,255,.045)", border: `1px solid ${col}33`, borderRadius: 16, padding: "24px 32px", opacity: s, transform: `translateX(${interpolate(s, [0, 1], [-44, 0])}px)` }}>
            {r.icon && <div style={{ fontSize: 38, flex: "none" }}>{r.icon}</div>}
            <div>
              {r.title && <div style={{ fontSize: 30, fontWeight: 800, color: col }}>{r.title}</div>}
              {r.body && <div style={{ fontSize: 25, color: "#cdd6ea", lineHeight: 1.5, marginTop: r.title ? 4 : 0 }}>{r.body}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ---- CodeCard: monospace block, optional typed reveal ---------------------
export const CodeCard: React.FC<{ lines: React.ReactNode[]; top?: number; delay?: number; label?: string; w?: number }> = ({ lines, top = 380, delay = 8, label, w = 1100 }) => {
  const { opacity, ty } = useRise(delay, 36);
  return (
    <div style={{ position: "absolute", top, left: "50%", transform: `translateX(-50%) translateY(${ty}px)`, width: w, opacity }}>
      {label && <div style={{ fontSize: 24, color: GREEN, fontWeight: 700, marginBottom: 16, textAlign: "center" }}>{label}</div>}
      <div style={{ fontFamily: "ui-monospace,Menlo,monospace", fontSize: 30, lineHeight: 1.9, whiteSpace: "pre-wrap", background: "rgba(8,12,24,.7)", border: "1px solid rgba(255,255,255,.14)", borderRadius: 16, padding: "30px 40px", color: "#cfe" }}>
        {lines.map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  );
};

// ---- Lead: a big centered statement (for emphatic one-liner scenes) -------
export const Lead: React.FC<{ top?: number; size?: number; children: React.ReactNode }> = ({ top = 430, size = 60, children }) => {
  const { opacity, ty } = useRise(2, 30);
  return <div style={{ ...row, top, fontSize: size, fontWeight: 800, lineHeight: 1.4, opacity, transform: `translateY(${ty}px)`, padding: "0 160px" }}>{children}</div>;
};

// ---- Note: a sub-paragraph under a lead/heading ---------------------------
export const Note: React.FC<{ top?: number; delay?: number; size?: number; children: React.ReactNode }> = ({ top = 560, delay = 14, size = 32, children }) => {
  const { opacity, ty } = useRise(delay, 20);
  return <div style={{ ...row, top, fontSize: size, color: "#c7d0e6", lineHeight: 1.6, opacity, transform: `translateY(${ty}px)`, padding: "0 200px" }}>{children}</div>;
};
