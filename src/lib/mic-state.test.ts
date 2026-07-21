import { describe, it, expect } from "vitest";
import { settleTurn } from "@/lib/mic-state";

describe("settleTurn", () => {
  it("hands the composer back in text mode, regardless of mic state", () => {
    expect(settleTurn({ inputMode: "text", armed: false, hasVad: false })).toEqual({
      status: "ready",
    });
    expect(settleTurn({ inputMode: "text", armed: true, hasVad: true })).toEqual({
      status: "ready",
    });
  });

  it("settles a disarmed voice turn to off, not a forced-open mic", () => {
    expect(settleTurn({ inputMode: "voice", armed: false, hasVad: false })).toEqual({
      status: "off",
    });
  });

  it("thaws the existing frozen VAD for an armed hands-free turn", () => {
    expect(settleTurn({ inputMode: "voice", armed: true, hasVad: true })).toEqual({
      status: "listening",
      mic: "unfreeze",
    });
  });

  // The regression this module exists for: switching to hands-free during the
  // kickoff turn (push-to-talk start, so no VAD ever opened) flags `armed` with
  // no mic. Settling that turn must ACQUIRE a mic — unfreezing a null VAD would
  // leave a dead mic falsely reporting "Listening".
  it("acquires a mic when armed with no VAD (hands-free switched on mid-turn)", () => {
    expect(settleTurn({ inputMode: "voice", armed: true, hasVad: false })).toEqual({
      status: "listening",
      mic: "acquire",
    });
  });
});
