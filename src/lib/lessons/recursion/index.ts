// The Recursion course: per-module lesson files assembled into a Course. Like
// DSA it is a *subject* course — it teaches recursion *through* a language
// rather than teaching the language — so it declares `languages` (editor +
// exercises) while its tutor persona is keyed off the course id (see
// SubjectCourseId in ../types). The learner picks TypeScript or Python and every
// lesson resolves its code, and the prose around it, to match.
//
// Audience is experienced developers who can read a recursive function but don't
// reach for one: the through-line is the call stack — what a frame holds, which
// half of the function runs on the way down versus the way back up, and what
// makes the recursion terminate. Where the ground overlaps the DSA course
// (DFS, memoization, trees, graphs, sorting) this course teaches the *technique*
// and links across rather than restating the algorithm.

import type { Course, Lesson, Module } from "../types";
import { foundationsLessons } from "./foundations";
import { patternsLessons } from "./patterns";
import { structuresLessons } from "./structures";
import { advancedLessons } from "./advanced";

const MODULES: Module[] = [
  {
    id: "foundations",
    title: "Foundations",
    blurb:
      "What a stack frame holds, the base case that ends it, and when a loop is the better answer.",
  },
  {
    id: "patterns",
    title: "Patterns",
    blurb: {
      typescript:
        "Accumulators and helper parameters, tail position (which V8 ignores), and the depth budget before RangeError.",
      python:
        "Accumulators and helper parameters, tail position (which CPython ignores), and the 1000-frame recursion limit.",
    },
  },
  {
    id: "structures",
    title: "Walking Data Structures",
    blurb:
      "Lists, binary trees, n-ary and file-system trees, graphs with a visited set, and nested JSON.",
  },
  {
    id: "advanced",
    title: "Advanced Recursion",
    blurb:
      "Divide and conquer, backtracking, memoized recursion, and trading the call stack for one you own.",
  },
];

const LESSONS: Lesson[] = [
  ...foundationsLessons,
  ...patternsLessons,
  ...structuresLessons,
  ...advancedLessons,
];

export const recursionCourse: Course = {
  id: "recursion",
  languages: ["typescript", "python"],
  title: "Recursion",
  tagline: {
    typescript:
      "From the call stack to backtracking — recursion taught as a technique, hands-on in TypeScript.",
    python:
      "From the call stack to backtracking — recursion taught as a technique, hands-on in Python.",
  },
  icon: "🌀",
  modules: MODULES,
  lessons: LESSONS,
};
