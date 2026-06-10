import { describe, it, expect } from "vitest";
import { BEHAVIORAL_QUESTIONS } from "./behavioral";

describe("behavioral question bank invariants", () => {
  it("has a healthy number of questions", () => {
    expect(BEHAVIORAL_QUESTIONS.length).toBeGreaterThanOrEqual(8);
  });

  it("has unique, kebab-case ids", () => {
    const ids = BEHAVIORAL_QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it("every question is well-formed", () => {
    for (const q of BEHAVIORAL_QUESTIONS) {
      expect(q.title.trim(), `title for ${q.id}`).not.toBe("");
      expect(q.prompt.trim(), `prompt for ${q.id}`).not.toBe("");

      // Prompts should be real TMAT questions — at least a full sentence.
      expect(q.prompt.length, `prompt too short for ${q.id}`).toBeGreaterThan(40);
    }
  });

  it("keeps the load-bearing classics in the bank", () => {
    const ids = BEHAVIORAL_QUESTIONS.map((q) => q.id);
    for (const id of [
      "tell-me-about-yourself",
      "production-bug",
      "conflict-coworker",
      "made-mistake",
      "influenced-without-authority",
      "failed-project",
    ]) {
      expect(ids).toContain(id);
    }
  });
});
