# Python Learning Mode — Design Spec

**Date:** 2026-06-12
**Status:** Approved, implementing
**Author:** brainstormed with Sean

## 1. Summary

Add a fourth experience to interview-sim: a **guided Python course** for
*experienced programmers* who are new to Python (they already know
TypeScript/JavaScript/Java/Go). It reuses the existing voice-loop + code-window
setup. Each lesson pairs authored on-screen material with a voice tutor who
teaches conversationally, watches the learner's code and run output live, and
walks them through hands-on exercises — the same real-time interaction model as
the interview modes, retargeted from "evaluate" to "teach".

Goal of the course: take a competent engineer from "Python newbie" to
"comfortable enough with Python's syntax, idioms, tooling, and core libraries to
hold a Python-requiring job."

## 2. Decisions (from brainstorming)

| Question | Decision |
|---|---|
| Lesson flow | **Tutor-led, scripted arc.** Authored lesson card (concept + idiomatic examples) + ordered exercises. The tutor introduces the concept, points at the on-screen example, poses each exercise, watches/nudges, and advances. |
| Scope (v1) | **Full curriculum** — 8 modules, 25 lessons, authored in one pass with parallel subagents (like the question-bank expansions). |
| Progress | **Fully ephemeral**, like interviews. No localStorage, no accounts, no server persistence. |
| Wrap-up | **Light recap card** (non-graded). Reuses the `/api/assess` pipeline + a modal, but with a tutor tone — no Hire/No-Hire, no 1–5 scores. |
| Architecture | **Option A — fourth mode on the existing rails.** |

## 3. Architecture (Option A)

Ride the rails that already exist. The mode union is the dispatch table; learning
is one more row. Key principle: **`/api/chat` does not change at all** — the
lesson script arrives via the existing `questionPrompt` field, and the learner's
editor state rides the existing `formatEditorContext` plumbing.

### 3.1 Mode types — additive, not a rename

`InterviewMode` stays exactly as-is — it honestly means "the three graded
interview modes" and exhaustively keys `SCORE_LABELS`. We add a superset only at
the shared voice-loop boundary:

```ts
// src/lib/types/mode.ts
export type InterviewMode = "coding" | "behavioral" | "system-design";
export type SessionMode = InterviewMode | "learning";
```

- `SCORE_LABELS: Record<InterviewMode, …>` — untouched (learning has no scores).
- `Scorecard`, `NotesInterview`, the three assess/scorecard prompt branches — keep `InterviewMode`.
- `VoiceChat.mode`, the chat route, the assess route, and the system/kickoff/assess **dispatch** widen to `SessionMode`.

### 3.2 Honest renames (shared-by-a-non-interview)

Two things become genuinely shared by a *non*-interview, so their interview-y
names become inaccurate. These are surgical, tsc-checked renames:

- `InterviewContext` → **`SessionContext`** (VoiceChat defines it; InterviewSim + NotesInterview import it). Shape unchanged.
- `useInterviewSession` → **`useSession`** (generic over result type), with
  `endInterview` → `endSession`, `scorecard` → `result`, `closeScorecard` →
  `closeResult`, `assessError` → `error`. Consumers: InterviewSim, NotesInterview
  (2 files). The hook becomes `useSession<T>(mode: SessionMode)` returning
  `result: T | null` so interview workspaces get `ScorecardData` and the lesson
  workspace gets `RecapData` with no casts.
- `/api/assess` returns `{ result }` instead of `{ scorecard }` (read in one
  place: the hook).
- `prompts.ts`: `getInterviewerSystemPrompt` → **`getSystemPrompt`** (it now
  dispatches the tutor too). `getKickoffPrompt` / `getAssessSystemPrompt` /
  `buildAssessUserContent` keep their names but accept `SessionMode` and gain a
  `"learning"` branch. Add `isValidSessionMode`; keep `isValidMode` for the
  interview subset.

### 3.3 Lesson bank — `src/lib/lessons/`

Mirrors `src/lib/problems/`: one file per module exporting a `Lesson[]`,
assembled in `index.ts`. Public import path: `@/lib/lessons`.

```ts
// src/lib/lessons/types.ts
export type ModuleId =
  | "basics" | "data-structures" | "idioms" | "oop-typing"
  | "stdlib" | "errors-testing" | "tooling" | "libraries";

export interface Exercise {
  id: string;            // globally unique, kebab-case
  title: string;
  instructions: string;  // markdown, shown above the editor
  starterCode: string;   // Python scaffold (signature + example call); NEVER a solution
}

export interface Lesson {
  id: string;            // globally unique, kebab-case
  module: ModuleId;
  title: string;
  blurb: string;         // one-liner for the /learn overview
  content: string;       // markdown "lesson card": concept + idiomatic examples,
                         // explicitly contrasted with TS/Java/Go where it helps
  exercises: Exercise[]; // may be EMPTY for conversational lessons (tooling module)
}

export interface Module { id: ModuleId; title: string; blurb: string; }
```

```ts
// src/lib/lessons/index.ts
export const MODULES: Module[]   // ordered metadata
export const LESSONS: Lesson[]   // flat, ordered by module then sequence
export function getLesson(id: string): Lesson | undefined
export function lessonsForModule(id: ModuleId): Lesson[]
```

### 3.4 Lesson script serializer — `src/lib/lessons/script.ts`

`buildLessonScript(lesson, exerciseIndex): string` renders the full lesson into
the `questionPrompt` the client sends each turn, so the tutor always has the
whole arc and knows where the learner is. Shape:

```
LESSON: <title>
<content>

EXERCISES (the learner advances through these with on-screen Prev/Next buttons —
you do NOT control which is shown; never claim to switch exercises yourself):
Exercise 1 — <title>: <instructions>
Exercise 2 — <title>: <instructions>
...
The learner is currently on Exercise <N> of <M>: <title>.
```

For exercise-free lessons, the EXERCISES block is omitted.

### 3.5 The tutor prompt (learning branch of `getSystemPrompt`)

Persona: a friendly, sharp Python tutor running a live voice lesson. The student
is an **experienced programmer new to Python** — teach to that level (skip "what
is a variable"; focus on Python syntax, idioms, and contrasts with languages they
know). Sees the lesson notes + the learner's editor (via the existing bracketed
context). Behaves like the interviewer prompts: 1–3 sentences, NO markdown/code
blocks (it's spoken), references the on-screen example ("look at the comprehension
on the right"), poses the current exercise, watches code/run output, gives hints
not answers, and — when an exercise looks right — celebrates and tells them to hit
Next (the *learner* controls advancement; the tutor never drives UI state). The
full lesson script is appended as the prompt block.

Kickoff (`getKickoffPrompt("learning")`): greet warmly as their Python tutor, say
what the lesson covers, point them at the notes on the right, introduce the first
exercise, assume an experienced programmer.

### 3.6 Recap (End Lesson)

`getAssessSystemPrompt("learning")` returns a **non-graded** recap prompt; the
model emits:

```json
{
  "summary": "<2-3 sentence encouraging recap>",
  "conceptsCovered": ["<concept>", ...],
  "wentWell": ["<specific, cites their code/questions>", ...],
  "toReview": ["<concept/idiom worth revisiting>", ...],
  "suggestedNext": "<one sentence: what to practice or do next>"
}
```

`buildAssessUserContent("learning", …)` feeds the lesson title, transcript, and
the learner's final code. Rendered by a new **`RecapCard`** component (modal like
`Scorecard`, tutor-toned: summary, "Concepts covered" chips, "What went well"
green, "To review" amber, "Suggested next" footer — no dots, no recommendation
badge). `Scorecard` stays untouched; a recap and a graded scorecard are different
concepts that merely share a modal shell.

### 3.7 Runner change — runnable library lessons

One line in `runPython` (`src/lib/runner.ts`):
`await py.loadPackagesFromImports(code)` before `runPythonAsync`. Pyodide then
auto-fetches imported packages (numpy, pandas) from its CDN on demand. Failures
surface through the existing catch. No other runner change; JS path untouched.

### 3.8 Pages & components

- **`/learn`** (`src/app/learn/page.tsx`) — server component, course overview:
  modules in order, lessons listed under each with blurbs, each linking to
  `/learn/<lessonId>`. Styled like the home page. No progress state.
- **`/learn/[lessonId]`** (`src/app/learn/[lessonId]/page.tsx`) — async server
  component; `await params` (Next-16: params is a Promise), `getLesson(id)`,
  `notFound()` if missing, else render `<LessonWorkspace lesson={lesson} />`.
- **`LessonWorkspace`** (`src/components/LessonWorkspace.tsx`) — client, modeled
  on `InterviewSim`. State: `exerciseIndex`, code buffers keyed
  `lessonId:exerciseIndex`, language pinned to `"python"`. Header: ← back to
  `/learn`, lesson title, "End Lesson". Left: `VoiceChat mode="learning"` with a
  `getContext` returning `buildLessonScript(lesson, exerciseIndex)` as
  `questionPrompt` (+ code/language/lastRun). Right: scrollable lesson card
  (`ReactMarkdown` of `lesson.content`) on top; below, if the lesson has
  exercises, an exercise bar (title, "Exercise N of M", **Prev/Next**),
  instructions (`ReactMarkdown`), and the existing `CodeEditor` with
  `languages={["python"]}`. Exercise-free lessons show the card full-height, no
  editor. Reuses `useSession<RecapData>("learning")`; renders `RecapCard`.
- **Home page** — keep the 3-card interview grid; add a separate "Learn" section
  below with a "Learn Python" card linking to `/learn` (interviews vs learning
  are different intents, so a distinct section reads honestly).

## 4. Curriculum — 8 modules, 25 lessons

Authored as deliberate easy→hard ladders. Each lesson: a `content` card teaching
the concept *for an experienced programmer* (lead with the Python specifics and
explicit contrasts to TS/Java/Go), plus the listed exercises. Every exercise
`starterCode` is a runnable scaffold (signature + an example call that prints),
**never a solution**, and MUST run clean under `python3`.

**Module 1 — basics ("Python in an afternoon")** (4 lessons)
1. `hello-and-values` — print, f-strings, dynamic typing, core scalar types, `None`, truthiness intro. Ex: f-string greeting; numeric types (`/` vs `//`, `%`); type conversion.
2. `control-flow` — indentation (no braces), `if/elif/else`, `and/or/not`, collection truthiness, `for…in`/`range`, `while`, `break/continue`, ternary. Ex: fizzbuzz; conditional accumulation; truthiness predicate.
3. `functions` — `def`, default args, keyword args, `*args`/`**kwargs`, multiple return (tuple), the mutable-default gotcha, docstrings. Ex: defaults + kwargs; `*args` sum; reproduce & fix the mutable-default bug.
4. `modules-and-main` — import styles, `if __name__ == "__main__"`, `is` vs `==`, `None` checks, LEGB scope brief. Ex: use a stdlib import (`math`); `is`/`==` with `None`; `__name__` guard.

**Module 2 — data-structures** (4 lessons)
1. `lists-and-tuples` — list literals, negative indexing, slicing `[a:b:c]`, mutating methods, `sorted` w/ `key`, tuples + immutability + unpacking. Ex: slicing tasks; sort with key; tuple unpack + swap.
2. `dicts` — literals, `get`/default, `setdefault`, `.items()/.keys()/.values()`, `in`, merge (`|`/`update`). Ex: word count; iterate items; merge dicts.
3. `sets` — literals, dedup, O(1) membership, union/intersection/difference, `frozenset` brief. Ex: dedup; common elements; set algebra.
4. `comprehensions` — list/dict/set comprehensions, filters, nesting, generator-expression intro. Ex: filtered list comp; dict comp; nested/flatten comp.

**Module 3 — idioms** (4 lessons)
1. `enumerate-zip-unpacking` — `enumerate`, `zip`, starred unpacking, multiple assignment, `_` throwaway. Ex: enumerate; zip→dict; starred unpack.
2. `generators` — `yield`, laziness, `next`, generator expressions, when/why. Ex: write a generator; bounded take from an infinite generator; genexpr sum over a large range.
3. `eafp` — EAFP vs LBYL, try/except as control flow, `.get` vs try. Ex: rewrite LBYL as EAFP; safe access; catch a specific exception.
4. `context-managers` — `with`, deterministic cleanup, `contextlib.contextmanager`, `__enter__/__exit__` mention. Ex: `with` over `io.StringIO`; write an `@contextmanager`; nested context managers.

**Module 4 — oop-typing** (3 lessons)
1. `classes` — `class`, `__init__`, `self`, instance vs class attrs, `@property`, `_`/`__` convention (no real private). Ex: class w/ init+method; `@property`; class-attr counter.
2. `dunders-duck-typing` — `__repr__/__str__`, `__eq__`, `__len__`, `__iter__`, operator overloading, duck typing. Ex: `__repr__`+`__eq__`; `__len__`/`__getitem__`; make a class iterable.
3. `dataclasses-typing` — type hints, `typing` (`list`/`dict`/`Optional`/`|`), `@dataclass`, `Protocol` (structural typing, familiar to TS devs), mypy mention. Ex: annotate a function; a `@dataclass`; a `Protocol` + consumer.

**Module 5 — stdlib** (3 lessons)
1. `collections` — `Counter`, `defaultdict`, `deque`, `namedtuple`. Ex: `Counter.most_common`; `defaultdict(list)` grouping; `deque` as queue.
2. `itertools-functools` — `chain`/`combinations`/`groupby`/`count`/`islice`; `reduce`/`lru_cache`/`partial`. Ex: combinations; `lru_cache` fib; `groupby`.
3. `pathlib-json-re-datetime` — `PurePath` ops (no real fs), `json.dumps/loads`, `re` (`search/findall/sub`), `datetime` basics. Ex: json round-trip; regex `findall`; `PurePath` manipulation.

**Module 6 — errors-testing** (2 lessons)
1. `exceptions` — hierarchy, `try/except/else/finally`, raising, custom exceptions, `raise … from`. Ex: custom exception; full try/except/else/finally flow; exception chaining.
2. `pytest` — pytest conventions (`test_` fns, plain `assert`, fixtures/parametrize mention), AAA. Exercises run with plain asserts in-browser. Ex: passing asserts; test a function incl. edge cases; parametrize-style assert loop.

**Module 7 — tooling** (2 lessons, **no exercises** — conversational)
1. `venvs-and-packages` — `python -m venv`, activate, `pip` install/freeze, `requirements.txt`, `pyproject.toml`, uv/poetry; contrasted with npm/package.json, go mod, maven.
2. `project-layout-tooling` — src layout, `__init__.py`/packages, ruff/black/mypy, pre-commit; contrasted with eslint/prettier/gofmt.

**Module 8 — libraries** (3 lessons)
1. `requests-http` — `requests` API (get/post/json/headers/status), taught. Pyodide has no network, so exercises use provided JSON strings / mock data (parse a response body, build a params dict, branch on a mock status). Lesson card states this limitation.
2. `numpy` — ndarray, vectorization, broadcasting, slicing, vs Python lists. **Runnable** via `loadPackagesFromImports`. Ex: array + vectorized op; 2D slicing/aggregation; boolean masking.
3. `pandas` — Series/DataFrame from a dict, `loc`/`iloc`, filtering, `groupby`/`agg`. **Runnable**. Ex: build DataFrame + select; filter rows; groupby+agg.

## 5. Implementation plan

**Foundation (inline, sequential — load-bearing, tightly coupled):**
1. `types/mode.ts` (+`SessionMode`); `lessons/types.ts`, `lessons/index.ts`
   (MODULES + assembler), `lessons/script.ts`; **8 placeholder module files**
   (`export const <m>Lessons: Lesson[] = []`) so the framework compiles before
   content lands.
2. `runner.ts` (`loadPackagesFromImports`).
3. `prompts.ts` (rename + learning branches), `chat`/`assess` routes (SessionMode,
   `{ result }`).
4. `useSession` (rename/generic), `RecapCard`, rename `InterviewContext`→`SessionContext`.
5. Update interview consumers (InterviewSim, NotesInterview) for the renames.
6. `/learn` page, `/learn/[lessonId]` page, `LessonWorkspace`, home "Learn" section.
7. Verify the **foundation compiles** (tsc) with empty banks.

**Content (Workflow — genuinely parallel, 8 independent module files):**
- `pipeline(MODULES, author, review)`: an author agent writes each
  `src/lib/lessons/<module>.ts` (overwriting the placeholder) from the curriculum
  slice above, following the type shape + "experienced programmer" framing +
  "scaffold not solution" rule, and **verifies each `starterCode` runs clean
  under `python3`** before finishing. A review agent then checks technical
  accuracy, framing, scaffold-correctness (not a solution), and instruction↔starter
  match, fixes issues in-file, and re-verifies. Pipeline so each module's review
  starts as soon as its authoring finishes.

**Integration & verification (inline):**
- `lessons.test.ts` invariants: ≥20 lessons; all 8 modules present; globally
  unique kebab-case lesson + exercise ids; valid module refs; non-empty
  title/blurb/content; every exercise has non-empty instructions + starterCode.
- **Run-every-scaffold gate** (the important one): bundle `lessons/index.ts` with
  esbuild, extract every `exercise.starterCode`, and execute each under `python3`
  — proving nothing throws on Run. (numpy/pandas starters validated in the
  authoring agents' env; the local gate may skip those imports if numpy/pandas
  aren't installed, logging what it skipped — no silent caps.)
- `tsc --noEmit`, `eslint`, `vitest run`, `next build`.

## 6. Out of scope (v1)

Progress persistence (localStorage/accounts/server), per-learner adaptivity,
non-Python tracks, exercise auto-grading/unit-test harness, and any change to the
interview modes' behavior. The `docs/question-bank-backlog.md`-style coverage
backlog for lessons can follow once the format is proven.
