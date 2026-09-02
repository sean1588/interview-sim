import { describe, it, expect } from "vitest";
import type { ScorecardData, ScoreItem } from "@/components/Scorecard";
import type { SessionRecord } from "@/lib/history";
import type { InterviewMode } from "@/lib/types/mode";
import { nextSession } from "./next-session";

function scores(entries: Record<string, number | ScoreItem>): Record<string, ScoreItem> {
  return Object.fromEntries(
    Object.entries(entries).map(([k, v]) => [
      k,
      typeof v === "number" ? { score: v, notes: `${k} notes` } : v,
    ])
  );
}

function rec(
  id: string,
  mode: InterviewMode,
  createdAt: number,
  result: Partial<ScorecardData> & { scores?: Record<string, ScoreItem> }
): SessionRecord {
  return {
    id,
    mode,
    questionTitle: `Q ${id}`,
    createdAt,
    result: {
      recommendation: "Hire",
      overall: 3,
      scores: result.scores ?? {},
      strengths: [],
      improvements: result.improvements ?? [],
      summary: "ok",
    },
  };
}

describe("nextSession", () => {
  it("empty history → one coding first-session link", () => {
    const next = nextSession([]);
    expect(next).toEqual({
      kind: "first",
      href: "/coding",
      title: "Coding Interview",
      description: "",
      cta: "Start a coding interview",
      icon: "💻",
    });
  });

  it("mins scores on the newest card only and stays in that card's mode", () => {
    // Older coding card is weaker on correctness — must be ignored.
    const older = rec("old", "coding", 1, {
      scores: scores({ correctness: 1, communication: 5 }),
    });
    const newer = rec("new", "behavioral", 2, {
      scores: scores({
        storytelling: 4,
        ownership: 2,
        impact: 5,
        specificity: 3,
        reflection: 4,
      }),
    });

    const next = nextSession([newer, older]);
    expect(next.kind).toBe("drill");
    if (next.kind !== "drill") return;
    expect(next.href).toBe("/behavioral");
    expect(next.mode).toBe("behavioral");
    expect(next.axis).toBe("ownership");
    expect(next.label).toBe("Ownership & Initiative");
    expect(next.title).toBe("Ownership & Initiative");
    expect(next.description).toBe("ownership notes");
    expect(next.cta).toBe("Start next session");
  });

  it("looks up SCORE_LABELS on that card's mode (same key shape, not the same label)", () => {
    const coding = rec("c", "coding", 2, {
      scores: scores({
        correctness: 5,
        problemSolving: 5,
        codeQuality: 5,
        communication: 1,
        complexity: 5,
      }),
    });
    const design = rec("d", "system-design", 2, {
      scores: scores({
        requirements: 5,
        highLevelDesign: 5,
        componentDesign: 5,
        scalabilityTradeoffs: 5,
        communication: 1,
      }),
    });

    const fromCoding = nextSession([coding]);
    expect(fromCoding.kind).toBe("drill");
    if (fromCoding.kind !== "drill") return;
    expect(fromCoding.href).toBe("/coding");
    expect(fromCoding.axis).toBe("communication");
    expect(fromCoding.label).toBe("Communication");

    const fromDesign = nextSession([design]);
    expect(fromDesign.kind).toBe("drill");
    if (fromDesign.kind !== "drill") return;
    expect(fromDesign.href).toBe("/system-design");
    expect(fromDesign.axis).toBe("communication");
    expect(fromDesign.label).toBe("Communication & Reasoning");
  });

  it("uses notes on the weak line; falls back to improvements[] when notes are empty", () => {
    const withNotes = rec("n", "coding", 1, {
      scores: scores({
        correctness: { score: 2, notes: "Missed the empty-array case." },
        communication: { score: 5, notes: "Clear." },
      }),
      improvements: ["Talk through complexity out loud."],
    });
    expect(nextSession([withNotes]).description).toBe("Missed the empty-array case.");

    const notesSilent = rec("i", "coding", 1, {
      scores: scores({
        correctness: { score: 2, notes: "   " },
        communication: { score: 5, notes: "Clear." },
      }),
      improvements: ["Walk a failing test before rewriting."],
    });
    expect(nextSession([notesSilent]).description).toBe(
      "Walk a failing test before rewriting."
    );
  });

  it("tie on the newest card keeps the first min in that card's score order", () => {
    const tied = rec("t", "coding", 1, {
      scores: scores({
        correctness: 2,
        problemSolving: 2,
        codeQuality: 5,
      }),
    });
    const next = nextSession([tied]);
    expect(next.kind).toBe("drill");
    if (next.kind !== "drill") return;
    expect(next.axis).toBe("correctness");
    expect(next.label).toBe("Correctness");
  });
});
