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

export type { Problem, LanguageId, Difficulty } from "./types";

export const PROBLEMS: Problem[] = [
  ...arraysProblems,
  ...stringsProblems,
  ...searchingProblems,
  ...linkedListProblems,
  ...treeProblems,
  ...graphProblems,
  ...heapProblems,
  ...dpProblems,
  ...backtrackingProblems,
  ...designProblems,
  ...jsUtilProblems,
  ...practicalProblems,
];

export function getProblem(id: string): Problem | undefined {
  return PROBLEMS.find((p) => p.id === id);
}
