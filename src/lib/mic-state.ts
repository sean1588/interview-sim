// The mic/turn state machine's one real decision: when a turn settles (the
// server is done and playback has drained, or the turn failed), what should the
// input do next? Extracted from VoiceChat so it's a pure, exhaustively testable
// function instead of a branch scattered across the component's closures.

export interface SettleInput {
  /** voice (mic) vs. text (typed composer). */
  inputMode: "voice" | "text";
  /** Should the mic be open — the single source of truth VoiceChat mirrors. */
  armed: boolean;
  /** Whether a VAD instance already exists (a frozen one, mid-turn). */
  hasVad: boolean;
}

/** The outcome of settling a turn.
 *  - `status: "ready"` — text mode: hand back to the composer.
 *  - `status: "off"` — voice, disarmed: leave the mic released.
 *  - `status: "listening", mic: "unfreeze"` — voice, armed, mic already open:
 *    thaw the frozen VAD.
 *  - `status: "listening", mic: "acquire"` — voice, armed, NO mic yet: open one
 *    now. This is the case hands-free-switched-on-mid-turn produces — it flags
 *    `armed` without opening a mic, because opening it over a playing reply would
 *    capture the reply's own audio, so acquisition is deferred to the turn's end. */
export type TurnSettle =
  | { status: "ready" | "off" }
  | { status: "listening"; mic: "unfreeze" | "acquire" };

export function settleTurn({ inputMode, armed, hasVad }: SettleInput): TurnSettle {
  if (inputMode === "text") return { status: "ready" };
  if (!armed) return { status: "off" };
  return { status: "listening", mic: hasVad ? "unfreeze" : "acquire" };
}
