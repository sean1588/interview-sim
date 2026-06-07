import { describe, it, expect } from "vitest";
import { formatEditorContext, stripEditorContext } from "@/lib/editor-context";

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

describe("formatEditorContext <-> stripEditorContext round-trip", () => {
  it("strips the annotation back off a turn, leaving only the spoken text", () => {
    const spoken = "Here is my approach.";
    const turn = spoken + formatEditorContext({ code: "def f():\n  pass", language: "python", lastRun: "exit 0" });
    expect(stripEditorContext(turn)).toBe(spoken);
  });

  it("handles multiline code (must consume newlines after the marker)", () => {
    const spoken = "Done.";
    const turn = spoken + formatEditorContext({ code: "line1\nline2\nline3", language: "javascript" });
    expect(stripEditorContext(turn)).toBe(spoken);
  });

  it("is a no-op when there is no annotation", () => {
    expect(stripEditorContext("just talking")).toBe("just talking");
  });
});
