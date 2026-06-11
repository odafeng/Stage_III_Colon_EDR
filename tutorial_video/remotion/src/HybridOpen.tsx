import React from "react";
import { AbsoluteFill, Sequence, OffthreadVideo, staticFile, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { Title } from "./scenes/Title";
import { ACCENT, TEXT, FONT } from "./theme";

const row: React.CSSProperties = { position: "absolute", left: 0, width: "100%", textAlign: "center" };
const TITLE_AT = 300; // title world emerges here

// Veo data b-roll (blurred backdrop) + slow kinetic hook -> dive into the world.
const BrollHook: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();

  // slow drift for most of the cold open, then a faster dive 225-310
  const scale = interpolate(f, [0, 225, 310], [1.08, 1.16, 1.36], { extrapolateRight: "clamp" });
  // baseline blur keeps any residual b-roll text as unreadable bokeh (no AI-garble tell)
  const blur = interpolate(f, [0, 225, 310], [5, 7, 18], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const vid = interpolate(f, [270, 312], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const kicker = spring({ frame: f - 18, fps, config: { damping: 18 } });
  const line1 = spring({ frame: f - 48, fps, config: { damping: 18, stiffness: 80 } });
  const vibe = spring({ frame: f - 92, fps, config: { damping: 14, stiffness: 90 } });
  // hold long enough to read, then fade out just before the dive completes
  const textOut = interpolate(f, [232, 270], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  if (f > 314) return null;
  return (
    <AbsoluteFill style={{ opacity: vid, fontFamily: FONT, color: TEXT }}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${scale})`, filter: `blur(${blur}px)` }}>
        <OffthreadVideo src={staticFile("broll/shot1.mp4")} muted playbackRate={0.55} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      <AbsoluteFill style={{ background: "radial-gradient(1100px 660px at 50% 48%, rgba(4,7,16,.20), rgba(4,7,16,.66) 60%, rgba(4,7,16,.93) 88%)" }} />

      <div style={{ ...row, top: 250, opacity: kicker * textOut, transform: `translateY(${interpolate(kicker, [0, 1], [16, 0])}px)` }}>
        <span style={{ fontSize: 26, letterSpacing: 8, color: ACCENT, fontWeight: 800 }}>如果我告訴你——</span>
      </div>
      <div style={{ ...row, top: 400, opacity: line1 * textOut, transform: `translateY(${interpolate(line1, [0, 1], [26, 0])}px)`, padding: "0 140px" }}>
        <span style={{ fontSize: 58, fontWeight: 800, textShadow: "0 4px 30px rgba(0,0,0,.65)" }}>整個臨床研究分析，其實就是一場</span>
      </div>
      <div style={{ ...row, top: 510, opacity: vibe * textOut, transform: `translateY(${interpolate(vibe, [0, 1], [30, 0])}px) scale(${interpolate(vibe, [0, 1], [0.86, 1])})` }}>
        <span style={{ fontSize: 110, fontWeight: 900, letterSpacing: -2, background: "linear-gradient(100deg,#7db4ff,#b9a8ff 50%,#7df0c8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", filter: "drop-shadow(0 6px 30px rgba(0,0,0,.5))" }}>Vibe Coding</span>
      </div>
    </AbsoluteFill>
  );
};

export const HybridOpen: React.FC = () => (
  <AbsoluteFill style={{ background: "#070b16" }}>
    <Sequence from={TITLE_AT}>
      <Title />
    </Sequence>
    <BrollHook />
  </AbsoluteFill>
);
