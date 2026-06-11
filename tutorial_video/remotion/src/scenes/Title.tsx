import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { Bg, Caption, ACCENT, TEXT, FONT } from "../theme";

const row: React.CSSProperties = { position: "absolute", left: 0, width: "100%", textAlign: "center" };

export const Title: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const mark = spring({ frame, fps, config: { damping: 12, stiffness: 120 } });
  const kicker = spring({ frame: frame - 10, fps, config: { damping: 18 } });
  const words = ["把", "程式碼", "帶進", "臨床研究"];
  const sub = spring({ frame: frame - 46, fps, config: { damping: 20 } });
  const underline = interpolate(frame, [40, 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const presenter = spring({ frame: frame - 70, fps, config: { damping: 20 } });

  return (
    <AbsoluteFill style={{ fontFamily: FONT, color: TEXT }}>
      <Bg seed={1} />

      <div style={{ ...row, top: 232 }}>
        <div style={{ width: 96, height: 96, borderRadius: 26, margin: "0 auto", background: "linear-gradient(135deg,#4f9cff,#9b8cff)", transform: `scale(${mark}) rotate(${interpolate(mark, [0, 1], [-30, 0])}deg)`, boxShadow: "0 20px 50px rgba(79,156,255,.35)" }} />
      </div>

      <div style={{ ...row, top: 366, fontSize: 26, letterSpacing: 10, color: ACCENT, fontWeight: 800, opacity: kicker, transform: `translateY(${interpolate(kicker, [0, 1], [16, 0])}px)` }}>
        A STEP-BY-STEP GUIDE
      </div>

      <div style={{ ...row, top: 412, fontSize: 92, fontWeight: 900, letterSpacing: -1, display: "flex", gap: 6, justifyContent: "center" }}>
        {words.map((w, i) => {
          const s = spring({ frame: frame - 14 - i * 6, fps, config: { damping: 14, stiffness: 110 } });
          const grad = i === 1;
          return (
            <span key={i} style={{ display: "inline-block", opacity: s, transform: `translateY(${interpolate(s, [0, 1], [50, 0])}px)`,
              ...(grad ? { background: "linear-gradient(100deg,#7db4ff,#b9a8ff 55%,#7df0c8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" } : {}) }}>{w}</span>
          );
        })}
      </div>

      <div style={{ ...row, top: 552 }}>
        <div style={{ height: 6, width: interpolate(underline, [0, 1], [0, 520]), maxWidth: "70%", margin: "0 auto", borderRadius: 3, background: "linear-gradient(90deg,#4f9cff,#9b8cff,#2ee6a6)" }} />
      </div>

      <div style={{ ...row, top: 600, fontSize: 36, color: "#cdd6ea", opacity: sub, transform: `translateY(${interpolate(sub, [0, 1], [18, 0])}px)` }}>
        用 AI 從零開始，建立<b style={{ color: TEXT }}>可重現</b>的分析流程
      </div>

      <div style={{ ...row, top: 690, fontSize: 30, color: "#d3dcf0", fontWeight: 600, opacity: presenter, letterSpacing: 1 }}>
        主講｜大腸直腸外科主治醫師　<b style={{ color: TEXT }}>黃士峯</b>
      </div>

      <Caption text="把程式碼帶進臨床研究——用 AI 從零開始，建立可重現的分析流程。" />
    </AbsoluteFill>
  );
};
