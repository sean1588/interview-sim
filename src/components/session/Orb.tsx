import type { CSSProperties } from "react";

/** The voice persona's reactive presence. The four states map onto the voice
 * engine's status: speaking (clay, two ripples), listening (olive, one ripple),
 * thinking (muted, a slowly rotating dashed ring), idle (muted, still — shown
 * before the session starts). The core always breathes except when idle. */
export type OrbState = "speaking" | "listening" | "thinking" | "idle";

type OrbStyle = {
  core: CSSProperties;
  ring: string; // ripple-ring border color
  rings: number;
  dashed?: boolean; // thinking: a rotating dashed ring instead of ripples
  breathe?: boolean;
};

const STATES: Record<OrbState, OrbStyle> = {
  speaking: {
    core: {
      background: "radial-gradient(circle at 36% 30%,#f4e1b4,#c8843a 50%,#9c4f1a)",
      border: "1.5px solid #d9b577",
      boxShadow:
        "0 6px 20px rgba(156,79,26,.4),inset 0 -6px 16px rgba(80,40,10,.4),inset 0 3px 8px rgba(255,240,210,.5)",
    },
    ring: "rgba(181,101,29,.45)",
    rings: 2,
    breathe: true,
  },
  listening: {
    core: {
      background: "radial-gradient(circle at 36% 30%,#e4e3bd,#7e8a47 55%,#5e6b3c)",
      border: "1.5px solid #aeb583",
      boxShadow:
        "0 6px 20px rgba(94,107,60,.35),inset 0 -6px 16px rgba(40,50,20,.35),inset 0 3px 8px rgba(255,255,235,.5)",
    },
    ring: "rgba(94,107,60,.45)",
    rings: 1,
    breathe: true,
  },
  thinking: {
    core: {
      background: "radial-gradient(circle at 36% 30%,#cfc4ad,#8a7d63)",
      border: "1.5px solid #c3b69c",
      boxShadow: "inset 0 -5px 14px rgba(80,70,50,.3)",
    },
    ring: "rgba(138,125,99,.4)",
    rings: 0,
    dashed: true,
    breathe: true,
  },
  idle: {
    core: {
      background: "radial-gradient(circle at 36% 30%,#e8ddc9,#bdae93)",
      border: "1.5px solid #cfc1a4",
      boxShadow: "inset 0 -5px 14px rgba(120,105,75,.22)",
    },
    ring: "rgba(160,145,115,.3)",
    rings: 0,
  },
};

export default function Orb({ state, size = 64 }: { state: OrbState; size?: number }) {
  const s = STATES[state];
  const frame = size + 16; // ripple rings extend past the core

  return (
    <div
      className="relative grid place-items-center flex-none"
      style={{ width: frame, height: frame }}
    >
      {Array.from({ length: s.rings }).map((_, i) => (
        <div
          key={i}
          className="absolute left-1/2 top-1/2 rounded-full animate-ripple"
          style={{
            width: frame,
            height: frame,
            border: `1.5px solid ${s.ring}`,
            animationDelay: `${i * 1.3}s`,
          }}
        />
      ))}
      {s.dashed && (
        <div
          className="absolute rounded-full animate-spin-slow"
          style={{
            width: size + 12,
            height: size + 12,
            border: `1.5px dashed ${s.ring}`,
          }}
        />
      )}
      <div
        className={`rounded-full ${s.breathe ? "animate-breathe" : ""}`}
        style={{ width: size, height: size, ...s.core }}
      />
    </div>
  );
}
