import { describe, it, expect } from "vitest";
import {
  MODES,
  SESSION_MODES,
  isValidMode,
  isValidSessionMode,
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
    const kickoffs = MODES.map((m) => getKickoffPrompt(m));
    expect(new Set(kickoffs).size).toBe(MODES.length);
    for (const k of kickoffs) {
      expect(k.length).toBeGreaterThan(20);
    }
  });
});

describe("tutor mode", () => {
  // Tutor mode is a persona flag orthogonal to mode: same problem bank, editor,
  // and scorecard — only the live interviewer changes. These tests pin the
  // contract (which modes honour the flag, and that the persona actually flips),
  // not the coaching copy itself.
  const TUTORABLE = ["coding", "system-design"] as const;

  it("flips coding and system-design to a coaching persona", () => {
    for (const mode of TUTORABLE) {
      const off = getSystemPrompt(mode, { questionTitle: "Foo", questionPrompt: "Bar baz." });
      const on = getSystemPrompt(mode, {
        questionTitle: "Foo",
        questionPrompt: "Bar baz.",
        tutor: true,
      });
      expect(on).not.toBe(off);
      expect(on).toMatch(/tutor/i);
      expect(on).toMatch(/not an evaluation/i);
      // The teaching persona hands the approach over rather than withholding it.
      expect(on).toMatch(/do not withhold|Never withhold/i);
      // And it keeps the voice constraints the evaluative persona has.
      expect(on).toMatch(/1-3 sentences/);
      expect(on).toMatch(/(never use|no) markdown/i);
      // The question still reaches the prompt.
      expect(on).toContain("Foo");
      expect(on).toContain("Bar baz.");
    }
  });

  it("still calibrates system-design to the target level, and never coding", () => {
    const staff = getLevel("staff");
    expect(
      getSystemPrompt("system-design", { targetLevel: "staff", tutor: true })
    ).toContain(staff.blurb);
    expect(
      getSystemPrompt("coding", { targetLevel: "staff", tutor: true })
    ).not.toContain(staff.blurb);
  });

  it("is ignored by every other mode", () => {
    for (const mode of ["learning", "freestyle"] as const) {
      expect(getSystemPrompt(mode, { tutor: true })).toBe(getSystemPrompt(mode, {}));
      expect(getKickoffPrompt(mode, undefined, undefined, true)).toBe(
        getKickoffPrompt(mode)
      );
    }
  });

  it("opens coding and system-design with a teaching kickoff", () => {
    for (const mode of TUTORABLE) {
      const on = getKickoffPrompt(mode, undefined, undefined, true);
      expect(on).not.toBe(getKickoffPrompt(mode));
      expect(on).toMatch(/tutor/i);
      expect(on).toMatch(/together/i);
    }
  });

  it("flips behavioral to a STAR-coaching persona (not a coding-style hand-over)", () => {
    const off = getSystemPrompt("behavioral", { questionTitle: "Foo", questionPrompt: "Bar baz." });
    const on = getSystemPrompt("behavioral", {
      questionTitle: "Foo",
      questionPrompt: "Bar baz.",
      tutor: true,
    });
    expect(on).not.toBe(off);
    // Distinctive behavioral-coaching language: STAR framework, coaching, practice.
    expect(on).toMatch(/STAR/i);
    expect(on).toMatch(/not an evaluation|coach/i);
    // Keeps the voice constraints the evaluative persona has.
    expect(on).toMatch(/1-3 sentences/);
    expect(on).toMatch(/(never use|no) markdown/i);
    // The question still reaches the prompt.
    expect(on).toContain("Foo");
    expect(on).toContain("Bar baz.");
  });

  it("opens behavioral with a coaching kickoff", () => {
    const on = getKickoffPrompt("behavioral", undefined, undefined, true);
    expect(on).not.toBe(getKickoffPrompt("behavioral"));
  });

  it("is off by default — omitting the flag changes nothing", () => {
    for (const mode of SESSION_MODES) {
      expect(getSystemPrompt(mode, { tutor: false })).toBe(getSystemPrompt(mode));
      expect(getKickoffPrompt(mode, undefined, undefined, false)).toBe(
        getKickoffPrompt(mode)
      );
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

describe("freestyle mode", () => {
  it("is a valid session mode but not one of the graded interview modes", () => {
    expect(SESSION_MODES).toContain("freestyle");
    expect(isValidSessionMode("freestyle")).toBe(true);
    expect(MODES).not.toContain("freestyle");
    expect(isValidMode("freestyle")).toBe(false);
  });

  it("documents the <editor> write protocol in its system prompt", () => {
    const p = getSystemPrompt("freestyle");
    expect(p.length).toBeGreaterThan(20);
    // The model must know the exact tag form and that the body replaces the editor.
    expect(p).toContain('<editor lang="python">');
    expect(p).toContain("</editor>");
    expect(p).toMatch(/whole editor|full new contents|replace/i);
  });

  it("forbids grading — freestyle is an ungraded sandbox", () => {
    expect(getSystemPrompt("freestyle")).toMatch(
      /never give scores|not an evaluation|no-hire|pass\/fail/i
    );
  });

  it("has a non-empty kickoff that asks what to work on", () => {
    const k = getKickoffPrompt("freestyle");
    expect(k.length).toBeGreaterThan(20);
  });

  describe("optional custom question", () => {
    // A distinctive sentinel that never appears in any prompt's static copy, so
    // "did the question reach the prompt?" is a copy-proof presence check. These
    // tests pin the contract (question reaches the prompt; blank = default; text
    // survives verbatim), NOT the wording — copy edits must not break them.
    const Q = "SENTINEL_TOPIC: implement an LRU cache with O(1) get and put.";

    it("is optional — a blank question is identical to the default flow", () => {
      // The route coalesces "" -> undefined, so an empty string MUST fall
      // through to the default (no-question) prompts, not a degenerate variant.
      expect(getSystemPrompt("freestyle", { questionPrompt: "" })).toBe(
        getSystemPrompt("freestyle")
      );
      expect(getKickoffPrompt("freestyle", undefined, "")).toBe(
        getKickoffPrompt("freestyle")
      );
      // And the default prompts never embed a question.
      expect(getSystemPrompt("freestyle")).not.toContain(Q);
      expect(getKickoffPrompt("freestyle")).not.toContain(Q);
    });

    it("embeds the question verbatim in both the system prompt and the kickoff", () => {
      expect(getSystemPrompt("freestyle", { questionPrompt: Q })).toContain(Q);
      expect(getKickoffPrompt("freestyle", undefined, Q)).toContain(Q);
    });

    it("sets a question apart from the default flow (differential, not prose-coupled)", () => {
      expect(getSystemPrompt("freestyle", { questionPrompt: Q })).not.toBe(
        getSystemPrompt("freestyle")
      );
      expect(getKickoffPrompt("freestyle", undefined, Q)).not.toBe(
        getKickoffPrompt("freestyle")
      );
    });

    it("embeds quotes, triple-quotes, and newlines without mangling them", () => {
      // Pasted problems routinely contain double-quotes, Python docstrings
      // (`"""`), and newlines — they must survive into the prompt intact, which
      // is why the prompt uses no symmetric fence around the question.
      const messy = 'Build a """rate limiter""".\nIt must handle "bursts" — O(1).';
      expect(getSystemPrompt("freestyle", { questionPrompt: messy })).toContain(messy);
      expect(getKickoffPrompt("freestyle", undefined, messy)).toContain(messy);
    });
  });
});
