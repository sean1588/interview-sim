import type { Course, Lesson, Module } from "../types";
import { mentalModelLessons } from "./mental-model";
import { stateEventsLessons } from "./state-events";
import { lifecycleEffectsLessons } from "./lifecycle-effects";
import { compositionContextLessons } from "./composition-context";
import { hooksEscapeHatchesLessons } from "./hooks-escape-hatches";
import { asyncConcurrencyLessons } from "./async-concurrency";
import { performanceLessons } from "./performance";
import { productionPatternsLessons } from "./production-patterns";

const MODULES: Module[] = [
  {
    id: "mental-model",
    title: "React's Mental Model",
    blurb:
      "Elements, component purity, render and commit, state snapshots, reconciliation, keys, and identity.",
  },
  {
    id: "state-events",
    title: "State & Events",
    blurb:
      "Event-driven updates, batching, updater functions, durable state shapes, immutable changes, and reducers.",
  },
  {
    id: "lifecycle-effects",
    title: "Lifecycle & Effects",
    blurb:
      "Synchronization lifecycles, dependencies, stale closures, cleanup, Strict Mode, races, and layout timing.",
  },
  {
    id: "composition-context",
    title: "Composition & Context",
    blurb:
      "State ownership, lifting state, context boundaries, reducer providers, and resilient component APIs.",
  },
  {
    id: "hooks-escape-hatches",
    title: "Hooks & Escape Hatches",
    blurb:
      "Hook call order, reusable custom Hooks, refs, imperative handles, and integrating non-React systems.",
  },
  {
    id: "async-concurrency",
    title: "Async & Concurrent React",
    blurb:
      "Suspense, transitions, deferred values, Actions, optimistic updates, and keeping urgent work responsive.",
  },
  {
    id: "performance",
    title: "Performance",
    blurb:
      "Measure before optimizing, understand memoization and identity, and reduce work at the architectural level.",
  },
  {
    id: "production-patterns",
    title: "Production Patterns",
    blurb:
      "Data ownership, external stores, error recovery, behavior-focused testing, and server/client boundaries.",
  },
];

const LESSONS: Lesson[] = [
  ...mentalModelLessons,
  ...stateEventsLessons,
  ...lifecycleEffectsLessons,
  ...compositionContextLessons,
  ...hooksEscapeHatchesLessons,
  ...asyncConcurrencyLessons,
  ...performanceLessons,
  ...productionPatternsLessons,
];

export const reactCourse: Course = {
  id: "react",
  languages: ["javascript", "typescript"],
  title: "React",
  tagline: {
    javascript:
      "Modern React from the render lifecycle to production patterns, with every example in JavaScript.",
    typescript:
      "Modern React from the render lifecycle to production patterns, with every example in TypeScript.",
  },
  icon: "⚛️",
  modules: MODULES,
  lessons: LESSONS,
};
