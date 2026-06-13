import { describe, it, expect } from "vitest";
import {
  MODES,
  isValidMode,
  getAssessSystemPrompt,
  buildAssessUserContent,
  getSystemPrompt,
  getKickoffPrompt,
} from "./prompts";
import { SCORE_LABELS } from "./score-labels";
import { getLevel, describeLevelLadder } from "./levels";

// These tests pin contracts, not prose: the JSON keys the UI parses, the
// presence/absence of level calibration, and that mode/question/level data
// actually reaches the prompt. Copy tweaks should not break them.

describe("mode helpers", () => {
  it("exports exactly the three supported modes", () => {
    expect(MODES).toEqual(["coding", "behavioral", "system-design"]);
  });

  it("isValidMode accepts the three modes and rejects others", () => {
    expect(isValidMode("coding")).toBe(true);
    expect(isValidMode("behavioral")).toBe(true);
    expect(isValidMode("system-design")).toBe(true);

    expect(isValidMode("foo")).toBe(false);
    expect(isValidMode(undefined)).toBe(false);
    expect(isValidMode(null)).toBe(false);
    expect(isValidMode("")).toBe(false);
  });
});

describe("assess system prompts (grading rubrics)", () => {
  it("requests exactly the score axes the Scorecard knows how to label", () => {
    // If an axis is renamed in the prompt without updating SCORE_LABELS (or
    // vice versa), the Scorecard silently falls back to raw keys. This is the
    // one prompt<->UI invariant that matters.
    for (const mode of MODES) {
      const prompt = getAssessSystemPrompt(mode);
      for (const key of Object.keys(SCORE_LABELS[mode])) {
        expect(prompt, `${mode} rubric must request "${key}"`).toContain(`"${key}"`);
      }
    }
  });

  it("all assessor prompts instruct the model to return only JSON in the standard shape", () => {
    for (const mode of MODES) {
      const p = getAssessSystemPrompt(mode);
      expect(p).toContain("ONLY a JSON object");
      expect(p).toContain('"recommendation"');
      expect(p).toContain('"overall"');
      expect(p).toContain('"scores"');
      expect(p).toContain('"strengths"');
      expect(p).toContain('"improvements"');
      expect(p).toContain('"summary"');
    }
  });

  it("behavioral and system-design always request performedAtLevel with the full ladder", () => {
    for (const mode of ["behavioral", "system-design"] as const) {
      // With and without a target level — performed-level judgment is unconditional.
      for (const prompt of [getAssessSystemPrompt(mode, "e2"), getAssessSystemPrompt(mode)]) {
        expect(prompt).toContain('"performedAtLevel"');
        expect(prompt).toContain(describeLevelLadder());
      }
    }
  });

  it("anchors scores to the target level when one is given", () => {
    for (const mode of ["behavioral", "system-design"] as const) {
      expect(getAssessSystemPrompt(mode, "principal")).toContain(
        `meets the bar for ${getLevel("principal").label}`
      );
    }
  });

  it("keeps the coding assessment level-free", () => {
    const prompt = getAssessSystemPrompt("coding", "staff");
    expect(prompt).not.toContain('"performedAtLevel"');
    expect(prompt).not.toContain(getLevel("staff").blurb);
  });
});

describe("buildAssessUserContent", () => {
  const baseTranscript = "Interviewer: Hello\nCandidate: Hi there";

  it("includes the transcript and question for all modes", () => {
    for (const mode of MODES) {
      const content = buildAssessUserContent(mode, {
        transcript: baseTranscript,
        questionTitle: "Test Q",
      });
      expect(content).toContain(baseTranscript);
      expect(content).toContain("Test Q");
    }
  });

  it("includes notes only when provided (behavioral and system-design)", () => {
    const notes = "STAR: Situation was X. My action was Y.";
    for (const mode of ["behavioral", "system-design"] as const) {
      expect(
        buildAssessUserContent(mode, { transcript: baseTranscript, notes })
      ).toContain(notes);
      // Without notes there must be no notes header at all.
      expect(
        buildAssessUserContent(mode, { transcript: baseTranscript })
      ).not.toContain("notes");
    }
  });

  it("includes the coding-specific final state when provided", () => {
    const content = buildAssessUserContent("coding", {
      transcript: baseTranscript,
      questionTitle: "Two Sum",
      finalCode: "class Solution: ...",
      language: "python",
      lastRun: "exit 1\nfail",
    });
    expect(content).toContain("Two Sum");
    expect(content).toContain("class Solution: ...");
    expect(content).toContain("python");
    expect(content).toContain("exit 1");
  });
});

describe("interviewer prompts and kickoffs", () => {
  it("produces distinct prompts per mode that embed the current question", () => {
    const prompts = MODES.map((m) =>
      getSystemPrompt(m, { questionTitle: "Foo", questionPrompt: "Bar baz." })
    );
    expect(new Set(prompts).size).toBe(MODES.length);
    for (const p of prompts) {
      expect(p).toContain("Foo");
      expect(p).toContain("Bar baz.");
    }
  });

  it("produces distinct non-empty kickoff instructions per mode", () => {
    const kickoffs = MODES.map(getKickoffPrompt);
    expect(new Set(kickoffs).size).toBe(MODES.length);
    for (const k of kickoffs) {
      expect(k.length).toBeGreaterThan(20);
    }
  });
});

describe("target-level calibration (interviewer)", () => {
  it("embeds the target level's expectations for behavioral and system-design", () => {
    const staff = getLevel("staff");
    for (const mode of ["behavioral", "system-design"] as const) {
      expect(getSystemPrompt(mode, { targetLevel: "staff" })).toContain(staff.blurb);
      expect(getSystemPrompt(mode)).not.toContain(staff.blurb);
    }
  });

  it("never level-calibrates the coding interviewer, even when a level is passed", () => {
    expect(
      getSystemPrompt("coding", { targetLevel: "staff" })
    ).not.toContain(getLevel("staff").blurb);
  });
});
