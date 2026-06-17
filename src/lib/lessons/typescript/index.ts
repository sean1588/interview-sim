// The TypeScript course: per-module lesson files assembled into a Course.
// Audience is experienced programmers who know JavaScript (and/or typed
// languages like Java/C#/Go) and are new to TypeScript. Weighted toward the
// type system — unions/narrowing, generics, and the type-combinator toolkit.

import type { Course, Lesson, Module } from "../types";
import { basicsLessons } from "./basics";
import { functionsObjectsLessons } from "./functions-objects";
import { unionsNarrowingLessons } from "./unions-narrowing";
import { genericsLessons } from "./generics";
import { typeCombinatorsLessons } from "./type-combinators";
import { classesLessons } from "./classes";
import { asyncModulesLessons } from "./async-modules";
import { practicalTypingLessons } from "./practical-typing";

const MODULES: Module[] = [
  { id: "basics", title: "TypeScript on Top of JavaScript", blurb: "What TS adds to the JS you know: structural, erasable types, inference, and the transpile model." },
  { id: "functions-objects", title: "Functions & Objects", blurb: "Typing functions, interface vs type, optional/readonly, index signatures, and structural typing." },
  { id: "unions-narrowing", title: "Unions & Narrowing", blurb: "Union and literal types, control-flow narrowing, discriminated unions, type guards, and exhaustiveness." },
  { id: "generics", title: "Generics", blurb: "Generic functions and types, constraints, keyof/indexed access, and reusable typed utilities." },
  { id: "type-combinators", title: "Type Combinators", blurb: "Utility types, mapped types, conditional types with infer, and template-literal types." },
  { id: "classes", title: "Classes", blurb: "Access modifiers, parameter properties, implements/abstract, and generic classes." },
  { id: "async-modules", title: "Async & Modules", blurb: "Typing promises and async, unknown in catch, ES modules, import type, and tsconfig essentials." },
  { id: "practical-typing", title: "Typing Real Code", blurb: "Taming unknown, as const and derivation, enums vs unions, satisfies, and the common pitfalls." },
];

const LESSONS: Lesson[] = [
  ...basicsLessons,
  ...functionsObjectsLessons,
  ...unionsNarrowingLessons,
  ...genericsLessons,
  ...typeCombinatorsLessons,
  ...classesLessons,
  ...asyncModulesLessons,
  ...practicalTypingLessons,
];

export const typescriptCourse: Course = {
  id: "typescript",
  language: "typescript",
  title: "TypeScript",
  tagline: "A guided course for JavaScript developers picking up TypeScript and its type system.",
  icon: "🔷",
  modules: MODULES,
  lessons: LESSONS,
};
