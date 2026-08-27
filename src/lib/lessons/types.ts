// Shared types for the learning banks. A Course bundles its own ordered module
// metadata and a flat lesson list; each course lives in its own folder and is
// assembled into the COURSES registry in index.ts. Public import: "@/lib/lessons".

import type { LanguageId } from "@/lib/problems";

/**
 * The courses that teach an idea rather than a language, so they declare no
 * `languages` (below) and run conversationally. Their tutor persona can't be
 * keyed off a language, so it's keyed off the course id — this union is the
 * compile-time link to CONCEPT_PROFILE in "@/lib/prompts": adding a concept
 * course here without a persona there fails the build.
 */
export type ConceptCourseId = "distributed-systems" | "aws" | "applied-ai";

/**
 * The courses that teach a subject THROUGH a language rather than the language
 * itself (DSA in TypeScript or Python): they declare `languages` — so they get
 * the editor and exercises — but their tutor must teach the subject, not
 * language syntax. Same compile-time link as above: this union is keyed to
 * SUBJECT_PROFILE in "@/lib/prompts", so adding a subject course here without a
 * persona there fails the build.
 */
export type SubjectCourseId = "dsa";

/**
 * A value that differs by language, used for the parts of a lesson that can't
 * survive a language switch — code samples, the prose around them, and the odd
 * quiz question about a language-specific footgun.
 *
 * A bare `T` applies to every language. That's the whole point: a single-language
 * course never mentions languages at all, and a multi-language lesson keys only
 * the fields that actually change instead of duplicating everything that doesn't.
 *
 * Authoring types below use this; the UI and the tutor consume the *resolved*
 * types (ResolvedLesson), where every one of these is already a plain string.
 */
export type ByLanguage<T> = T | Partial<Record<LanguageId, T>>;

export interface Exercise {
  /** Globally unique (across all courses), kebab-case. */
  id: string;
  title: ByLanguage<string>;
  /** Markdown, shown above the editor. */
  instructions: ByLanguage<string>;
  /**
   * Runnable scaffold the learner starts from: a signature/types plus an example
   * call that prints something. A runnable starting point, NEVER a solution.
   */
  starterCode: ByLanguage<string>;
}

/** An Exercise with its per-language fields resolved — what the editor renders. */
export interface ResolvedExercise
  extends Omit<Exercise, "title" | "instructions" | "starterCode"> {
  title: string;
  instructions: string;
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
  prompt: ByLanguage<string>;
  /** Exactly QUIZ_OPTIONS choices; the wrong ones must be plausible, not filler. */
  options: ByLanguage<string[]>;
  /**
   * Index into `options` of the single correct choice. Shared across languages:
   * a per-language `options` list must keep its correct choice in the same slot,
   * which the lesson tests check for every declared language.
   */
  answer: number;
  /** Why that answer is right, shown once the learner has picked. */
  explanation: ByLanguage<string>;
}

/** A QuizQuestion with its per-language fields resolved. */
export interface ResolvedQuizQuestion extends Omit<QuizQuestion, "prompt" | "options" | "explanation"> {
  prompt: string;
  options: string[];
  explanation: string;
}

/**
 * A concept illustration shown in the lesson's Graphics tab. Optional — most
 * courses have none; DSA lessons carry one (or a few) figures that visualize
 * the idea the notes describe.
 *
 * Deliberately NOT per-language: these figures draw the *structure* (buckets,
 * pointers, call trees), which is what the course teaches and is identical in
 * every language. A figure that would need a language-specific rewrite belongs
 * in the lesson's code samples instead.
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
  blurb: ByLanguage<string>;
  /**
   * Markdown "lesson card": the concept plus idiomatic examples, written for an
   * experienced programmer (explicit contrasts with the languages they know).
   */
  content: ByLanguage<string>;
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

/**
 * A Lesson with every per-language field resolved to a plain string. This is
 * the shape the UI and buildLessonScript work with, so neither has to know that
 * a lesson can vary by language at all — resolution happens once, at the edge.
 */
export interface ResolvedLesson
  extends Omit<Lesson, "blurb" | "content" | "exercises" | "quiz"> {
  blurb: string;
  content: string;
  exercises: ResolvedExercise[];
  quiz: ResolvedQuizQuestion[];
}

/** Questions per lesson quiz. Enforced by the lesson bank tests. */
export const QUIZ_LENGTH = 3;

/** Choices per question. Enforced by the lesson bank tests. */
export const QUIZ_OPTIONS = 4;

export interface Module {
  id: string;
  title: string;
  blurb: ByLanguage<string>;
}

export interface Course {
  /** Kebab-case, globally unique — the /learn/[course] route segment. */
  id: string;
  /**
   * Editor + runner languages, and (for language courses) the tutor-persona key.
   * Ordered: the first is the default the learner lands on, and the rest are
   * offered by the picker. Omitted by *concept* courses (e.g. distributed
   * systems), which teach an idea rather than a language: those are
   * conversational only — no exercises, no editor. A *language* course declares
   * exactly one. Only a *subject* course (see SubjectCourseId) declares more
   * than one, because DSA is the same subject whichever language you write it
   * in; its persona is keyed off the course id rather than the language.
   */
  languages?: LanguageId[];
  /** Display name, e.g. "Python" / "TypeScript". */
  title: string;
  /** One-liner for the picker and the course overview header. */
  tagline: ByLanguage<string>;
  /** Emoji for the home + picker cards. */
  icon: string;
  /** Ordered module metadata — drives the overview and lesson grouping. */
  modules: Module[];
  /** Flat, ordered list of every lesson (module order, then sequence within). */
  lessons: Lesson[];
}

/**
 * A course's default language — the one the picker starts on, and the one the
 * server renders before the client restores a saved preference. `undefined` for
 * a concept course, which has no editor at all.
 */
export function defaultLanguage(course: Course): LanguageId | undefined {
  return course.languages?.[0];
}

/**
 * True when a value carries per-language variants rather than being one shared
 * value. Arrays are bare values, not variant maps — `options` is a `string[]`,
 * so the array check is what keeps a quiz's shared option list from being
 * mistaken for a keyed record.
 */
function isKeyed<T>(value: ByLanguage<T>): value is Partial<Record<LanguageId, T>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Pick the variant for `language`, or return the value unchanged if it's shared.
 *
 * The fallback to the first declared variant only fires on an authoring gap (a
 * keyed field missing the selected language) or a stale client sending a
 * language the course dropped. The lesson tests assert full coverage for every
 * language a course declares, so in a passing build this never falls back —
 * it's here so a gap degrades to the other language's text rather than
 * rendering `undefined` at the learner.
 */
export function forLanguage<T>(value: ByLanguage<T>, language?: LanguageId): T {
  if (!isKeyed(value)) return value;
  const keyed = value as Partial<Record<LanguageId, T>>;
  if (language && keyed[language] !== undefined) return keyed[language] as T;
  return Object.values(keyed)[0] as T;
}

/** Resolve one exercise's per-language fields. */
export function resolveExercise(exercise: Exercise, language?: LanguageId): ResolvedExercise {
  return {
    ...exercise,
    title: forLanguage(exercise.title, language),
    instructions: forLanguage(exercise.instructions, language),
    starterCode: forLanguage(exercise.starterCode, language),
  };
}

/** Resolve one quiz question's per-language fields. */
export function resolveQuizQuestion(
  question: QuizQuestion,
  language?: LanguageId
): ResolvedQuizQuestion {
  return {
    ...question,
    prompt: forLanguage(question.prompt, language),
    options: forLanguage(question.options, language),
    explanation: forLanguage(question.explanation, language),
  };
}

/**
 * Resolve a whole lesson for one language. Called once at the edge (the lesson
 * page and the course overview), so everything downstream — the notes pane, the
 * editor, the quiz, the tutor script — sees plain strings.
 */
export function resolveLesson(lesson: Lesson, language?: LanguageId): ResolvedLesson {
  return {
    ...lesson,
    blurb: forLanguage(lesson.blurb, language),
    content: forLanguage(lesson.content, language),
    exercises: lesson.exercises.map((e) => resolveExercise(e, language)),
    quiz: lesson.quiz.map((q) => resolveQuizQuestion(q, language)),
  };
}
