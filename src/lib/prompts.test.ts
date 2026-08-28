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
  TRANSCRIPT_ROLES,
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

describe("learning personas", () => {
  // Learning mode serves both language courses (editor + exercises) and concept
  // courses, which declare no `language` and have no editor at all. These pin
  // which persona each gets — a concept course being told to watch an editor
  // would have the tutor inventing exercises that don't exist.
  it("uses the course's language persona when a language is given", () => {
    const go = getSystemPrompt("learning", { language: "go" });
    expect(go).toMatch(/\bGo tutor\b/);
    expect(go).toMatch(/editor/i);
    expect(go).toMatch(/exercise/i);
    expect(getSystemPrompt("learning", { language: "typescript" })).toMatch(/TypeScript tutor/);
  });

  it("falls back to the Python persona for a bogus language string", () => {
    // A stale or hand-rolled client could send anything; that must not be read
    // as "concept course".
    const bogus = getSystemPrompt("learning", { language: "cobol" });
    expect(bogus).toBe(getSystemPrompt("learning", { language: "python" }));
    expect(bogus).toMatch(/Python tutor/);
    expect(getKickoffPrompt("learning", "cobol")).toBe(getKickoffPrompt("learning", "python"));
  });

  // The tutor writes the editor with the same <editor> protocol freestyle uses
  // (see parseSseStream), so these pin the protocol into every editor-bearing
  // lesson persona — language courses and subject courses alike. Without the
  // block in the prompt the write path is live but the model never triggers it.
  describe("<editor> write protocol", () => {
    const EDITOR_COURSES = [
      ["a language course", { language: "go" }],
      ["a subject course", { language: "typescript", course: "dsa" }],
    ] as const;

    it.each(EDITOR_COURSES)("is documented for %s", (_label, opts) => {
      const prompt = getSystemPrompt("learning", opts);
      expect(prompt).toContain("<editor lang=");
      expect(prompt).toContain("</editor>");
      // Full replacement, not a diff — the client overwrites the whole buffer.
      expect(prompt).toMatch(/whole editor|full new contents|replace/i);
      // The spoken-word rule has to carve out the block, or the model obeys
      // "never use code blocks" and never writes at all.
      expect(prompt).toMatch(/apart from the single <editor> block/i);
    });

    it.each(EDITOR_COURSES)("names %s's own language as the lang value", (_label, opts) => {
      // A block tagged with the wrong language is what a lesson editor must
      // never be told to emit: the buffer is per-language.
      expect(getSystemPrompt("learning", opts)).toContain(
        `<editor lang="${opts.language}">`
      );
    });

    it("covers what the learner can ask for: hints, the solution, a changed problem, pairing", () => {
      const prompt = getSystemPrompt("learning", { language: "python" });
      expect(prompt).toMatch(/hints or explanatory comments/i);
      expect(prompt).toMatch(/full solution/i);
      expect(prompt).toMatch(/adjust the problem/i);
      expect(prompt).toMatch(/pair-code/i);
      // …but only on request. Unprompted rewriting is what makes a tutor useless.
      expect(prompt).toMatch(/never just hand them the answer unprompted/i);
    });

    it("never reaches a concept course — those lessons have no editor to write", () => {
      for (const course of ["distributed-systems", "aws", "applied-ai"]) {
        expect(getSystemPrompt("learning", { course })).not.toContain("<editor");
      }
    });
  });

  it("uses the concept persona with no language, and never mentions an editor", () => {
    const concept = getSystemPrompt("learning", { course: "distributed-systems" });
    expect(concept).toMatch(/distributed systems tutor/i);
    expect(concept).not.toBe(getSystemPrompt("learning", { language: "python" }));
    // A concept course has no editor and no exercises. The persona says so
    // explicitly — silence would let the model fall back on the far more common
    // language-lesson shape and invent exercises the learner can't see.
    expect(concept).toMatch(/there is no editor/i);
    expect(concept).toMatch(/no exercises/i);
    expect(concept).toMatch(/never tell them to hit Next/i);
    expect(concept).not.toMatch(/watch their code|in the editor|run output/i);
    // Keeps the voice constraints every persona has.
    expect(concept).toMatch(/1-3 sentences/);
    expect(concept).toMatch(/(never use|no) markdown/i);
  });

  it("uses the subject persona for the DSA course — editor kept, syntax teaching dropped", () => {
    // A subject course (DSA) declares a language for the editor, but its tutor
    // must teach the subject. The course id wins over the language table —
    // otherwise this prompt would tell a TypeScript-fluent student they're "new
    // to TypeScript" and teach syntax instead of algorithms.
    const dsa = getSystemPrompt("learning", { language: "typescript", course: "dsa" });
    expect(dsa).toMatch(/data structures & algorithms tutor/i);
    expect(dsa).not.toMatch(/new to TypeScript/);
    expect(dsa).not.toBe(getSystemPrompt("learning", { language: "typescript" }));
    // The editor-aware lesson shape is shared with the language courses.
    expect(dsa).toMatch(/editor/i);
    expect(dsa).toMatch(/never just hand them the answer/i);
    expect(dsa).toMatch(/hit Next/);
    expect(dsa).toMatch(/Big-O/);

    const kickoff = getKickoffPrompt("learning", "typescript", undefined, false, "dsa");
    expect(kickoff).toMatch(/data structures & algorithms tutor/i);
    expect(kickoff).not.toBe(getKickoffPrompt("learning", "typescript"));

    const recap = getAssessSystemPrompt("learning", undefined, "typescript", "dsa");
    expect(recap).toMatch(/data structures & algorithms tutor/i);
    for (const key of ["summary", "conceptsCovered", "wentWell", "toReview", "suggestedNext"]) {
      expect(recap, `recap must request "${key}"`).toContain(`"${key}"`);
    }
  });

  it("treats an empty language as absent — that's how a concept course arrives", () => {
    // VoiceChat omits falsy context fields and /api/chat coalesces a missing
    // language to "", so "" is the wire form of "this course has no language".
    expect(getSystemPrompt("learning", { language: "" })).toBe(getSystemPrompt("learning"));
    expect(getKickoffPrompt("learning", "")).toBe(getKickoffPrompt("learning"));
    expect(getAssessSystemPrompt("learning", undefined, "")).toBe(
      getAssessSystemPrompt("learning")
    );
  });

  it("opens and recaps a concept lesson without an editor either", () => {
    const kickoff = getKickoffPrompt("learning", "", undefined, false, "distributed-systems");
    expect(kickoff).toMatch(/distributed systems tutor/i);
    expect(kickoff).not.toBe(getKickoffPrompt("learning", "go"));

    // The recap JSON shape is shared with the language courses — RecapCard
    // parses it — so only the framing copy may differ.
    const recap = getAssessSystemPrompt("learning", undefined, "", "distributed-systems");
    expect(recap).toMatch(/distributed systems tutor/i);
    for (const key of ["summary", "conceptsCovered", "wentWell", "toReview", "suggestedNext"]) {
      expect(recap, `recap must request "${key}"`).toContain(`"${key}"`);
      expect(getAssessSystemPrompt("learning", undefined, "go")).toContain(`"${key}"`);
    }
  });

  // A concept course declares no language, so the language table can't name its
  // tutor — the course id does. Before AWS existed the copy was hardcoded to
  // "distributed systems", which would have introduced every AWS lesson with the
  // wrong subject. These pin that each concept course names itself, everywhere.
  it.each([
    ["distributed-systems", /distributed systems tutor/i, /\bAWS\b/],
    ["aws", /\bAWS tutor\b/, /distributed systems/i],
    ["applied-ai", /\bapplied AI tutor\b/, /distributed systems/i],
  ])("names the %s tutor in every concept prompt", (course, itsOwn, theOther) => {
    const surfaces = [
      getSystemPrompt("learning", { course }),
      getKickoffPrompt("learning", "", undefined, false, course),
      getAssessSystemPrompt("learning", undefined, "", course),
    ];
    for (const prompt of surfaces) {
      expect(prompt).toMatch(itsOwn);
      expect(prompt, "must not carry another concept course's subject").not.toMatch(theOther);
    }
  });

  it("keeps the concept shape for a second concept course", () => {
    // The no-editor guarantees are the reason the concept persona exists; a new
    // concept course must inherit all of them, not just a new name.
    const aws = getSystemPrompt("learning", { course: "aws" });
    expect(aws).toMatch(/there is no editor/i);
    expect(aws).toMatch(/no exercises/i);
    expect(aws).not.toMatch(/watch their code|in the editor|run output/i);
    expect(aws).toMatch(/1-3 sentences/);
  });

  it("falls back to a named concept tutor for an unknown course id", () => {
    // Same rationale as the bogus-language fallback: a stale client must not
    // produce an unnamed "you are a  tutor" prompt.
    expect(getSystemPrompt("learning", { course: "does-not-exist" })).toBe(
      getSystemPrompt("learning", { course: "distributed-systems" })
    );
  });

  it("lets the language win when a course sends both", () => {
    // Language courses send their id too; the editor-bearing persona must not be
    // shadowed by a course-id lookup.
    expect(getSystemPrompt("learning", { language: "go", course: "go" })).toMatch(/\bGo tutor\b/);
  });

  it("still embeds the lesson script for both kinds of course", () => {
    const script = "LESSON: Vector clocks\n…notes…";
    expect(getSystemPrompt("learning", { questionPrompt: script })).toContain(script);
    expect(getSystemPrompt("learning", { language: "go", questionPrompt: script })).toContain(script);
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

describe("transcript role labels", () => {
  it("covers every session mode (the Record is the exhaustiveness check)", () => {
    for (const mode of SESSION_MODES) {
      const [speaker, listener] = TRANSCRIPT_ROLES[mode];
      expect(speaker.length, `${mode} speaker`).toBeGreaterThan(0);
      expect(listener.length, `${mode} listener`).toBeGreaterThan(0);
    }
    expect(Object.keys(TRANSCRIPT_ROLES).sort()).toEqual([...SESSION_MODES].sort());
  });

  it("keeps the labels each mode had before the table replaced the ternary", () => {
    for (const mode of [...MODES, "freestyle"] as const) {
      expect(TRANSCRIPT_ROLES[mode]).toEqual(["Interviewer", "Candidate"]);
    }
    expect(TRANSCRIPT_ROLES.learning).toEqual(["Tutor", "Student"]);
    expect(TRANSCRIPT_ROLES.career).toEqual(["Coach", "You"]);
  });
});

describe("career mode", () => {
  it("is a valid session mode but not a graded interview mode", () => {
    expect(SESSION_MODES).toContain("career");
    expect(isValidSessionMode("career")).toBe(true);
    expect(MODES).not.toContain("career");
    expect(isValidMode("career")).toBe(false);
  });

  describe("the coach persona", () => {
    const p = getSystemPrompt("career");

    it("is never evaluative — no grading, scoring, or hiring language", () => {
      // The whole point of the mode: the user is being helped, not assessed.
      // Word-boundary matches so ordinary words that merely contain these
      // ("generating", "higher") don't produce a phantom failure.
      expect(p).not.toMatch(/\bscores?\b|\bscored?\b|\bscoring\b|\bscorecard\b/i);
      expect(p).not.toMatch(/\bhire\b|no[-\s]hire|\bhiring\b/i);
      expect(p).not.toMatch(/\bratings?\b|\brate\b|\brated\b/i);
      expect(p).not.toMatch(/\bcandidate\b(?!\snotes)/i);
      expect(p).toMatch(/not an interview/i);
      expect(p).toMatch(/never evaluate|not to judge|understand them/i);
    });

    it("keeps the spoken-voice constraints every persona has", () => {
      expect(p).toMatch(/1-3 sentences/);
      expect(p).toMatch(/(never use|no) markdown/i);
      expect(p).toMatch(/one question at a time/i);
    });

    it("reads the background pane without reading it aloud", () => {
      expect(p).toContain("[Candidate notes:");
      expect(p).toMatch(/never say it out loud/i);
    });

    it("covers the six-part arc and follows up on thin answers", () => {
      for (const beat of [
        /doing now/i,
        /company, title, rough dates/i,
        /proudest/i,
        /technologies/i,
        /enjoyed/i,
        /want next/i,
      ]) {
        expect(p, `arc must cover ${beat}`).toMatch(beat);
      }
      expect(p).toMatch(/dig in|follow up on substance/i);
      expect(p).toMatch(/keep going until/i);
    });

    it("takes no question, no level, and no tutor flag", () => {
      const staff = getLevel("staff");
      expect(
        getSystemPrompt("career", {
          questionTitle: "Foo",
          questionPrompt: "Bar baz.",
          targetLevel: "staff",
          tutor: true,
          language: "go",
        })
      ).toBe(p);
      expect(p).not.toContain(staff.blurb);
    });

    it("opens by saying what the session produces", () => {
      const k = getKickoffPrompt("career");
      expect(k.length).toBeGreaterThan(20);
      expect(k).toMatch(/career coach/i);
      expect(k).toMatch(/resume/i);
      expect(k).toMatch(/paste/i);
      expect(k).toMatch(/End/);
      // Distinct from every other mode's opener.
      for (const mode of SESSION_MODES.filter((m) => m !== "career")) {
        expect(k).not.toBe(getKickoffPrompt(mode));
      }
    });
  });

  describe("the plan (assessment) prompt", () => {
    const a = getAssessSystemPrompt("career");

    it("requests exactly the five keys CareerPlanCard renders", () => {
      expect(a).toContain("ONLY a JSON object");
      for (const key of ["summary", "strengths", "roles", "resumeMarkdown", "jobSearchPrompt"]) {
        expect(a, `career plan must request "${key}"`).toContain(`"${key}"`);
      }
      for (const key of ["title", "whyFit", "toStrengthen"]) {
        expect(a, `each role must carry "${key}"`).toContain(`"${key}"`);
      }
      expect(a).toMatch(/3 to 5|3-5/);
      expect(a).toMatch(/best fit first|ranked/i);
    });

    it("carries the no-fabrication rule, with bracketed placeholders as the escape hatch", () => {
      expect(a).toMatch(/NEVER FABRICATE/);
      expect(a).toMatch(/only what the user actually said/i);
      expect(a).toMatch(/never invent an employer/i);
      expect(a).toContain("[Dates — please fill in]");
      expect(a).toMatch(/placeholder/i);
    });

    it("requires a self-contained job-search prompt", () => {
      expect(a).toMatch(/self-contained/i);
      expect(a).toMatch(/seniority/i);
      expect(a).toMatch(/constraints/i);
      expect(a).toMatch(/rank/i);
    });

    it("produces no grade — no recommendation, scores, or level", () => {
      expect(a).not.toContain('"recommendation"');
      expect(a).not.toContain('"scores"');
      expect(a).not.toContain('"performedAtLevel"');
      // A level or language passed by the shared route must change nothing.
      expect(getAssessSystemPrompt("career", "staff", "go")).toBe(a);
    });

    it("feeds the transcript and the pasted background to the writer", () => {
      const transcript = "Coach: Where are you now?\nYou: Platform team at Acme.";
      const notes = "PASTED_RESUME_SENTINEL";
      expect(buildAssessUserContent("career", { transcript })).toContain(transcript);
      expect(buildAssessUserContent("career", { transcript })).not.toContain(notes);
      expect(buildAssessUserContent("career", { transcript, notes })).toContain(notes);
    });
  });

  it("leaves the other five modes' prompts uncontaminated", () => {
    const others = SESSION_MODES.filter((m) => m !== "career");
    for (const mode of others) {
      // No career keys leaked into another mode's rubric…
      for (const key of ["roles", "resumeMarkdown", "jobSearchPrompt"]) {
        expect(getAssessSystemPrompt(mode), `${mode} must not request "${key}"`).not.toContain(
          `"${key}"`
        );
      }
      // …and career's own prompts are its own.
      expect(getSystemPrompt(mode)).not.toBe(getSystemPrompt("career"));
      expect(getAssessSystemPrompt(mode)).not.toBe(getAssessSystemPrompt("career"));
    }
  });
});

// Tutor mode turns the end of an interview into a lesson, not a verdict: the
// assessor writes the same ungraded recap RecapCard already renders for
// learning mode. These tests pin the absence of the grade as tightly as the
// presence of the recap — a scored key or a level creeping back in is the
// regression that matters.
describe("tutor-mode assess prompts", () => {
  const tutorAssess = (mode: (typeof MODES)[number]) =>
    getAssessSystemPrompt(mode, "senior", undefined, undefined, true);

  it("asks for exactly the RecapCard JSON shape", () => {
    for (const mode of MODES) {
      const p = tutorAssess(mode);
      expect(p).toContain("ONLY a JSON object");
      for (const key of ["summary", "conceptsCovered", "wentWell", "toReview", "suggestedNext"]) {
        expect(p, `${mode} tutor recap must request "${key}"`).toContain(`"${key}"`);
      }
    }
  });

  it("requests none of the scorecard keys", () => {
    for (const mode of MODES) {
      const p = tutorAssess(mode);
      for (const key of ["recommendation", "overall", "scores", "performedAtLevel"]) {
        expect(p, `${mode} tutor recap must not request "${key}"`).not.toContain(`"${key}"`);
      }
      // Nor the axes the graded rubric scores.
      for (const key of Object.keys(SCORE_LABELS[mode])) {
        expect(p, `${mode} tutor recap must not request "${key}"`).not.toContain(`"${key}"`);
      }
    }
  });

  it("carries no scoring or hiring language at all", () => {
    for (const mode of MODES) {
      const p = tutorAssess(mode);
      for (const banned of [/\bscor(e|es|ing|ecard)\b/i, /\bhir(e|es|ing)\b/i, /\brecommendation\b/i, /\b1-5\b/, /\bpass\/fail\b/i]) {
        expect(p, `${mode} tutor recap must not say ${banned}`).not.toMatch(banned);
      }
      expect(p).toMatch(/not an evaluation|nothing here is graded/i);
    }
  });

  it("never anchors to a target level, whichever one the picker shipped", () => {
    for (const mode of MODES) {
      for (const level of ["e1", "staff", "principal"] as const) {
        const p = getAssessSystemPrompt(mode, level, undefined, undefined, true);
        expect(p).not.toContain(getLevel(level).label);
        expect(p).not.toContain(getLevel(level).blurb);
        expect(p).not.toContain(describeLevelLadder());
        // The level is ignored, so it can't change the prompt either.
        expect(p).toBe(getAssessSystemPrompt(mode, "e2", undefined, undefined, true));
      }
    }
  });

  it("stays mode-appropriate about what the feedback must cite", () => {
    expect(tutorAssess("coding")).toMatch(/complexity/i);
    expect(tutorAssess("coding")).toMatch(/code they actually wrote/i);
    expect(tutorAssess("behavioral")).toMatch(/story/i);
    expect(tutorAssess("behavioral")).toMatch(/STAR|situation, task/i);
    expect(tutorAssess("system-design")).toMatch(/design decisions/i);
    expect(tutorAssess("system-design")).toMatch(/tradeoff/i);
    // …and each mode's recap is its own.
    for (const a of MODES) {
      for (const b of MODES) {
        if (a !== b) expect(tutorAssess(a)).not.toBe(tutorAssess(b));
      }
    }
  });

  it("leaves the graded assess prompts untouched when tutor mode is off", () => {
    for (const mode of MODES) {
      const graded = getAssessSystemPrompt(mode, "senior");
      expect(getAssessSystemPrompt(mode, "senior", undefined, undefined, false)).toBe(graded);
      expect(getAssessSystemPrompt(mode, "senior", undefined, undefined, undefined)).toBe(graded);
      expect(tutorAssess(mode)).not.toBe(graded);
    }
  });

  it("is ignored by the modes that have no tutor toggle", () => {
    // learning and career are already ungraded and own their end-of-session
    // output; a stray tutor flag must not change a thing.
    for (const mode of ["learning", "career"] as const) {
      expect(getAssessSystemPrompt(mode, undefined, "go", undefined, true)).toBe(
        getAssessSystemPrompt(mode, undefined, "go")
      );
    }
  });
});
