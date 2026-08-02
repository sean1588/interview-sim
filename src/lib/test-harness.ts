// Grading a candidate's solution against the problem's test cases.
//
// The sandbox can only hand back text, so the shape of this module follows from
// that: generate a harness that appends itself to the candidate's source and
// prints ONE sentinel line carrying JSON results, then parse and grade that line
// out here. Everything except `runTests` is pure — no worker, no CDN, no browser —
// which is what makes the grading rules unit-testable (the same reason
// `runner.ts` exports `shapePyMessage` / `transpileTypeScript`).
//
// `runner.ts` itself is untouched: `runTests` composes on top of `runCode`.

import type { LanguageId, TestSpec } from "@/lib/problems";
import { runCode, type RunResult } from "@/lib/runner";

/** Marks the harness's one line of output. Stripped before the candidate sees it. */
const SENTINEL = "__TESTS__";

export interface CaseResult {
  index: number; // 0-based
  passed: boolean;
  args: unknown[];
  expected: unknown;
  actual?: unknown; // present when the call returned
  error?: string; // present when the call threw
}

export interface TestSummary {
  passed: number;
  total: number;
  results: CaseResult[];
  /** The sentinel never appeared — the candidate's code threw before the harness ran. */
  didNotRun: boolean;
}

/** One raw entry in the sentinel payload, as emitted by the generated harness. */
interface RawCase {
  ok?: boolean;
  actual?: unknown;
  error?: string;
}

/**
 * Append a harness to the candidate's source. Appending (never wrapping or
 * replacing) is the whole trick: their own prints keep running and keep landing
 * in the console exactly as before, and the harness is just more top-level code
 * after them.
 *
 * The generated block calls the entry point once per case inside a per-case
 * try/catch, so one throwing case doesn't cost the others their grade, and emits
 * a single `__TESTS__<json>` line.
 *
 * Returns the code unchanged when there's nothing to harness (no entry point for
 * this language, or a language with no in-browser runtime) — the run then grades
 * as `didNotRun` rather than throwing.
 */
export function buildHarness(
  language: LanguageId,
  code: string,
  spec: TestSpec
): string {
  const entry = spec.entryPoint[language];
  if (!entry) return code;
  const args = spec.cases.map((c) => c.args);
  if (language === "python") return `${code}\n\n${pythonHarness(entry, args)}`;
  if (language === "javascript" || language === "typescript") {
    // TypeScript is appended as plain JS *before* transpilation — the existing
    // transpile step carries it through untouched.
    return `${code}\n\n${javascriptHarness(entry, args)}`;
  }
  return code;
}

function javascriptHarness(entry: string, args: unknown[][]): string {
  return `;(function () {
  var __cases = ${JSON.stringify(args)};
  var __out = [];
  for (var __i = 0; __i < __cases.length; __i++) {
    try {
      __out.push({ ok: true, actual: ${entry}.apply(null, __cases[__i]) });
    } catch (__e) {
      __out.push({ ok: false, error: String((__e && __e.message) || __e) });
    }
  }
  console.log(${JSON.stringify(SENTINEL)} + JSON.stringify(__out));
})();
`;
}

function pythonHarness(entry: string, args: unknown[][]): string {
  // The cases ride in as a JSON string literal: every escape JSON.stringify can
  // emit is also valid in a Python double-quoted string, so one stringify of the
  // JSON text gives a safe literal for both layers.
  const cases = JSON.stringify(JSON.stringify(args));
  // The outer try/except guarantees a sentinel even if the harness itself fails,
  // so a harness bug reads as failing cases rather than as "did not run".
  return `try:
    import json as __json
    __cases = __json.loads(${cases})
    __out = []
    for __args in __cases:
        try:
            # Round-tripping inside the per-case try turns an unserializable
            # return value into that case's error instead of losing the batch.
            __out.append({"ok": True, "actual": __json.loads(__json.dumps(${entry}(*__args)))})
        except Exception as __e:
            __out.append({"ok": False, "error": str(__e) or type(__e).__name__})
    print(${JSON.stringify(SENTINEL)} + __json.dumps(__out))
except Exception as __e:
    __msg = str(__e).replace("\\\\", " ").replace('"', "'").replace("\\n", " ")
    __entry = '{"ok": false, "error": "harness: ' + __msg + '"}'
    print(${JSON.stringify(SENTINEL)} + "[" + ", ".join([__entry] * ${args.length}) + "]")
`;
}

/**
 * Pull the harness payload out of raw run output and hand back the output the
 * candidate should actually see. Every sentinel line is removed (not just the one
 * we read) so none can ever surface in the console; the payload comes from the
 * last, which is the run that counts.
 */
export function extractHarnessOutput(raw: string): {
  payload: string | null;
  cleaned: string;
} {
  const lines = raw.split("\n");
  const kept: string[] = [];
  let payload: string | null = null;
  for (const line of lines) {
    if (line.startsWith(SENTINEL)) payload = line.slice(SENTINEL.length);
    else kept.push(line);
  }
  return { payload, cleaned: payload === null ? raw : kept.join("\n").trim() };
}

/**
 * Order-insensitive, key-order-insensitive serialization of a JSON-able value —
 * two values are equal exactly when their canonical forms match. Sorting object
 * keys means `{a:1,b:2}` and `{b:2,a:1}` compare equal, which plain
 * `JSON.stringify` would get wrong.
 */
function canonical(value: unknown): string {
  if (value === undefined) return "undefined";
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "undefined";
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  const obj = value as Record<string, unknown>;
  return `{${Object.keys(obj)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${canonical(obj[k])}`)
    .join(",")}}`;
}

function sortedCopy(values: unknown[]): unknown[] {
  return [...values].sort((a, b) => {
    const [ca, cb] = [canonical(a), canonical(b)];
    return ca < cb ? -1 : ca > cb ? 1 : 0;
  });
}

/**
 * Structural deep equality over JSON-able values. With `unordered`, both sides are
 * sorted at the TOP LEVEL only before comparing, so "return the answer in any
 * order" passes while a reordered *nested* list still fails.
 */
export function compareValues(
  actual: unknown,
  expected: unknown,
  unordered: boolean
): boolean {
  if (unordered && Array.isArray(actual) && Array.isArray(expected)) {
    return canonical(sortedCopy(actual)) === canonical(sortedCopy(expected));
  }
  return canonical(actual) === canonical(expected);
}

/** A summary for a run whose harness never reported — no failures, just no data. */
function didNotRun(spec: TestSpec): TestSummary {
  return { passed: 0, total: spec.cases.length, results: [], didNotRun: true };
}

/**
 * Grade raw run output against the spec. An absent or unparseable payload is
 * reported honestly as `didNotRun` — the candidate's code raised before the
 * appended harness could run, which is not the same as failing every case.
 */
export function gradeOutput(raw: string, spec: TestSpec): TestSummary {
  const { payload } = extractHarnessOutput(raw);
  if (payload === null) return didNotRun(spec);
  let parsed: unknown;
  try {
    parsed = JSON.parse(payload);
  } catch {
    return didNotRun(spec);
  }
  if (!Array.isArray(parsed)) return didNotRun(spec);

  const results = spec.cases.map((testCase, index): CaseResult => {
    const reported = parsed[index] as RawCase | undefined;
    const base = { index, args: testCase.args, expected: testCase.expected };
    if (!reported || typeof reported !== "object") {
      return { ...base, passed: false, error: "no result reported" };
    }
    if (reported.ok === false) {
      return { ...base, passed: false, error: reported.error || "threw" };
    }
    return {
      ...base,
      actual: reported.actual,
      passed: compareValues(
        reported.actual,
        testCase.expected,
        spec.unordered ?? false
      ),
    };
  });

  return {
    passed: results.filter((r) => r.passed).length,
    total: results.length,
    results,
    didNotRun: false,
  };
}

/**
 * Run the candidate's code against the spec. The returned `RunResult` carries the
 * *cleaned* output — the sentinel line is already gone, so callers can show or
 * forward it as-is.
 */
export async function runTests(
  language: LanguageId,
  code: string,
  spec: TestSpec
): Promise<{ run: RunResult; tests: TestSummary }> {
  const run = await runCode(language, buildHarness(language, code, spec));
  return {
    run: {
      ...run,
      stdout: extractHarnessOutput(run.stdout).cleaned,
      output: extractHarnessOutput(run.output).cleaned,
    },
    tests: gradeOutput(run.output, spec),
  };
}

/** Compact one-line rendering of a value for a failure line. */
function show(value: unknown): string {
  return value === undefined ? "undefined" : JSON.stringify(value) ?? "undefined";
}

/**
 * `case 2: two_sum([3,2,4], 6) → [0,2]  expected [1,2]` — the failure form shared
 * by the editor console and the interviewer's run context, so the two can't drift.
 */
export function formatFailure(name: string, result: CaseResult): string {
  const call = `${name}(${result.args.map(show).join(", ")})`;
  const got = result.error ? `threw ${result.error}` : `→ ${show(result.actual)}`;
  return `case ${result.index + 1}: ${call} ${got}  expected ${show(result.expected)}`;
}

/**
 * Up to `limit` failure lines, followed by `…and N more` when truncated. Empty
 * when everything passed or the harness never ran.
 */
export function failureLines(
  summary: TestSummary,
  name: string,
  limit = 3
): string[] {
  const failures = summary.results.filter((r) => !r.passed);
  const shown = failures.slice(0, limit).map((r) => formatFailure(name, r));
  const rest = failures.length - shown.length;
  return rest > 0 ? [...shown, `…and ${rest} more`] : shown;
}
