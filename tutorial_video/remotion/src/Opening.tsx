import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, interpolate } from "remotion";
import { Hook } from "./scenes/Hook";
import { Title } from "./scenes/Title";
import { NotWhat } from "./scenes/NotWhat";
import { ForWhom } from "./scenes/ForWhom";

// per-scene durations (frames @30fps)
export const SCENES = [
  { C: Hook, dur: 285 },
  { C: Title, dur: 210 },
  { C: NotWhat, dur: 330 },
  { C: ForWhom, dur: 360 },
];
const XF = 16; // crossfade frames between scenes

export const OPENING_DURATION = SCENES.reduce((s, x) => s + x.dur, 0) - XF * (SCENES.length - 1);

// wrap each scene with edge fades so consecutive sequences crossfade
const Fade: React.FC<{ dur: number; first: boolean; last: boolean; children: React.ReactNode }> = ({ dur, first, last, children }) => {
  const f = useCurrentFrame();
  const fadeIn = first ? 1 : interpolate(f, [0, XF], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fadeOut = last ? 1 : interpolate(f, [dur - XF, dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const op = Math.min(fadeIn, fadeOut);
  return <AbsoluteFill style={{ opacity: op }}>{children}</AbsoluteFill>;
};

export const Opening: React.FC = () => {
  let at = 0;
  return (
    <AbsoluteFill style={{ background: "#070b16" }}>
      {SCENES.map(({ C, dur }, i) => {
        const from = at;
        at += dur - XF;
        return (
          <Sequence key={i} from={from} durationInFrames={dur}>
            <Fade dur={dur} first={i === 0} last={i === SCENES.length - 1}>
              <C />
            </Fade>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
