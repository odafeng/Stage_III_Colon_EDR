import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, interpolate } from "remotion";
import { SCENES } from "./deck/scenes";

const XF = 16; // crossfade frames

export type DeckProps = { from: number; to: number };

export const blockDuration = (from: number, to: number) => {
  let total = 0;
  let n = 0;
  for (let i = from; i <= to; i++) {
    if (!SCENES[i]) continue;
    total += SCENES[i].dur;
    n++;
  }
  return Math.max(1, total - XF * Math.max(0, n - 1));
};

const Fade: React.FC<{ dur: number; first: boolean; last: boolean; children: React.ReactNode }> = ({ dur, first, last, children }) => {
  const f = useCurrentFrame();
  const fadeIn = first ? 1 : interpolate(f, [0, XF], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fadeOut = last ? 1 : interpolate(f, [dur - XF, dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ opacity: Math.min(fadeIn, fadeOut) }}>{children}</AbsoluteFill>;
};

export const Deck: React.FC<DeckProps> = ({ from, to }) => {
  const idxs: number[] = [];
  for (let i = from; i <= to; i++) if (SCENES[i]) idxs.push(i);
  let at = 0;
  return (
    <AbsoluteFill style={{ background: "#070b16" }}>
      {idxs.map((idx, k) => {
        const { dur, node } = SCENES[idx];
        const fromFrame = at;
        at += dur - XF;
        return (
          <Sequence key={idx} from={fromFrame} durationInFrames={dur}>
            <Fade dur={dur} first={k === 0} last={k === idxs.length - 1}>
              {node}
            </Fade>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
