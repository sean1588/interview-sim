# TypeScript support (third runnable language)

**Date:** 2026-06-17
**Status:** approved → implementing

## Goal

Make TypeScript a first-class runnable language alongside Python and JavaScript:
the user can pick it in the editor, the freestyle coach can load TS into the
editor, and **Run** executes it. Coding-mode problems already expose TS wherever
they ship a TS starter (a handful do today); the rest are backfilled later.

## What already exists

The codebase was half-wired for this:

- `LanguageId = "python" | "javascript" | "typescript"` already includes TS
  (`src/lib/problems/types.ts`).
- `LANGUAGE_LABELS` already maps `typescript: "TypeScript"` (`CodeEditor.tsx`),
  and Monaco accepts `"typescript"` directly for highlighting + type squiggles.
- A few problems already ship `starterCode.typescript`.
- The `<editor>` stream parser and editor-context plumbing are language-agnostic.

**The only real gap is execution.** `runCode()` dispatches `python → Pyodide`,
`javascript → Worker`, and everything else falls through to "isn't supported yet."

## Approach: transpile-and-run

TypeScript can't run directly — it needs a transpile step. We **strip types and
run** (no type-checking gate; `ts-node --transpile-only` semantics). Type errors
never block Run; Monaco still shows them as squiggles in the editor. This is the
interview-realistic behavior (the candidate wants to see runtime output) and it
lets us reuse the entire JS runtime.

`runTypeScript = load ts → transpileModule(code) → runJavaScript(js)`

- **Load the compiler from CDN, lazily, on first TS run** — mirrors the existing
  `loadPyodide()` pattern exactly (inject a `<script>`, cache the promise). The
  TypeScript UMD bundle (`typescript@5.9.3/lib/typescript.js`, pinned to the
  installed compiler) exposes a global `ts` when loaded via a script tag. Zero
  added app-bundle weight; one ~8MB one-time CDN fetch (cached), faster than the
  ~10s Pyodide load.
- **Transpile** with `ts.transpileModule(code, { target: ES2020, module: None })`.
  `transpileModule` is single-file and never type-checks (exactly what we want).
  For ordinary single-file code the output is clean; but if the source uses
  top-level `import`/`export`, TypeScript still lowers it to CommonJS that
  references `module`/`exports`/`require` — names the worker's bare `new Function`
  scope doesn't define, so it would throw `exports is not defined` before any user
  code runs.
- **Shim** the transpiled output with `wrapTranspiledTs`: prepend a minimal
  CommonJS shim that defines `module`/`exports` (so `export`-using code runs) and
  a `require` that rejects real module imports — unresolvable in the sandbox —
  with a clear message. Plain code ignores the unused bindings.
- **Execute** the shimmed JS through the *existing* `runJavaScript` worker — same
  sandbox, same console capture, same 5s timeout. No second runtime.

`runCode()` keeps its clean dispatch shape: one new `if (language ===
"typescript")` line. The "isn't supported yet" fallback message updates to list
Python, JavaScript, and TypeScript as the runnable set.

### Testability

The CDN `ts` global isn't reachable in unit tests, so the transpile step is
extracted into a pure, exported `transpileTypeScript(ts, code)`. The unit test
passes the **node** `typescript` package (a dev dependency — same API as the CDN
global) and asserts types are stripped and the emitted JS actually runs. The
runtime path (CDN load + worker) stays integration territory, like Python's.

## Wiring (small, mechanical)

- `src/lib/runner.ts` — `loadTypeScript()`, `transpileTypeScript()` and
  `wrapTranspiledTs()` (both exported), `runTypeScript()`, dispatch branch,
  updated fallback message + header comment.
- `src/components/InterviewSim.tsx` — add `"typescript"` to `RUNNABLE_LANGUAGES`.
- `src/components/FreestyleWorkspace.tsx` — add `"typescript"` to
  `FREESTYLE_LANGUAGES`; replace `normalizeLanguage`'s ad-hoc branches with a
  small alias lookup (`ts`/`typescript` → typescript, `js` → javascript, default
  python).
- `src/lib/prompts.ts` — freestyle `<editor>` constraint: lang may be
  `"python"`, `"javascript"`, or `"typescript"`.
- `src/components/CodeEditor.tsx` — replace the python-only "first run is slow"
  ternary with a per-language first-run-hint lookup that also covers TypeScript.

## What this deliberately does NOT do

- No type-checking gate on Run (decided: transpile-and-run).
- No backfill of TS starters across all ~50 problems (decided: enable-only now).
  Coding mode auto-hides TS for problems lacking a TS starter via the existing
  `RUNNABLE_LANGUAGES ∩ starterCode` intersection, so nothing breaks.
- Learning mode stays Python-only (`PYTHON_ONLY` unchanged).

## Tests / gates

- `runner.test.ts` — move the "unsupported language" case off `typescript` (now
  runnable) onto `rust`/`go`; add a `transpileTypeScript` unit test (strips types,
  output runs to the expected value).
- `problems.test.ts` — add `typescript` to the `RUNNABLE` set; add a "every TS
  starter transpiles to valid JS" invariant (mirrors the existing JS-validity one)
  using the node compiler.
- Gates: `tsc --noEmit`, `eslint`, `vitest run`, `next build`.
