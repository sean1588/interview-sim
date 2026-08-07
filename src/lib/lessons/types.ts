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

/**
 * The courses that teach a subject THROUGH a language rather than the language
 * itself (DSA in TypeScript): they declare a `language` — so they get the editor
 * and exercises — but their tutor must teach the subject, not language syntax.
 * Same compile-time link as above: this union is keyed to SUBJECT_PROFILE in
 * "@/lib/prompts", so adding a subject course here without a persona there
 * fails the build.
 */
export type SubjectCourseId = "dsa";

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

/**
 * One multiple-choice retention check, shown in the lesson's Quiz tab.
 *
 * Hand-written rather than generated: a quiz that marks a right answer wrong
 * teaches the learner something false, so the answers have to be reviewable and
 * testable like every other content bank here.
 */
export interface QuizQuestion {
  /** Globally unique (across all courses), kebab-case. */
  id: string;
  /** The question. Plain text — rendered as markdown, so inline code is fine. */
  prompt: string;
  /** Exactly QUIZ_OPTIONS choices; the wrong ones must be plausible, not filler. */
  options: string[];
  /** Index into `options` of the single correct choice. */
  answer: number;
  /** Why that answer is right, shown once the learner has picked. */
  explanation: string;
}

/**
 * A concept illustration shown in the lesson's Graphics tab. Optional — most
 * courses have none; DSA lessons carry one (or a few) figures that visualize
 * the idea the notes describe.
 */
export interface LessonGraphic {
  /**
   * Stable id within the lesson, kebab-case. Unlike Exercise/QuizQuestion ids,
   * this is only ever used as a render key inside the owning lesson — never
   * looked up globally — so it doesn't need cross-course uniqueness.
   */
  id: string;
  /** Short label above the figure. */
  title: string;
  /** 1–2 sentences tying the figure to the concept; plain text. */
  caption?: string;
  /** Public path, e.g. `/lesson-graphics/dsa/dsa-big-o.png`. */
  src: string;
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
  /**
   * End-of-lesson retention check. Exactly QUIZ_LENGTH questions on EVERY lesson,
   * exercises or not — the one part of a lesson that is never optional. Questions
   * the learner misses are fed back to the tutor (see buildLessonScript).
   */
  quiz: QuizQuestion[];
  /**
   * Optional concept illustrations for the Graphics tab. Omitted or empty when
   * the lesson has no figure — the tab is hidden in that case.
   */
  graphics?: LessonGraphic[];
}

/** Questions per lesson quiz. Enforced by the lesson bank tests. */
export const QUIZ_LENGTH = 3;

/** Choices per question. Enforced by the lesson bank tests. */
export const QUIZ_OPTIONS = 4;

export interface Module {
  id: string;
  title: string;
  blurb: string;
}

export interface Course {
  /** Kebab-case, globally unique — the /learn/[course] route segment. */
  id: string;
  /**
   * Editor + runner language, and (for language courses) the tutor-persona key.
   * Omitted by *concept* courses (e.g. distributed systems), which teach an
   * idea rather than a language: those are conversational only — no exercises,
   * no editor. *Subject* courses (see SubjectCourseId) declare it for the
   * editor but their persona is keyed off the course id instead.
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
