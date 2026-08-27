// Shared types for the coding problem bank. The bank itself is split by topic
// under this directory and assembled in index.ts.

export type LanguageId = "python" | "javascript" | "typescript" | "go";

/** Display names for the language pickers (editor toolbar, course overview). */
export const LANGUAGE_LABELS: Record<LanguageId, string> = {
  python: "Python",
  javascript: "JavaScript",
  typescript: "TypeScript",
  go: "Go",
};

export type Difficulty = "Easy" | "Medium" | "Hard";

/** One invocation of the solution: positional args in, expected return value out. */
export interface TestCase {
  args: unknown[];
  expected: unknown;
}

export interface TestSpec {
  /**
   * The solution function's idiomatic name per language (`two_sum` in Python,
   * `twoSum` in JS/TS). Must have an entry for every language in the problem's
   * `starterCode`, and each name must be the function the starter declares.
   */
  entryPoint: Partial<Record<LanguageId, string>>;
  cases: TestCase[];
  /**
   * Set when the problem accepts any ordering of the top-level result (Two Sum's
   * "you can return the answer in any order"). Grading then sorts BOTH actual and
   * expected by `JSON.stringify` before comparing — top level only, so nested
   * elements keep their order.
   */
  unordered?: boolean;
}

export interface Problem {
  id: string;
  title: string;
  difficulty: Difficulty;
  /** Markdown-ish prompt shown to the candidate. */
  prompt: string;
  /**
   * Starter scaffold per language. Partial: a problem may only be available in
   * a subset of languages (e.g. JS-only utilities). The candidate's language
   * picker is driven by which keys are present here.
   */
  starterCode: Partial<Record<LanguageId, string>>;
  /**
   * Cases the Run button grades against. Optional: a problem whose solution isn't a
   * pure function of JSON-able args returning a JSON-able value (class-based designs,
   * linked-list/tree node inputs, in-place mutation, float results) omits this and
   * keeps today's plain-Run behaviour. When omitting for that reason, say so in a
   * one-line comment on the problem.
   */
  tests?: TestSpec;
}
