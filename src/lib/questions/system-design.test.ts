import { describe, it, expect } from "vitest";
import { SYSTEM_DESIGN_QUESTIONS } from "./system-design";

describe("system design question bank invariants", () => {
  it("has a healthy number of questions", () => {
    expect(SYSTEM_DESIGN_QUESTIONS.length).toBeGreaterThanOrEqual(8);
  });

  it("has unique, kebab-case ids", () => {
    const ids = SYSTEM_DESIGN_QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it("every question is well-formed", () => {
    for (const q of SYSTEM_DESIGN_QUESTIONS) {
      expect(q.title.trim(), `title for ${q.id}`).not.toBe("");
      expect(q.prompt.trim(), `prompt for ${q.id}`).not.toBe("");

      // Real system design prompts are long and contain scale or multiple concerns.
      expect(q.prompt.length, `prompt too short for ${q.id}`).toBeGreaterThan(80);
    }
  });

  it("prompts mention scale or non-trivial concerns", () => {
    const allText = SYSTEM_DESIGN_QUESTIONS.map((q) => q.prompt).join("\n").toLowerCase();

    // These are the kinds of things that make a prompt a good system design question.
    expect(allText).toMatch(/scale|million|concurrent|qps|throughput|latency/);
    expect(allText).toMatch(/tradeoff|bottleneck|failure|consistency|partition|cache|replica/);
  });
});
