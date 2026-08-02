import { describe, it, expect } from "vitest";
import * as ts from "typescript";
import type { TestSpec } from "@/lib/problems";
import { transpileTypeScript, wrapTranspiledTs } from "@/lib/runner";
import {
  buildHarness,
  compareValues,
  extractHarnessOutput,
  failureLines,
  formatFailure,
  gradeOutput,
  type TestSummary,
} from "@/lib/test-harness";

// The JS harness is executed in-process with `new Function`, mirroring exactly
// what the sandbox worker does (a captured `console`, one bare function scope) —
// no Worker, no Pyodide, no network. The Python harness can only be checked as
// *source*: Pyodide is browser-only, so there's nothing here to execute it with.

/** Stand-in for the worker's captured console (`runner.ts` JS_WORKER_SRC). */
function runJs(source: string): string {
  const logs: string[] = [];
  const fmt = (a: unknown[]) =>
    a
      .map((x) => {
        if (typeof x === "string") return x;
        try {
          return JSON.stringify(x);
        } catch {
          return String(x);
        }
      })
      .join(" ");
  const console = { log: (...a: unknown[]) => logs.push(fmt(a)) };
  new Function("console", source)(console);
  return logs.join("\n");
}

const TWO_SUM: TestSpec = {
  entryPoint: { javascript: "twoSum", typescript: "twoSum", python: "two_sum" },
  cases: [
    { args: [[2, 7, 11, 15], 9], expected: [0, 1] },
    { args: [[3, 2, 4], 6], expected: [1, 2] },
    { args: [[3, 3], 6], expected: [0, 1] },
  ],
};

const CORRECT_JS = `function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    if (seen.has(target - nums[i])) return [seen.get(target - nums[i]), i];
    seen.set(nums[i], i);
  }
  return [];
}`;

describe("buildHarness — JavaScript", () => {
  it("scores a correct solution total/total", () => {
    const raw = runJs(buildHarness("javascript", CORRECT_JS, TWO_SUM));
    const summary = gradeOutput(raw, TWO_SUM);
    expect(summary).toMatchObject({ passed: 3, total: 3, didNotRun: false });
    expect(summary.results.every((r) => r.passed)).toBe(true);
    expect(summary.results[0].actual).toEqual([0, 1]);
  });

  it("scores a solution wrong on one case at total-1", () => {
    // Always answers [0, 1] — right for the first and third case, wrong for the second.
    const wrong = `function twoSum(nums, target) { return [0, 1]; }`;
    const summary = gradeOutput(runJs(buildHarness("javascript", wrong, TWO_SUM)), TWO_SUM);
    expect(summary.passed).toBe(2);
    expect(summary.total).toBe(3);
    const failed = summary.results.filter((r) => !r.passed);
    expect(failed).toHaveLength(1);
    expect(failed[0].index).toBe(1);
    expect(failed[0].error).toBeUndefined();
    expect(failed[0].actual).toEqual([0, 1]);
  });

  it("keeps grading the other cases when one throws", () => {
    // Correct, except it blows up on the two-element case.
    const throws = CORRECT_JS.replace(
      "const seen = new Map();",
      'if (nums.length === 2) throw new Error("boom");\n  const seen = new Map();'
    );
    const summary = gradeOutput(runJs(buildHarness("javascript", throws, TWO_SUM)), TWO_SUM);
    expect(summary.passed).toBe(2);
    expect(summary.total).toBe(3);
    const failed = summary.results.filter((r) => !r.passed);
    expect(failed).toHaveLength(1);
    expect(failed[0].index).toBe(2);
    expect(failed[0].error).toContain("boom");
    expect(failed[0].actual).toBeUndefined();
  });

  it("reports didNotRun when the candidate's code throws before the harness", () => {
    const raw = (() => {
      try {
        return runJs(buildHarness("javascript", `${CORRECT_JS}\nthrow new Error("top level");`, TWO_SUM));
      } catch {
        return ""; // the worker returns whatever was logged before the throw
      }
    })();
    const summary = gradeOutput(raw, TWO_SUM);
    expect(summary).toMatchObject({ passed: 0, total: 3, didNotRun: true });
    expect(summary.results).toEqual([]);
  });

  it("leaves the candidate's own output intact and strips the sentinel", () => {
    const withPrint = `${CORRECT_JS}\nconsole.log(twoSum([2, 7, 11, 15], 9));`;
    const raw = runJs(buildHarness("javascript", withPrint, TWO_SUM));
    expect(raw).toContain("__TESTS__");
    const { cleaned } = extractHarnessOutput(raw);
    expect(cleaned).toBe("[0,1]");
    expect(cleaned).not.toContain("__TESTS__");
  });

  it("returns the code untouched when the spec has no entry point for the language", () => {
    const spec: TestSpec = { entryPoint: { python: "two_sum" }, cases: TWO_SUM.cases };
    expect(buildHarness("javascript", CORRECT_JS, spec)).toBe(CORRECT_JS);
  });
});

describe("buildHarness — TypeScript", () => {
  it("survives the transpile step the runner puts it through", () => {
    const tsSource = `function twoSum(nums: number[], target: number): number[] {
  const seen = new Map<number, number>();
  for (let i = 0; i < nums.length; i++) {
    const want: number = target - nums[i];
    if (seen.has(want)) return [seen.get(want)!, i];
    seen.set(nums[i], i);
  }
  return [];
}`;
    // Same order as runTypeScript: append the plain-JS harness, then transpile.
    const harnessed = buildHarness("typescript", tsSource, TWO_SUM);
    const js = wrapTranspiledTs(transpileTypeScript(ts, harnessed));
    expect(gradeOutput(runJs(js), TWO_SUM)).toMatchObject({ passed: 3, total: 3 });
  });
});

describe("buildHarness — Python", () => {
  // Pyodide is browser-only, so this asserts the emitted *source*, not its output.
  const source = buildHarness("python", "def two_sum(nums, target):\n    return []\n", TWO_SUM);

  it("appends to the candidate's code rather than replacing it", () => {
    expect(source.startsWith("def two_sum(nums, target):")).toBe(true);
  });

  it("calls the entry point and prints the sentinel", () => {
    expect(source).toContain("two_sum(*__args)");
    expect(source).toContain('"__TESTS__"');
    expect(source).toContain("import json as __json");
  });

  it("embeds the cases as JSON", () => {
    expect(source).toContain(JSON.stringify(JSON.stringify(TWO_SUM.cases.map((c) => c.args))));
  });

  it("wraps the whole block so a harness failure still emits a sentinel", () => {
    // Two try statements: the per-case one and the block-level fallback.
    expect(source.match(/^except Exception as __e:$/m)).not.toBeNull();
    expect(source).toContain('"harness: ');
  });
});

describe("extractHarnessOutput", () => {
  it("splits the payload from the candidate's output", () => {
    const { payload, cleaned } = extractHarnessOutput('hello\n__TESTS__[{"ok":true}]');
    expect(payload).toBe('[{"ok":true}]');
    expect(cleaned).toBe("hello");
  });

  it("passes output through untouched when there is no sentinel", () => {
    const raw = "hello\nworld\n";
    expect(extractHarnessOutput(raw)).toEqual({ payload: null, cleaned: raw });
  });

  it("takes the last sentinel and removes every one of them", () => {
    const { payload, cleaned } = extractHarnessOutput(
      "one\n__TESTS__[1]\ntwo\n__TESTS__[2]\nthree"
    );
    expect(payload).toBe("[2]");
    expect(cleaned).toBe("one\ntwo\nthree");
  });
});

describe("compareValues", () => {
  it("deep-compares JSON-able values", () => {
    expect(compareValues([1, [2, 3]], [1, [2, 3]], false)).toBe(true);
    expect(compareValues([1, [2, 3]], [1, [3, 2]], false)).toBe(false);
    expect(compareValues({ a: 1, b: 2 }, { b: 2, a: 1 }, false)).toBe(true);
    expect(compareValues(null, null, false)).toBe(true);
    expect(compareValues(undefined, [0, 1], false)).toBe(false);
    expect(compareValues("2", 2, false)).toBe(false);
  });

  it("rejects a reordered result when the problem is ordered", () => {
    expect(compareValues([1, 0], [0, 1], false)).toBe(false);
  });

  it("accepts a reordered top level when the problem is unordered", () => {
    expect(compareValues([1, 0], [0, 1], true)).toBe(true);
    expect(
      compareValues([["tan", "nat"], ["bat"]], [["bat"], ["tan", "nat"]], true)
    ).toBe(true);
  });

  it("still rejects a reordered inner list when unordered", () => {
    expect(
      compareValues([["nat", "tan"], ["bat"]], [["bat"], ["tan", "nat"]], true)
    ).toBe(false);
  });

  it("falls back to deep equality when a side isn't an array", () => {
    expect(compareValues(null, null, true)).toBe(true);
    expect(compareValues(null, [1], true)).toBe(false);
    expect(compareValues(3, 3, true)).toBe(true);
  });
});

describe("gradeOutput", () => {
  it("grades a well-formed payload", () => {
    const raw =
      '__TESTS__[{"ok":true,"actual":[0,1]},{"ok":false,"error":"boom"},{"ok":true,"actual":[9,9]}]';
    const summary = gradeOutput(raw, TWO_SUM);
    expect(summary).toMatchObject({ passed: 1, total: 3, didNotRun: false });
    expect(summary.results[1]).toMatchObject({ index: 1, passed: false, error: "boom" });
    expect(summary.results[2]).toMatchObject({ passed: false, actual: [9, 9] });
  });

  it("reports didNotRun on a malformed payload", () => {
    expect(gradeOutput("__TESTS__not json", TWO_SUM)).toMatchObject({
      passed: 0,
      total: 3,
      didNotRun: true,
    });
    expect(gradeOutput('__TESTS__{"ok":true}', TWO_SUM).didNotRun).toBe(true);
  });

  it("reports didNotRun on an absent payload", () => {
    expect(gradeOutput("Traceback: NameError", TWO_SUM)).toMatchObject({
      passed: 0,
      total: 3,
      didNotRun: true,
      results: [],
    });
  });

  it("marks a case with no reported result as failed rather than passing it", () => {
    const summary = gradeOutput('__TESTS__[{"ok":true,"actual":[0,1]}]', TWO_SUM);
    expect(summary.passed).toBe(1);
    expect(summary.total).toBe(3);
    expect(summary.results[2].error).toBe("no result reported");
  });
});

describe("failure formatting", () => {
  const summary: TestSummary = gradeOutput(
    '__TESTS__[{"ok":true,"actual":[0,1]},{"ok":true,"actual":[0,2]},{"ok":false,"error":"boom"}]',
    TWO_SUM
  );

  it("renders a call, its result, and the expectation", () => {
    expect(formatFailure("two_sum", summary.results[1])).toBe(
      "case 2: two_sum([3,2,4], 6) → [0,2]  expected [1,2]"
    );
  });

  it("renders a throw instead of a return value", () => {
    expect(formatFailure("two_sum", summary.results[2])).toContain("threw boom");
  });

  it("truncates to the limit and says how many are left", () => {
    expect(failureLines(summary, "two_sum", 1)).toEqual([
      "case 2: two_sum([3,2,4], 6) → [0,2]  expected [1,2]",
      "…and 1 more",
    ]);
  });

  it("is empty when everything passed", () => {
    const clean = gradeOutput(
      '__TESTS__[{"ok":true,"actual":[0,1]},{"ok":true,"actual":[1,2]},{"ok":true,"actual":[0,1]}]',
      TWO_SUM
    );
    expect(failureLines(clean, "two_sum")).toEqual([]);
  });
});
