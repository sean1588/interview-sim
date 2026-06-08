# Coding Question-Bank Expansion — Design

**Date:** 2026-06-07
**Status:** Approved (user waived spec review; proceed straight to implementation)

## Goal

Grow the coding-problem bank from 3 to ~38 by importing the candidate's own
practice problems from two private repos, adapting each to **Python + JavaScript**.
Coding questions only — system design and behavioral are explicitly out of scope
for now.

## Source material

Cloned temporarily to `/tmp/iv-import/`:

- `interview-practice` (Go) — messy scratch repo, **low signal**. Excluded
  entirely (the one clean candidate, Longest Palindromic Substring, is hard-excluded
  per user).
- `interview-practice-java` — the source. Two clean, one-problem-per-file dirs,
  each file carrying a header (title, statement, approach, complexity):
  - `go/practice/` — 21 canonical problems
  - `javascript/practice/` — ~35 files (many dupes of the Go set, a few already in
    our bank, some JS-trivia/scratch)

After dedup against our existing 3 and merging go/js overlaps: **~38 distinct
problems**.

We **lift the problem statement** from each header and rewrite it into our markdown
`prompt` style. We **do not copy solution code** — the bank ships empty runnable
starters only (signature + example call), matching the existing 3.

## Data model

`src/lib/problems.ts` → `src/lib/problems/` directory.

- `types.ts` — `LanguageId`, `Difficulty`, `Problem`. The one change:
  `starterCode` becomes `Partial<Record<LanguageId, string>>` so a problem can be
  available in a subset of languages.
- Topic files, each exporting `Problem[]`: `arrays.ts`, `strings.ts`,
  `searching.ts`, `linked-lists.ts`, `trees.ts`, `graphs.ts`, `heap.ts`, `dp.ts`,
  `backtracking.ts`, `design.ts`, `js-utils.ts`.
- `index.ts` — assembles `PROBLEMS` from the topic arrays and re-exports
  `getProblem` + the types, so every existing `@/lib/problems` import is unchanged.

DSA problems carry `python` + `javascript`. The 3 existing problems keep their
`typescript` starters; new problems do not author TypeScript. Truly JS-specific
utilities (debounce, rate limiter, custom iterator) are `javascript`-only; the
translatable utilities (deep clone, flatten, calculator) get both.

## Data-structure scaffolding

Starters stay self-contained and runnable:

- Trees → level-order array in the prompt; starter embeds `TreeNode` + a
  `build_tree`/`buildTree` helper.
- Linked lists → starter embeds `ListNode` + a `build_list` helper.
- Graphs → adjacency dict/list passed directly (no class).
- Design problems (LRU Cache, Trie) → class skeleton with method stubs + example
  usage.

## UI changes

- Picker stays **flat** (`Title · Difficulty`), no topic field.
- `CodeEditor` language dropdown lists only the languages the current problem
  provides (`Object.keys(problem.starterCode)`).
- `InterviewSim`: on problem switch, if the active language isn't supported by the
  new problem, auto-switch to a supported one (prefer Python, else JavaScript). The
  per-(problem, language) buffer logic already keys on both and composes.

## Testing

`src/lib/problems/problems.test.ts` asserts bank invariants: unique ids, valid
difficulty, non-empty prompt, ≥1 language, every listed language has a non-empty
starter, and every JavaScript starter parses (via `new Function`). Python starters
get a manual smoke pass at assembly.

## Implementation strategy

Authoring ~38 problems is mechanical and parallelizable. Dispatch subagents by
topic-file batch, each reading its assigned source files from `/tmp/iv-import` and
emitting a `Problem[]` in the exact shape (empty starters, no solutions). Assemble
the index, wire the UI, add the invariants test, and verify centrally
(`tsc` / `eslint` / `test` / `build`).
