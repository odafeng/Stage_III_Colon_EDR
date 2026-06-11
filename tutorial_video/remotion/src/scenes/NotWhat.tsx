import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { Bg, Brand, Caption, RED, TEXT, FONT } from "../theme";

const ITEMS = [
  "不是要教你「從零開始寫程式」",
  "不是要教你「讓 AI 全自動產出研究」",
  "不是要你把臨床判斷外包",
];

export const NotWhat: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const head = spring({ frame, fps, config: { damping: 18, stiffness: 90 } });

  return (
    <AbsoluteFill style={{ fontFamily: FONT, color: TEXT, justifyContent: "center" }}>
      <Bg seed={2} />
      <Brand />

      <div style={{ width: 1280, margin: "0 auto", marginTop: -30 }}>
        <div style={{ fontSize: 50, fontWeight: 800, marginBottom: 50, opacity: head, transform: `translateY(${interpolate(head, [0, 1], [24, 0])}px)` }}>
          先說清楚，這支影片<span style={{ color: RED }}>「不是」</span>什麼
        </div>

        {ITEMS.map((txt, i) => {
          const start = 26 + i * 26;
          const s = spring({ frame: frame - start, fps, config: { damping: 15, stiffness: 110 } });
          const stamp = spring({ frame: frame - start - 4, fps, config: { damping: 9, stiffness: 180 } });
          const strike = interpolate(frame, [start + 16, start + 34], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 26, marginBottom: 26,
              background: "rgba(255,255,255,.045)", border: "1px solid rgba(255,107,107,.22)", borderRadius: 18,
              padding: "26px 36px", opacity: s, transform: `translateX(${interpolate(s, [0, 1], [-50, 0])}px)`,
            }}>
              <div style={{ fontSize: 44, fontWeight: 900, color: RED, flex: "none", transform: `scale(${interpolate(stamp, [0, 1], [0, 1])}) rotate(${interpolate(stamp, [0, 1], [-40, 0])}deg)` }}>✕</div>
              <div style={{ position: "relative", fontSize: 40, fontWeight: 600 }}>
                {txt}
                <div style={{ position: "absolute", top: "52%", left: 0, height: 3, width: `${strike * 100}%`, background: RED, opacity: 0.65 }} />
              </div>
            </div>
          );
        })}
      </div>

      <Caption text="先說清楚這支影片「不是」什麼：不是教你從零寫程式、不是教你讓 AI 全自動產出研究、也不是要你把臨床判斷外包給 AI。" />
    </AbsoluteFill>
  );
};
