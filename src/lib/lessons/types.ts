// Shared types for the Python learning bank. The course is split by module
// under this directory and assembled in index.ts. Public import: "@/lib/lessons".

export type ModuleId =
  | "basics"
  | "data-structures"
  | "idioms"
  | "oop-typing"
  | "stdlib"
  | "errors-testing"
  | "tooling"
  | "libraries";

export interface Exercise {
  /** Globally unique, kebab-case. */
  id: string;
  title: string;
  /** Markdown, shown above the editor. */
  instructions: string;
  /**
   * Python scaffold the learner starts from: a signature plus an example call
   * that prints something. A runnable starting point, NEVER a solution.
   */
  starterCode: string;
}

export interface Lesson {
  /** Globally unique, kebab-case — also the /learn/[lessonId] route segment. */
  id: string;
  module: ModuleId;
  title: string;
  /** One-liner for the /learn overview. */
  blurb: string;
  /**
   * Markdown "lesson card": the concept plus idiomatic examples, written for an
   * experienced programmer (explicit contrasts with TS/Java/Go where they help).
   */
  content: string;
  /** Ordered exercises. Empty for conversational lessons (e.g. tooling). */
  exercises: Exercise[];
}

export interface Module {
  id: ModuleId;
  title: string;
  blurb: string;
}
