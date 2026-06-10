import { describe, it, expect } from "vitest";
import { formatEditorContext, formatNotesContext, stripTurnContext } from "@/lib/turn-context";

describe("formatEditorContext", () => {
  it("returns empty string when there is no code and no run output", () => {
    expect(formatEditorContext({})).toBe("");
    expect(formatEditorContext({ language: "python" })).toBe("");
  });

  it("includes the language and code", () => {
    const out = formatEditorContext({ code: "print(1)", language: "python" });
    expect(out).toContain("python");
    expect(out).toContain("print(1)");
  });

  it("appends run output only when present", () => {
    expect(formatEditorContext({ code: "x", lastRun: "ok" })).toContain("ok");
    expect(formatEditorContext({ code: "x" })).not.toContain("Latest run");
  });
});

describe("formatNotesContext", () => {
  it("returns empty string for empty or whitespace-only notes", () => {
    expect(formatNotesContext("")).toBe("");
    expect(formatNotesContext("   \n ")).toBe("");
  });

  it("wraps the notes in a bracketed annotation", () => {
    const out = formatNotesContext("Situation: outage\nAction: led rollback");
    expect(out).toContain("Situation: outage");
    expect(out).toContain("Action: led rollback");
  });
});

describe("format <-> stripTurnContext round-trip", () => {
  it("strips the editor annotation back off a turn, leaving only the spoken text", () => {
    const spoken = "Here is my approach.";
    const turn = spoken + formatEditorContext({ code: "def f():\n  pass", language: "python", lastRun: "exit 0" });
    expect(stripTurnContext(turn)).toBe(spoken);
  });

  it("strips the notes annotation back off a turn", () => {
    const spoken = "Let me walk you through the situation.";
    const turn = spoken + formatNotesContext("S: outage at peak\nT: restore service\nA: led the rollback");
    expect(stripTurnContext(turn)).toBe(spoken);
  });

  it("strips both annotations when a turn carries editor state and notes", () => {
    const spoken = "Done.";
    const turn =
      spoken +
      formatEditorContext({ code: "line1\nline2\nline3", language: "javascript" }) +
      formatNotesContext("remember: ask about scale");
    expect(stripTurnContext(turn)).toBe(spoken);
  });

  it("is a no-op when there is no annotation", () => {
    expect(stripTurnContext("just talking")).toBe("just talking");
  });
});
