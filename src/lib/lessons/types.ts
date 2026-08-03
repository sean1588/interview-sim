// Shared types for the learning banks. A Course bundles its own ordered module
// metadata and a flat lesson list; each course lives in its own folder and is
// assembled into the COURSES registry in index.ts. Public import: "@/lib/lessons".

import type { LanguageId } from "@/lib/problems";

/**
 * The courses that teach an idea rather than a language, so they declare no
 * `language` (below) and run conversationally. Their tutor persona can't be
 * keyed off a language, so it's keyed off the course id — this union is the
 * compile-time link to CONCEPT_PROFILE in "@/lib/prompts": adding a concept
 * course here without a persona there fails the build.
 */
export type ConceptCourseId = "distributed-systems" | "aws";

export interface Exercise {
  /** Globally unique (across all courses), kebab-case. */
  id: string;
  title: string;
  /** Markdown, shown above the editor. */
  instructions: string;
  /**
   * Runnable scaffold the learner starts from: a signature/types plus an example
   * call that prints something. A runnable starting point, NEVER a solution.
   */
  starterCode: string;
}

export interface Lesson {
  /** Globally unique (across all courses), kebab-case — the /learn/[course]/[lessonId] segment. */
  id: string;
  /** A module id within the owning course (see Course.modules). */
  module: string;
  title: string;
  /** One-liner for the course overview. */
  blurb: string;
  /**
   * Markdown "lesson card": the concept plus idiomatic examples, written for an
   * experienced programmer (explicit contrasts with the languages they know).
   */
  content: string;
  /** Ordered exercises. Empty for conversational lessons (e.g. tooling). */
  exercises: Exercise[];
}

export interface Module {
  id: string;
  title: string;
  blurb: string;
}

export interface Course {
  /** Kebab-case, globally unique — the /learn/[course] route segment. */
  id: string;
  /**
   * Editor + runner language, and the tutor-persona key. Omitted by *concept*
   * courses (e.g. distributed systems), which teach an idea rather than a
   * language: those are conversational only — no exercises, no editor.
   */
  language?: LanguageId;
  /** Display name, e.g. "Python" / "TypeScript". */
  title: string;
  /** One-liner for the picker and the course overview header. */
  tagline: string;
  /** Emoji for the home + picker cards. */
  icon: string;
  /** Ordered module metadata — drives the overview and lesson grouping. */
  modules: Module[];
  /** Flat, ordered list of every lesson (module order, then sequence within). */
  lessons: Lesson[];
}
