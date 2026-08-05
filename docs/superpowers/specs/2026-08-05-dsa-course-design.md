# Data Structures & Algorithms course — design

**Date:** 2026-08-05 · **Status:** approved

## What

A sixth `/learn` course: **Data Structures & Algorithms** (`id: "dsa"`), covering the
interview-prep fundamentals — complexity, arrays/strings (two pointers, sliding window,
prefix sums), hash maps/sets, linked lists, stacks/queues, trees, graphs, and
sorting/searching. ~24 lessons across 8 modules, every lesson with editor exercises and
the standard 3-question quiz.

Exercises run in **TypeScript** (owner's choice): typed `ListNode`/`TreeNode` signatures
make structure shapes explicit, and the course inherits the two existing CI gates for TS
starters (transpile-and-construct, editor squiggle check).

## The one model change: a *subject* course

`Course.language` today drives both the editor **and** the tutor persona. DSA breaks that
conflation: it needs the editor (so it declares `language: "typescript"`) but its tutor
must teach algorithms, not "TypeScript for people new to TypeScript".

Fix: persona selection in `prompts.ts` gains a course-id-keyed override that wins over the
language table.

- `SubjectCourseId = "dsa"` in `lessons/types.ts`, next to `ConceptCourseId`, with the
  same compile-time link: a subject course without a persona entry fails the build.
- `SUBJECT_PROFILE: Record<SubjectCourseId, {subject, student, scope, analogy, recap}>`
  in `prompts.ts`, mirroring `CONCEPT_PROFILE`'s shape.
- `learningProfile(language, course)` checks `SUBJECT_PROFILE[course]` first, then the
  existing language table, then the concept table. One selector, still in one place.
- The editor-aware tutor prompt (sees code, nudges, never hands over answers) is shared
  between language and subject courses; only the two persona sentences differ. Kickoff
  and recap prompts get the same treatment.

Language courses and concept courses produce byte-identical prompts before and after.

## Course structure

| Module | Lessons |
|---|---|
| `complexity` | Big-O growth, time vs space trade-offs, reading code for complexity |
| `arrays-strings` | Two pointers, sliding window, prefix sums |
| `hash-maps` | How a hash map works, frequency counting, seen-before patterns |
| `linked-lists` | Nodes & traversal, fast/slow pointers, in-place reversal |
| `stacks-queues` | Stack patterns, queues & deques, monotonic stack |
| `trees` | Binary trees & BSTs, DFS traversals & recursion, BFS level-order |
| `graphs` | Representations, traversal & components (union-find intro), topological sort |
| `sorting-searching` | Binary search, search-space variants, how the classic sorts work |

All lesson/exercise ids are `dsa-` prefixed (the concept-course convention: `aws-`,
`ds-`) which keeps the global-uniqueness invariant satisfiable by inspection. Quiz ids
are `<lesson-id>-q1..q3`, matching the existing banks.

## Authoring pipeline

Same machinery that built the TypeScript course (`scripts/author-ts-lessons.workflow.js`):

1. `scripts/author-dsa-lessons.workflow.js` pre-assigns every id/title/blurb, a `focus`
   per lesson, a `task` per exercise, and quiz slots. One author agent per module writes
   JSON to `/tmp/dsa-lessons/`; every starter must pass
   `node scripts/ts-lesson-check.mjs` (the worker-faithful transpile-and-run) before the
   agent may return. One adversarial reviewer per module then hunts for algorithmic
   inaccuracies, solution-leaking scaffolds, and broken starters, and re-verifies.
2. `scripts/gen-dsa-lessons.mjs` deterministically emits
   `src/lib/lessons/dsa/<module>.ts` from the JSON. Unlike `gen-ts-lessons.mjs` (which
   predates quizzes) it also emits `quiz`: authors write options **correct-answer-first**
   and the generator rotates each question by a hash of its id — the committed data is
   the reviewable truth, and the answer-position-distribution test keeps holding.

DSA-specific starter rules encoded in the workflow: node classes (`ListNode`,
`TreeNode`) are defined inline per starter (single self-contained file, no imports), and
never named `Node` — the editor's type-check gate runs starters as isolated scripts where
`Node`, `Event`, `name`, `status`, `top`, `parent`, `history`, `length` etc. collide with
DOM globals.

## Test/gate changes

- Registry pin in `lessons.test.ts` gains `"dsa"` (after `go`, before the concept
  courses).
- Both TS starter gates (transpile-and-construct; squiggle check) now iterate every
  course with `language === "typescript"` instead of naming the TypeScript course — the
  gate belongs to the language, not the course.
- `scripts/run-ts-lesson-gate.mjs` bundles the whole lesson registry and runs starters
  for every TS-language course.
- `prompts.test.ts` pins the new persona: `course: "dsa"` yields a DSA tutor that sees
  the editor and never claims the student is new to TypeScript.

## Out of scope

Per-exercise multi-language starters (an `Exercise` has one `starterCode`; making it
per-language is a model change nothing else needs), graded test-cases on lesson
exercises (lessons teach; the interview problem bank grades), and any homepage changes
(course cards derive from `COURSES`).
