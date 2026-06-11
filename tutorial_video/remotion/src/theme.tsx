import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const NAVY = "#070b16";
export const ACCENT = "#4f9cff";
export const GREEN = "#2ee6a6";
export const ORANGE = "#ffa94d";
export const PURPLE = "#9b8cff";
export const RED = "#ff6b6b";
export const TEXT = "#eef2fb";
export const MUTED = "#9aa4bd";
export const FONT = "'PingFang TC','Noto Sans TC',system-ui,sans-serif";

// drifting-blob + grid background, continuous motion so the frame is never static
export const Bg: React.FC<{ seed?: number }> = ({ seed = 0 }) => {
  const f = useCurrentFrame();
  const t = (f + seed * 90) / 30;
  const blob = (x: number, y: number, c: string, ph: number, s: number) => ({
    position: "absolute" as const,
    width: s, height: s, borderRadius: "50%", filter: "blur(90px)", opacity: 0.5,
    background: c,
    left: x + Math.sin(t * 0.4 + ph) * 60,
    top: y + Math.cos(t * 0.33 + ph) * 50,
    transform: `scale(${1 + 0.12 * Math.sin(t * 0.5 + ph)})`,
  });
  return (
    <AbsoluteFill style={{ background: `radial-gradient(1200px 800px at 18% 12%, rgba(79,156,255,.16), transparent 60%), radial-gradient(1000px 700px at 85% 85%, rgba(155,140,255,.14), transparent 60%), linear-gradient(160deg,#070b16,#0e1430 55%,#141c3d)` }}>
      <div style={blob(120, 60, "#2f6df6", 0, 520)} />
      <div style={blob(1300, 620, "#8a5cff", 2, 480)} />
      <div style={blob(1000, 80, "#1fb6a8", 4, 360)} />
      <AbsoluteFill style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px)", backgroundSize: "64px 64px", maskImage: "radial-gradient(circle at 50% 50%, black, transparent 80%)", transform: `translate(${Math.sin(t * 0.2) * 18}px,${Math.cos(t * 0.18) * 14}px)` }} />
    </AbsoluteFill>
  );
};

// small brand chip shown top-left, matches the deck brand mark
export const Brand: React.FC = () => (
  <div style={{ position: "absolute", top: 54, left: 64, display: "flex", alignItems: "center", gap: 16, opacity: 0.92 }}>
    <div style={{ width: 38, height: 38, borderRadius: 11, background: "linear-gradient(135deg,#4f9cff,#9b8cff)" }} />
    <div style={{ lineHeight: 1.25 }}>
      <div style={{ fontSize: 19, fontWeight: 800, color: TEXT }}>把程式碼帶進臨床研究</div>
      <div style={{ fontSize: 12, letterSpacing: 4, color: MUTED }}>REPRODUCIBLE · TRANSPARENT · STEP BY STEP</div>
    </div>
  </div>
);

// bottom caption pill, matches the deck caption band; fades in over the scene
export const Caption: React.FC<{ text: string }> = ({ text }) => {
  const f = useCurrentFrame();
  if (!text) return null;
  const op = interpolate(f, [4, 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", bottom: 70, width: 1500, maxWidth: "82%", textAlign: "center", opacity: op }}>
      <span style={{ display: "inline-block", background: "rgba(10,14,28,.62)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 16, padding: "16px 30px", fontSize: 27, lineHeight: 1.5, color: "#dfe6f5", fontFamily: FONT }}>
        {text}
      </span>
    </div>
  );
};
