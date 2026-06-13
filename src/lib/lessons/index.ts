// The Python learning course, assembled from per-module files. Mirrors the
// structure of "@/lib/problems". Public import path: "@/lib/lessons".

import type { Lesson, Module, ModuleId } from "./types";
import { basicsLessons } from "./basics";
import { dataStructuresLessons } from "./data-structures";
import { idiomsLessons } from "./idioms";
import { oopTypingLessons } from "./oop-typing";
import { stdlibLessons } from "./stdlib";
import { errorsTestingLessons } from "./errors-testing";
import { toolingLessons } from "./tooling";
import { librariesLessons } from "./libraries";

export type { Lesson, Exercise, Module, ModuleId } from "./types";
export { buildLessonScript } from "./script";

/** Ordered module metadata — drives the /learn overview and lesson grouping. */
export const MODULES: Module[] = [
  { id: "basics", title: "Python in an Afternoon", blurb: "Syntax, types, functions, and imports — the fast path for someone who already programs." },
  { id: "data-structures", title: "Core Data Structures", blurb: "Lists, tuples, dicts, sets, and the comprehensions that make them sing." },
  { id: "idioms", title: "Pythonic Idioms", blurb: "enumerate/zip, generators, EAFP, and context managers — write Python that reads like Python." },
  { id: "oop-typing", title: "Objects & Typing", blurb: "Classes, dunder methods, duck typing, dataclasses, and type hints." },
  { id: "stdlib", title: "Standard Library Power Tools", blurb: "collections, itertools/functools, and the everyday stdlib batteries." },
  { id: "errors-testing", title: "Errors & Testing", blurb: "Exceptions done right, and testing the pytest way." },
  { id: "tooling", title: "Environment & Tooling", blurb: "Virtual envs, pip, pyproject, and the formatter/linter/type-checker stack." },
  { id: "libraries", title: "Common Libraries", blurb: "requests, numpy, and pandas — the libraries you'll meet on day one." },
];

/** Flat, ordered list of every lesson (module order, then sequence within). */
export const LESSONS: Lesson[] = [
  ...basicsLessons,
  ...dataStructuresLessons,
  ...idiomsLessons,
  ...oopTypingLessons,
  ...stdlibLessons,
  ...errorsTestingLessons,
  ...toolingLessons,
  ...librariesLessons,
];

export function getLesson(id: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === id);
}

export function lessonsForModule(id: ModuleId): Lesson[] {
  return LESSONS.filter((l) => l.module === id);
}
