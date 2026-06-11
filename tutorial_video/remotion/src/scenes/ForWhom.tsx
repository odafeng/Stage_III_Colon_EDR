import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { Bg, Brand, Caption, ACCENT, GREEN, PURPLE, TEXT, MUTED, FONT } from "../theme";

const GOALS = [
  { ic: "🔁", k: "更可重現", c: ACCENT },
  { ic: "🔍", k: "更透明", c: PURPLE },
  { ic: "🚀", k: "能跑更進階的方法", c: GREEN },
];

export const ForWhom: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const head = spring({ frame, fps, config: { damping: 18, stiffness: 90 } });
  const lineSp = spring({ frame: frame - 24, fps, config: { damping: 16 } });
  // highlight sweep behind the key phrase
  const hl = interpolate(frame, [44, 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const goalHead = spring({ frame: frame - 86, fps, config: { damping: 20 } });

  return (
    <AbsoluteFill style={{ fontFamily: FONT, color: TEXT, justifyContent: "center" }}>
      <Bg seed={3} />
      <Brand />

      <div style={{ width: 1320, margin: "0 auto", marginTop: -20 }}>
        <div style={{ fontSize: 50, fontWeight: 800, marginBottom: 40, opacity: head, transform: `translateY(${interpolate(head, [0, 1], [24, 0])}px)` }}>
          那，這支影片是<span style={{ color: ACCENT }}>給誰</span>的？
        </div>

        <div style={{ fontSize: 52, fontWeight: 700, lineHeight: 1.4, opacity: lineSp, transform: `translateY(${interpolate(lineSp, [0, 1], [20, 0])}px)` }}>
          給{" "}
          <span style={{ position: "relative", display: "inline-block", padding: "0 10px" }}>
            <span style={{ position: "absolute", inset: 0, background: "rgba(79,156,255,.22)", borderRadius: 8, transformOrigin: "left", transform: `scaleX(${hl})` }} />
            <span style={{ position: "relative" }}>想用程式碼來學分析</span>
          </span>{" "}
          的臨床研究者
        </div>

        <div style={{ fontSize: 30, color: MUTED, lineHeight: 1.6, marginTop: 30, opacity: goalHead, transform: `translateY(${interpolate(goalHead, [0, 1], [16, 0])}px)` }}>
          目的：在你<b style={{ color: TEXT }}>能力足夠</b>的前提下，示範如何讓 AI 與程式碼進入臨床分析的工作流——
        </div>

        <div style={{ display: "flex", gap: 24, marginTop: 34 }}>
          {GOALS.map((g, i) => {
            const s = spring({ frame: frame - 96 - i * 10, fps, config: { damping: 14, stiffness: 120 } });
            return (
              <div key={i} style={{ flex: 1, background: "rgba(255,255,255,.05)", border: `1px solid ${g.c}55`, borderRadius: 18, padding: "26px 28px", opacity: s, transform: `translateY(${interpolate(s, [0, 1], [30, 0])}px) scale(${interpolate(s, [0, 1], [0.92, 1])})` }}>
                <div style={{ fontSize: 40 }}>{g.ic}</div>
                <div style={{ fontSize: 30, fontWeight: 800, color: g.c, marginTop: 10 }}>{g.k}</div>
              </div>
            );
          })}
        </div>
      </div>

      <Caption text="那它是給誰的？給想用程式碼來學分析的臨床研究者。目的是：在你能力足夠時，示範如何讓 AI 與程式碼進入臨床分析流程——更可重現、更透明、能跑更進階的方法。" />
    </AbsoluteFill>
  );
};
