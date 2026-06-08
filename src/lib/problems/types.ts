// Shared types for the coding problem bank. The bank itself is split by topic
// under this directory and assembled in index.ts.

export type LanguageId = "python" | "javascript" | "typescript";

export type Difficulty = "Easy" | "Medium" | "Hard";

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
}
