/**
 * Target level ladder for behavioral and system-design interviews, modeled on
 * top-tier tech company expectations. Each blurb is written in mode-agnostic
 * terms (scope, autonomy, ambiguity, influence) so the same source feeds both
 * the live interviewer prompt and the post-interview assessment rubric.
 */

export type TargetLevel = "e1" | "e2" | "senior" | "staff" | "principal";

export type LevelInfo = {
  id: TargetLevel;
  /** Short display name — also the value the assessor emits in performedAtLevel. */
  label: string;
  /** Picker subtitle, e.g. "new grad / junior". */
  hint: string;
  /** What a strong candidate at this level looks like. Completes the sentence
   * "A strong candidate at this level …". */
  blurb: string;
};

export const LEVELS: LevelInfo[] = [
  {
    id: "e1",
    label: "E1",
    hint: "new grad / junior",
    blurb:
      "delivers well-scoped tasks with guidance, writes solid code, communicates clearly, learns quickly, and knows when to ask for help. They are not yet expected to drive ambiguous projects or influence beyond their immediate work.",
  },
  {
    id: "e2",
    label: "E2",
    hint: "mid-level",
    blurb:
      "owns features end-to-end with minimal guidance, handles routine ambiguity within a project, makes sound technical decisions at the feature level, and collaborates effectively across their team.",
  },
  {
    id: "senior",
    label: "Senior",
    hint: "senior engineer",
    blurb:
      "owns large projects or systems end-to-end, drives work across team boundaries, anticipates failure modes before they happen, makes well-reasoned tradeoffs under constraints, and mentors other engineers.",
  },
  {
    id: "staff",
    label: "Staff",
    hint: "staff engineer",
    blurb:
      "operates at org-level scope: sets technical direction across multiple teams, influences without formal authority, identifies and solves important problems nobody assigned them, and multiplies the effectiveness of the engineers around them.",
  },
  {
    id: "principal",
    label: "Principal",
    hint: "principal engineer",
    blurb:
      "operates at company-level scope: shapes multi-year technical strategy, navigates the most ambiguous and high-stakes problems, aligns leadership and whole organizations, and is accountable for outcomes far beyond any single system or team.",
  },
];

export function isValidLevel(l: string | null | undefined): l is TargetLevel {
  return LEVELS.some((lvl) => lvl.id === l);
}

export function getLevel(id: TargetLevel): LevelInfo {
  return LEVELS.find((lvl) => lvl.id === id)!;
}

/** The full ladder as a compact text block for assessment prompts, so the
 * model can place a performance on it independent of the target level. */
export function describeLevelLadder(): string {
  return LEVELS.map((lvl) => `- ${lvl.label} (${lvl.hint}): ${lvl.blurb}`).join("\n");
}
