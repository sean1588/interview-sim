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

  it("covers a reasonable spread of behavioral themes", () => {
    const allText = BEHAVIORAL_QUESTIONS.map((q) => `${q.title} ${q.prompt}`).join(" ").toLowerCase();

    // Spot-check coverage of high-signal engineering behavioral areas,
    // inspired by strong real-world TMAT examples (production issues, cross-team work,
    // initiative, pressure, rapid learning, feedback, mentoring, ownership of mistakes).
    expect(allText).toMatch(/conflict|disagree|pushback/);
    expect(allText).toMatch(/bug|production|incident|pressure/);
    expect(allText).toMatch(/oversight|assumption|mistake|review/);
    expect(allText).toMatch(/initiative|took initiative|identified|built/);
    expect(allText).toMatch(/cross-team|coordination|align|multiple teams/);
    expect(allText).toMatch(/feedback|mentor|onboard|growth/);
    expect(allText).toMatch(/learn|ramp|quickly|domain/);
    expect(allText).toMatch(/led|impact|results|scale/);
  });
});
