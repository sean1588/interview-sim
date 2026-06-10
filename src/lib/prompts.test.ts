import { describe, it, expect } from "vitest";
import {
  MODES,
  isValidMode,
  getModeLabel,
  getAssessSystemPrompt,
  buildAssessUserContent,
  getInterviewerSystemPrompt,
  getKickoffPrompt,
} from "./prompts";

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

  it("getModeLabel returns human names", () => {
    expect(getModeLabel("coding")).toBe("Coding");
    expect(getModeLabel("behavioral")).toBe("Behavioral");
    expect(getModeLabel("system-design")).toBe("System Design");
  });
});

describe("assess system prompts (grading rubrics)", () => {
  it("contains the expected coding rubric axes", () => {
    const prompt = getAssessSystemPrompt("coding");
    expect(prompt).toContain('"correctness"');
    expect(prompt).toContain('"problemSolving"');
    expect(prompt).toContain('"codeQuality"');
    expect(prompt).toContain('"communication"');
    expect(prompt).toContain('"complexity"');
    expect(prompt).toContain("Strong Hire");
  });

  it("contains the expected behavioral rubric axes (current contract)", () => {
    const prompt = getAssessSystemPrompt("behavioral");
    expect(prompt).toContain('"storytelling"');
    expect(prompt).toContain('"ownership"');
    expect(prompt).toContain('"impact"');
    expect(prompt).toContain('"specificity"');
    expect(prompt).toContain('"reflection"');
    // Guard against accidental re-introduction of a removed axis or loss of specificity
    expect(prompt).not.toContain('"communication"'); // we replaced it with specificity for behavioral
  });

  it("contains the expected system-design rubric axes (current contract)", () => {
    const prompt = getAssessSystemPrompt("system-design");
    expect(prompt).toContain('"requirements"');
    expect(prompt).toContain('"highLevelDesign"');
    expect(prompt).toContain('"componentDesign"');
    expect(prompt).toContain('"scalabilityTradeoffs"');
    expect(prompt).toContain('"communication"');
  });

  it("all assessor prompts instruct the model to return only JSON and use the standard shape", () => {
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
});

describe("buildAssessUserContent", () => {
  const baseTranscript = "Interviewer: Hello\nCandidate: Hi there";

  it("includes the transcript for all modes", () => {
    for (const mode of MODES) {
      const content = buildAssessUserContent(mode, {
        transcript: baseTranscript,
        questionTitle: "Test Q",
      });
      expect(content).toContain(baseTranscript);
    }
  });

  it("includes notes for behavioral and system-design but not raw code", () => {
    const behavioral = buildAssessUserContent("behavioral", {
      transcript: baseTranscript,
      notes: "STAR: Situation was X. My action was Y.",
    });
    expect(behavioral).toContain("Candidate's private notes");
    expect(behavioral).toContain("STAR: Situation was X");

    const sys = buildAssessUserContent("system-design", {
      transcript: baseTranscript,
      notes: "Use consistent hashing + 3 replicas",
    });
    expect(sys).toContain("live design notes");
    expect(sys).toContain("consistent hashing");

    const coding = buildAssessUserContent("coding", {
      transcript: baseTranscript,
      finalCode: "def foo(): pass",
      language: "python",
      lastRun: "exit 0\nok",
    });
    expect(coding).not.toContain("Candidate's private notes");
    expect(coding).toContain("final code");
    expect(coding).toContain("def foo");
  });

  it("includes coding-specific final state when provided", () => {
    const content = buildAssessUserContent("coding", {
      transcript: baseTranscript,
      questionTitle: "Two Sum",
      finalCode: "class Solution: ...",
      language: "python",
      lastRun: "exit 1\nfail",
    });
    expect(content).toContain("Two Sum");
    expect(content).toContain("final code (python)");
    expect(content).toContain("exit 1");
  });
});

describe("interviewer prompts and kickoffs", () => {
  it("produces different system prompts per mode", () => {
    const coding = getInterviewerSystemPrompt("coding", {
      questionTitle: "Foo",
      questionPrompt: "Solve two sum.",
    });
    const beh = getInterviewerSystemPrompt("behavioral", {
      questionTitle: "Bar",
      questionPrompt: "Tell me about a conflict.",
    });
    const sys = getInterviewerSystemPrompt("system-design", {
      questionTitle: "Baz",
      questionPrompt: "Design a cache.",
    });

    expect(coding).toContain("coding interview");
    expect(beh).toContain("behavioral interviewer");
    expect(sys).toContain("system design interviewer");

    // When both title and prompt are provided, the title is embedded in the prompt block.
    expect(coding).toContain("Foo");
    expect(beh).toContain("Bar");
    expect(sys).toContain("Baz");
  });

  it("produces mode-appropriate kickoff instructions", () => {
    expect(getKickoffPrompt("coding")).toContain("present this problem");
    expect(getKickoffPrompt("behavioral")).toContain("behavioral question");
    expect(getKickoffPrompt("system-design")).toContain("system design prompt");
  });
});

describe("target-level calibration", () => {
  it("interviewer prompt calibrates to the target level for behavioral and system-design", () => {
    for (const mode of ["behavioral", "system-design"] as const) {
      const prompt = getInterviewerSystemPrompt(mode, { targetLevel: "staff" });
      expect(prompt).toContain("Staff");
      expect(prompt).toContain("Calibrate your follow-ups");

      // Without a level, no calibration block appears.
      expect(getInterviewerSystemPrompt(mode)).not.toContain("Calibrate your follow-ups");
    }
  });

  it("assess prompt anchors scores to the target level", () => {
    for (const mode of ["behavioral", "system-design"] as const) {
      const prompt = getAssessSystemPrompt(mode, "principal");
      expect(prompt).toContain("3 = meets the bar for Principal");
    }
  });

  it("behavioral and system-design assess prompts always request performedAtLevel with the full ladder", () => {
    for (const mode of ["behavioral", "system-design"] as const) {
      // With and without a target level — performed-level judgment is unconditional.
      for (const prompt of [getAssessSystemPrompt(mode, "e2"), getAssessSystemPrompt(mode)]) {
        expect(prompt).toContain('"performedAtLevel"');
        expect(prompt).toContain("Level ladder");
        expect(prompt).toContain("Independently of the target level");
      }
    }
  });

  it("coding assess prompt is level-free", () => {
    const prompt = getAssessSystemPrompt("coding", "staff");
    expect(prompt).not.toContain('"performedAtLevel"');
    expect(prompt).not.toContain("Level ladder");
  });
});
