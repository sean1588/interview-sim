# TypeScript Learning Path — Design Spec

**Date:** 2026-06-17
**Status:** Approved, implementing
**Author:** brainstormed with Sean

## 1. Summary

Add a second guided course to learning mode: a **TypeScript course** for
*experienced programmers* who already know JavaScript (and/or typed languages
like Java, C#, Go) but are new to TypeScript. It reuses the entire learning-mode
machinery built for Python (voice tutor + lesson card + exercise editor + recap),
generalized from a single hardcoded course to a **registry of courses**.

The emphasis, per the request, is **the type system**: union types, narrowing,
generics, and "type combinators" (mapped/conditional/template-literal types and
the built-in utility types) get dedicated, deep modules — this is the substance
an experienced JS dev actually needs to become productive in TS.

Goal: take a competent JS engineer from "TypeScript newbie" to "comfortable with
TS's type system, idioms, and tooling well enough to hold a TS-requiring job."

## 2. Decisions (from brainstorming)

| Question | Decision |
|---|---|
| Course model | **Generalize learning mode to multi-course.** A `Course` is the unit; `@/lib/lessons` becomes a `COURSES` registry. Python and TypeScript are two courses on identical rails. |
| Navigation | **Course picker + per-course routes.** `/learn` lists courses; `/learn/[course]` is a course overview; `/learn/[course]/[lessonId]` is a lesson. Existing Python URLs become `/learn/python/<id>`. |
| Curriculum depth | **Full 8-module course (~24 lessons)**, matching the Python course's depth, weighted toward typing. |
| Run semantics | **Reuse the transpile-and-run engine (PR #9).** Type errors never block Run; **Monaco squiggles validate the types, Run validates runtime behavior.** Every exercise prints something so Run gives feedback. |
| Progress / recap | **Unchanged.** Ephemeral; reuses the non-graded `RecapCard` + assess pipeline, tutor-toned. |

## 3. Architecture — multi-course generalization

The learning rails already exist (voice loop, recap, Prev/Next, lesson script
serializer). The only thing baked to one language is the *course*. We lift that
into a first-class `Course` and key everything off it. **`/api/chat` and
`/api/assess` gain no new fields** — the course's language rides the existing
`language` field that already flows client → chat route; the tutor persona reads
it. Interview modes (coding/behavioral/system-design) are untouched.

### 3.1 Types — `src/lib/lessons/types.ts`

`Exercise` and `Lesson` are unchanged in shape, except **`Lesson.module` becomes
`string`** (each course owns its own module set, so a single closed `ModuleId`
union across courses is wrong — drop it). New `Course`:

```ts
export interface Course {
  id: string;            // "python" | "typescript" — kebab; the /learn/[course] segment
  language: LanguageId;  // editor + runner language + tutor-persona key
  title: string;         // "Python" / "TypeScript"
  tagline: string;       // one-liner for the picker + overview header
  icon: string;          // emoji for the home + picker cards
  modules: Module[];     // ordered module metadata for this course
  lessons: Lesson[];     // flat, ordered by module then sequence
}

export interface Exercise { id: string; title: string; instructions: string; starterCode: string; }
export interface Lesson { id: string; module: string; title: string; blurb: string; content: string; exercises: Exercise[]; }
export interface Module { id: string; title: string; blurb: string; }
```

### 3.2 Course folders + registry

```
src/lib/lessons/
  types.ts            # shared (above)
  script.ts           # buildLessonScript — already language-agnostic, unchanged
  index.ts            # COURSES registry + resolvers (below)
  python/
    index.ts          # pythonCourse: Course (MODULES + LESSONS)
    basics.ts … libraries.ts   # the 8 existing files, moved here verbatim
  typescript/
    index.ts          # typescriptCourse: Course
    basics.ts … practical-typing.ts   # 8 new files
```

`index.ts` public API (replaces the old single-course exports):

```ts
export const COURSES: Course[]                          // [pythonCourse, typescriptCourse]
export function getCourse(id: string): Course | undefined
export function getLesson(courseId: string, lessonId: string): Lesson | undefined
export function lessonsForModule(course: Course, moduleId: string): Lesson[]
export { buildLessonScript } from "./script"
export type { Course, Lesson, Exercise, Module } from "./types"
```

All lesson + exercise ids stay **globally unique across both courses** (simplest;
avoids collisions in any shared map and in the run-every-scaffold gate).

### 3.3 Prompts — parameterize the tutor by language

The three learning branches in `prompts.ts` stop hardcoding "Python". A tiny
centralized **tutor-profile table** maps the course language to its persona copy:

```ts
const TUTOR_PROFILE: Record<"python" | "typescript", { lang: string; known: string }> = {
  python:     { lang: "Python",     known: "TypeScript, JavaScript, Java, and/or Go" },
  typescript: { lang: "TypeScript", known: "JavaScript, and typed languages like Java, C#, or Go" },
};
```

- `getSystemPrompt(mode, opts)` — add `opts.language`. Learning branch builds the
  persona from `TUTOR_PROFILE[language]` ("You are a friendly, sharp {lang}
  tutor… your student knows {known} and is new to {lang}…"). Default to Python if
  absent (back-compat).
- `getKickoffPrompt(mode, language?)` — same parameterization for the greeting.
- `getAssessSystemPrompt(mode, targetLevel?, language?)` — "a warm {lang} tutor
  writing a recap…". Recap JSON shape unchanged.

Threading: the **chat route** already reads `language` from form data — pass it
into `getSystemPrompt` and `getKickoffPrompt`. The **assess route** already reads
`language` from the JSON body — pass it into `getAssessSystemPrompt`. No new
request fields. Non-learning modes ignore `opts.language` (coding's editor
language is irrelevant to its persona), so this is inert for them.

### 3.4 Pages & components

- **`/learn`** (`page.tsx`) — rewritten as a **course picker**: a card per
  `COURSES` entry (icon, title, tagline, lesson/module counts) linking to
  `/learn/[course]`.
- **`/learn/[course]`** (`[course]/page.tsx`) — the old overview, parameterized:
  `getCourse(course)`, `notFound()` if missing, else the module/lesson grid for
  that course. Header uses `course.title`/`course.tagline`.
- **`/learn/[course]/[lessonId]`** (`[course]/[lessonId]/page.tsx`) — `await
  params`, `getCourse` + `getLesson`, `notFound()` if either missing, render
  `<LessonWorkspace course={course} lesson={lesson} />`. (The old
  `/learn/[lessonId]/page.tsx` is deleted.)
- **`LessonWorkspace`** — takes `{ course, lesson }`. `CodeEditor` uses
  `course.language` (label + the single-entry `languages` list); the editor/back
  link/recap are otherwise unchanged. `getContext` always sends `language:
  course.language` (harmless when there's no code — `formatEditorContext` no-ops
  without code) so the tutor persona is right even on conversational lessons and
  the kickoff turn. `handleEnd` sends `language: course.language` for the recap.
- **Home** — the "Learn" section gets two cards: "Learn Python" (🐍 →
  `/learn/python`) and "Learn TypeScript" (🔷 → `/learn/typescript`).

## 4. Curriculum — 8 modules, ~24 lessons (typing-forward)

Each lesson: a `content` card teaching the concept *for an experienced JS
programmer* (lead with TS specifics, contrast with JS/Java/C#/Go), plus exercises.
Every `starterCode` is a runnable scaffold (signature/types + a `console.log` so
Run produces output) that is **NEVER a solution**, and MUST transpile + execute
clean through the engine.

**Module 1 — basics ("TypeScript on top of JavaScript")** (3 lessons)
1. `what-is-typescript` — superset of JS; types are **structural and erasable**
   (compile-time only, gone at runtime, no runtime type checks); the transpile
   model and `tsc`/`strict`; **how this app runs TS** (transpile-and-run: type
   errors show as red squiggles but don't block Run — so use the squiggles).
   *Conversational framing lesson; 1–2 light exercises printing values.*
2. `primitives-and-inference` — `string`/`number`/`boolean`, arrays `T[]` vs
   `Array<T>`, tuples, `null`/`undefined`, literal types, inference & `const`
   literal-narrowing, `any` vs `unknown` vs `never` vs `void`.
3. `type-vs-value` — type-space vs value-space, the `typeof` type operator, type
   aliases, `as` assertions (and why they're a hole), non-null `!`.

**Module 2 — functions-and-objects** (3 lessons)
1. `typing-functions` — param/return annotations, optional `?` + default params,
   rest params, `void`, function-type expressions & call signatures, a note on
   overloads.
2. `object-types` — object type literals, **`interface` vs `type`** (when each),
   optional & `readonly` props, index signatures, nested shapes.
3. `structural-typing` — structural ("duck") assignability, excess-property
   checks on object literals, `interface extends` + intersection for composition.
   Contrast with nominal typing in Java/C#.

**Module 3 — unions-and-narrowing** ⭐ (4 lessons)
1. `union-types` — `A | B`, literal unions (`"red" | "green"`), unions of object
   types, the basic "could be several types" model.
2. `narrowing` — control-flow narrowing: `typeof`, `instanceof`, `in`,
   truthiness, equality; how TS narrows inside an `if`/`switch`.
3. `discriminated-unions` — tagged unions (shared literal `kind` field), `switch`
   on the tag; the canonical `Shape = Circle | Square` modeling pattern.
4. `type-guards-exhaustiveness` — user-defined type guards (`x is T`), assertion
   functions (brief), exhaustiveness with `never` (`assertNever` default case).

**Module 4 — generics** ⭐ (3 lessons)
1. `generic-functions` — type parameters, inference, multiple params, constraints
   (`extends`), default type params.
2. `generic-types` — generic interfaces/aliases/classes, `keyof`, indexed access
   `T[K]`, the typed `get(obj, key)` pattern.
3. `generics-in-practice` — reusable typed utilities (a `Result<T, E>`, a generic
   container); why generics beat `any`. Contrast with Java/C# generics (TS's are
   structural and erased).

**Module 5 — type-combinators ("type-level programming")** ⭐ (4 lessons)
1. `utility-types` — the everyday built-ins: `Partial`, `Required`, `Readonly`,
   `Pick`, `Omit`, `Record`, `NonNullable`, `ReturnType`, `Parameters`, `Awaited`.
2. `mapped-types` — `{ [K in keyof T]: … }`, key remapping with `as`, modifiers
   (`+/-` `readonly`/`?`); rebuild `Partial`/`Readonly` by hand.
3. `conditional-types` — `T extends U ? X : Y`, distribution over unions, `infer`
   to extract types (unwrap a `Promise`/array element).
4. `template-literal-types` — string literal composition, intrinsic
   `Uppercase`/`Capitalize`, remapping keys to `on${Capitalize<K>}` handlers.

**Module 6 — classes** (2 lessons)
1. `classes-and-modifiers` — access modifiers (`public`/`private`/`protected`/
   `readonly`), parameter properties, getters/setters, `static`; `private`
   (compile-time) vs `#private` (runtime). Contrast Java/C#.
2. `interfaces-abstract-generics` — `implements`, `abstract` classes, generic
   classes, `this`-typed fluent methods (brief).

**Module 7 — async-and-modules** (2 lessons)
1. `typing-async` — `Promise<T>`, `async`/`await` return typing, typing `unknown`
   in `catch`, `Promise.all` tuple typing. **NOTE:** the single-file worker
   captures synchronous output only, so exercises center on the *types* with
   synchronous illustration; the lesson states this.
2. `modules-and-tooling` — ES modules `import`/`export`, **`import type`** /
   type-only imports, `.d.ts` (brief), `tsconfig` essentials (`strict`/`target`/
   `module`/`lib`), the `@types` ecosystem, eslint + tsc. **Conversational, no
   exercises** (imports don't resolve in the single-file worker).

**Module 8 — practical-typing ("typing real code")** (3 lessons)
1. `unknown-and-validation` — handling `unknown` (JSON / API bodies provided as
   strings), narrowing `unknown` safely, why `any` is a hole, guards vs `as`,
   "parse, don't validate" (conceptual; stdlib only, no deps).
2. `as-const-and-derivation` — `as const`, deriving types from values
   (`typeof`/`keyof`), **enums vs unions-of-literals** (and why unions often win),
   the **`satisfies`** operator.
3. `pitfalls-and-patterns` — the traps: `any` leakage, unsafe `as`, non-null `!`,
   structural surprises; a couple of idioms (branded types brief, readonly-by-
   default). A light capstone.

## 5. Implementation plan

**Foundation (inline, sequential — load-bearing, tightly coupled):**
1. `types.ts` (`Course`; `module: string`); move the 8 Python files into
   `python/`; add `python/index.ts` (`pythonCourse`).
2. `index.ts` → `COURSES` registry + resolvers.
3. `typescript/index.ts` + **8 placeholder module files**
   (`export const <m>Lessons: Lesson[] = []`) so the framework compiles empty.
4. `prompts.ts` (tutor-profile table + `language` params on the three learning
   functions); `chat`/`assess` routes pass `language` through.
5. Pages: rewrite `/learn` (picker), add `/learn/[course]` + `/learn/[course]/
   [lessonId]`, delete `/learn/[lessonId]`; `LessonWorkspace` takes `{course,
   lesson}`; home gets the TS card.
6. Verify the **foundation compiles** (tsc) with the empty TS bank.

**Content (Workflow — 8 independent module files):**
- `scripts/author-ts-lessons.workflow.js`: `pipeline(CURRICULUM, author, review)`
  with pre-assigned ids/titles/blurbs/focus/tasks. Author writes each module's
  JSON and **verifies every starter transpiles (`tsc`/`transpileModule`) and runs
  clean under node**; adversarial review checks accuracy, the experienced-JS-dev
  framing, scaffold-not-solution, instruction↔starter match, and the typing-
  course rule (types validated by editor, starter still prints), fixing in place
  and re-verifying.
- `scripts/gen-ts-lessons.mjs`: deterministically emit
  `src/lib/lessons/typescript/<module>.ts` from the verified JSON (same escaping
  approach as `gen-lessons.mjs`).

**Integration & verification (inline):**
- Rewrite `lessons.test.ts` for the multi-course world: per course — every module
  has ≥1 lesson; lesson `module` refs a real module; non-empty title/blurb/
  content; exercises well-formed. Cross-course — globally unique kebab lesson +
  exercise ids; each course has a healthy lesson count.
- **TS run-every-scaffold gate as a vitest test** (simpler than Python's external
  venv gate): for every TypeScript starter, `wrapTranspiledTs(transpileTypeScript(
  ts, code))` then `new Function("console", js)(mockConsole)` and assert it does
  not throw — worker-faithful (vitest has no ambient `exports` leak; the wrap
  shim supplies the CommonJS names). Python keeps its external `python3` gate.
- `tsc --noEmit`, `eslint`, `vitest run`, `next build`.
- Post-implementation **adversarial-review Workflow** over the whole diff.

## 6. Out of scope (v1)

Progress persistence, per-learner adaptivity, a real type-checking gate in the
runner (transpile-and-run stays), zod/runtime-validation libraries in exercises,
TS-starter backfill of the interview question bank (separate deferred pass), and
any change to interview-mode behavior. A coverage backlog for the TS course can
follow once the format is proven.

## 7. As-built deltas & deferred debt

The build matched the plan, with two notable additions from the review pass:

- **A squiggle gate was discovered to be load-bearing.** A *typing* course lives
  or dies by the editor's red squiggles, and the runtime checker is transpile-only
  (it can't see type errors). A type-check gate — each starter type-checked as an
  isolated **script** under Monaco's defaults (non-strict, `lib.esnext.full`) —
  caught three browser-global collisions (`status`/`name`/`Cache`) that the
  content review missed. It now lives in `lessons.test.ts` so it runs in **CI**,
  and asserts `spot-the-squiggle` keeps its *intentional* teaching error.
- **CI gate split (as-built):** CI runs two starter checks — transpile-**construct**
  (syntactic validity of the emitted JS) and the **squiggle** type-check. Both are
  hang-safe (no execution). Full transpile-**execute** stays authoring-time
  (`scripts/run-ts-lesson-gate.mjs`) because a stray infinite loop can't be
  interrupted on vitest's main thread.

**Deferred debt (named, from the review — low value for one-shot tools):**
- `scripts/ts-lesson-check.mjs` hand-copies `transpileTypeScript`/`wrapTranspiledTs`
  from `runner.ts` (a `.mjs` can't import the `.ts`); kept in sync by comment. The
  authoritative transpile *is* CI-tested via `lessons.test.ts`.
- The authoring-time runtime gate has no per-starter wall-clock timeout (a
  `while(true)` starter would hang it). Acceptable: authoring-time, interruptible.
- `gen-ts-lessons.mjs` writes files before validating counts, and normalizes CRLF
  to LF rather than round-tripping it byte-for-byte. One-shot generator; harmless.
