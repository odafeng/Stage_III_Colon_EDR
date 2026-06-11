import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { Bg, Caption, ACCENT, GREEN, RED, PURPLE, TEXT, MUTED, FONT } from "../theme";

// cold open: reviewer demand -> SPSS pain (41 manual steps) -> one line + one click.
export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // PHASE A (0-90): reviewer comment card types in
  const cardSp = spring({ frame, fps, config: { damping: 16, stiffness: 90 } });
  const demand = "這個納入條件也加進去，整篇分析，重跑一次。";
  const typed = Math.max(0, Math.min(demand.length, Math.floor((frame - 18) / 1.6)));

  // PHASE B (90-180): SPSS manual steps stack + counter
  const bIn = interpolate(frame, [92, 108], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const steps = Math.max(0, Math.min(41, Math.floor((frame - 100) / 1.6)));
  const cardShrink = interpolate(frame, [88, 104], [1, 0.62], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cardY = interpolate(frame, [88, 104], [0, -250], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // PHASE C (190-285): clear -> one line of code + run + updated
  const wipe = interpolate(frame, [184, 200], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const codeSp = spring({ frame: frame - 198, fps, config: { damping: 18, stiffness: 100 } });
  const runPress = frame > 236 && frame < 248;
  const doneSp = spring({ frame: frame - 250, fps, config: { damping: 14, stiffness: 120 } });
  const cur = Math.floor(frame / 8) % 2 === 0;

  return (
    <AbsoluteFill style={{ fontFamily: FONT, color: TEXT }}>
      <Bg seed={0} />

      {/* PHASE A+B: reviewer comment card */}
      <div style={{
        position: "absolute", top: 250 + cardY, left: "50%",
        transform: `translateX(-50%) scale(${cardSp * cardShrink})`, opacity: cardSp,
        width: 1180,
      }}>
        <div style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.14)", borderRadius: 22, padding: "30px 40px", boxShadow: "0 24px 60px rgba(0,0,0,.45)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#ff8a8a,#c2410c)" }} />
            <div style={{ fontSize: 22, fontWeight: 700, color: "#ffd9c2" }}>Reviewer #2</div>
            <div style={{ fontSize: 17, color: MUTED }}>· 投稿審查意見</div>
          </div>
          <div style={{ fontSize: 40, fontWeight: 700, lineHeight: 1.5, minHeight: 64 }}>
            「{demand.slice(0, typed)}
            {typed < demand.length && <span style={{ opacity: cur ? 1 : 0, color: ACCENT }}>▌</span>}
            {typed >= demand.length && "」"}
          </div>
        </div>
      </div>

      {/* PHASE B: SPSS pain — stacking manual steps + counter */}
      {bIn > 0 && wipe < 1 && (
        <div style={{ position: "absolute", top: 360, left: "50%", transform: "translateX(-50%)", width: 1180, opacity: bIn * (1 - wipe) }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 18, marginBottom: 22 }}>
            <div style={{ fontSize: 30, color: MUTED }}>用 SPSS：你得從頭再點一遍</div>
            <div style={{ fontSize: 64, fontWeight: 900, color: RED, fontVariantNumeric: "tabular-nums" }}>{steps}</div>
            <div style={{ fontSize: 30, color: RED, fontWeight: 700 }}>個步驟</div>
            <div style={{ fontSize: 30, marginLeft: 8, display: "inline-block", transform: `rotate(${(frame * 8) % 360}deg)`, color: RED }}>↻</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {Array.from({ length: Math.min(steps, 18) }).map((_, i) => (
              <div key={i} style={{ background: "rgba(255,107,107,.08)", border: "1px solid rgba(255,107,107,.25)", borderRadius: 9, padding: "9px 16px", fontSize: 19, color: "#ffc9c9", display: "flex", gap: 10 }}>
                <span style={{ color: RED }}>▸</span> Analyze ▸ … 第 {i + 1} 步
              </div>
            ))}
          </div>
          {steps >= 18 && <div style={{ marginTop: 14, fontSize: 24, color: RED, fontWeight: 700 }}>…還有 {41 - 18} 步，每個下拉選單都可能點錯</div>}
        </div>
      )}

      {/* PHASE C: one line of code + run + updated */}
      {wipe > 0 && (
        <div style={{ position: "absolute", top: 380, left: "50%", transform: `translateX(-50%) translateY(${interpolate(codeSp, [0, 1], [40, 0])}px)`, opacity: wipe * codeSp, width: 1180, textAlign: "center" }}>
          <div style={{ fontSize: 30, color: GREEN, marginBottom: 24, fontWeight: 700 }}>用程式碼：改一行、按一次</div>
          <div style={{ display: "inline-block", textAlign: "left", fontFamily: "ui-monospace,Menlo,monospace", fontSize: 34, background: "rgba(8,12,24,.7)", border: "1px solid rgba(255,255,255,.14)", borderRadius: 16, padding: "26px 38px", color: "#cfe" }}>
            <span style={{ color: PURPLE }}>df</span> = df[df.<span style={{ color: ACCENT }}>bmi</span>.notna()]
            <span style={{ opacity: cur ? 1 : 0, color: ACCENT }}> ▌</span>
          </div>
          <div style={{ marginTop: 34, display: "flex", gap: 22, justifyContent: "center", alignItems: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 800, padding: "14px 30px", borderRadius: 14, background: runPress ? GREEN : "rgba(46,230,166,.16)", color: runPress ? "#04201a" : GREEN, border: `1px solid ${GREEN}`, transform: runPress ? "scale(.95)" : "scale(1)" }}>▶ 重跑</div>
            {doneSp > 0.02 && (
              <div style={{ fontSize: 28, fontWeight: 800, color: GREEN, opacity: doneSp, transform: `scale(${interpolate(doneSp, [0, 1], [0.7, 1])})` }}>✓ 所有表格與圖，全部自動更新</div>
            )}
          </div>
        </div>
      )}

      <Caption text="投稿後 reviewer 說：這個納入條件也加進去、整篇分析重跑一次。用 SPSS 你得從頭再點幾十個步驟——但如果，改一行、按一次就好呢？" />
    </AbsoluteFill>
  );
};
