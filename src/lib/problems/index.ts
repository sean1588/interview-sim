// The coding problem bank, assembled from per-topic files. Public API is
// unchanged from the old single-file module: import from "@/lib/problems".

import type { Problem } from "./types";
import { arraysProblems } from "./arrays";
import { stringsProblems } from "./strings";
import { searchingProblems } from "./searching";
import { linkedListProblems } from "./linked-lists";
import { treeProblems } from "./trees";
import { graphProblems } from "./graphs";
import { heapProblems } from "./heap";
import { dpProblems } from "./dp";
import { backtrackingProblems } from "./backtracking";
import { designProblems } from "./design";
import { jsUtilProblems } from "./js-utils";
import { practicalProblems } from "./practical";

export type { Problem, LanguageId, Difficulty, TestCase, TestSpec } from "./types";

// Topic taxonomy lives here, in the file that already owns the per-topic
// arrays — no `topic` field is added to the ~70 individual problems. The flat
// PROBLEMS list is derived from this so the two can't drift.
export const PROBLEM_GROUPS: { topic: string; problems: Problem[] }[] = [
  { topic: "Arrays", problems: arraysProblems },
  { topic: "Strings", problems: stringsProblems },
  { topic: "Searching", problems: searchingProblems },
  { topic: "Linked Lists", problems: linkedListProblems },
  { topic: "Trees", problems: treeProblems },
  { topic: "Graphs", problems: graphProblems },
  { topic: "Heap", problems: heapProblems },
  { topic: "Dynamic Programming", problems: dpProblems },
  { topic: "Backtracking", problems: backtrackingProblems },
  { topic: "Design", problems: designProblems },
  { topic: "JS Utilities", problems: jsUtilProblems },
  { topic: "Practical", problems: practicalProblems },
];

export const PROBLEMS: Problem[] = PROBLEM_GROUPS.flatMap((g) => g.problems);

export function getProblem(id: string): Problem | undefined {
  return PROBLEMS.find((p) => p.id === id);
}
