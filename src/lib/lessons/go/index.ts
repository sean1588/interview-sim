// The Go course: per-module lesson files assembled into a Course. Audience is
// experienced programmers (TS/JS/Java/C#/Python) new to Go. Weighted toward what
// makes Go distinctive — the zero-value model, implicit interfaces, slices, and
// especially concurrency (goroutines/channels/select/context) and generics.
//
// Go has no lightweight in-browser runtime, so this course's editor is a
// scratchpad the voice tutor reviews rather than a Run target (see
// CodeEditor / runner.isRunnable). Lessons therefore describe expected output
// for the learner to reason about; they don't execute in the browser.

import type { Course, Lesson, Module } from "../types";
import { basicsLessons } from "./basics";
import { typesLessons } from "./types";
import { collectionsLessons } from "./collections";
import { errorsLessons } from "./errors";
import { concurrencyLessons } from "./concurrency";
import { genericsLessons } from "./generics";
import { stdlibLessons } from "./stdlib";
import { toolingLessons } from "./tooling";

const MODULES: Module[] = [
  { id: "basics", title: "Go in an Afternoon", blurb: "Packages, := and zero values, the one loop, switch, and multi-return functions — the fast path for someone who already programs." },
  { id: "types", title: "Structs, Methods & Interfaces", blurb: "Structs and pointer receivers, implicitly-satisfied interfaces, and composition through embedding." },
  { id: "collections", title: "Slices, Maps & Strings", blurb: "Slice internals and the shared-backing-array trap, maps and the comma-ok idiom, and bytes vs runes." },
  { id: "errors", title: "Errors, Not Exceptions", blurb: "Errors as values, wrapping with %w and errors.Is/As, and the narrow role of panic/recover." },
  { id: "concurrency", title: "Goroutines & Channels", blurb: "The go keyword, WaitGroups, channels, select, and cancellation with context." },
  { id: "generics", title: "Generics", blurb: "Type parameters, constraints and comparable, custom type sets, and when generics earn their keep." },
  { id: "stdlib", title: "Standard Library Tour", blurb: "The generic slices/maps helpers, sorting and time, and encoding/json with struct tags." },
  { id: "tooling", title: "Tooling & Testing", blurb: "Table-driven tests with the testing package, and the go mod / go vet / gofmt workflow." },
];

const LESSONS: Lesson[] = [
  ...basicsLessons,
  ...typesLessons,
  ...collectionsLessons,
  ...errorsLessons,
  ...concurrencyLessons,
  ...genericsLessons,
  ...stdlibLessons,
  ...toolingLessons,
];

export const goCourse: Course = {
  id: "go",
  language: "go",
  title: "Go",
  tagline: "A guided course for experienced programmers picking up Go — from the zero-value model to goroutines and generics.",
  icon: "🐹",
  modules: MODULES,
  lessons: LESSONS,
};
