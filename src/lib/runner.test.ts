import { describe, it, expect } from "vitest";
import * as ts from "typescript";
import { runCode, transpileTypeScript, wrapTranspiledTs } from "@/lib/runner";

// Only the language-dispatch fallback is unit-testable without a real
// Worker/Pyodide environment; the python/js/ts execution paths are integration
// territory. The TypeScript *transpile* step is pure, so it's tested directly.
describe("runCode dispatch", () => {
  it("reports unsupported languages with a friendly message and exit 1", async () => {
    const r = await runCode("rust", "fn main() {}");
    expect(r.exitCode).toBe(1);
    expect(r.stderr).toContain("isn't supported yet");
    expect(r.output).toBe(r.stderr);
    expect(r.stderr).toContain("rust");
  });

  it("treats any unknown language the same way", async () => {
    const r = await runCode("go", "package main");
    expect(r.exitCode).toBe(1);
    expect(r.output).toContain("go");
  });
});

// The CDN `ts` global isn't reachable here, so we feed the node compiler (same
// API) to the pure transpile step the runtime path also uses.
describe("transpileTypeScript", () => {
  it("strips type annotations from the emitted JS", () => {
    const js = transpileTypeScript(ts, "const x: number = 1; let y: string = 'a';");
    expect(js).not.toContain(": number");
    expect(js).not.toContain(": string");
  });

  it("emits plain JS that runs to the expected value", () => {
    const js = transpileTypeScript(
      ts,
      "function add(a: number, b: number): number { return a + b; } console.log(add(40, 2));"
    );
    const logs: unknown[] = [];
    new Function("console", js)({ log: (v: unknown) => logs.push(v) });
    expect(logs).toEqual([42]);
  });

  it("does not type-check — type errors still transpile and run", () => {
    // `const n: number = "nope"` is a type error, but transpile-only ignores it.
    const js = transpileTypeScript(ts, 'const n: number = "ok"; console.log(n);');
    const logs: unknown[] = [];
    new Function("console", js)({ log: (v: unknown) => logs.push(v) });
    expect(logs).toEqual(["ok"]);
  });
});

// The worker runs code in a bare `new Function("console", code)` scope with no
// CommonJS bindings. transpiled `export`/`import` TS references those, so the
// shim is what keeps such code from throwing "exports is not defined". (Note:
// vitest's scope has no ambient `exports`, matching the real worker — a bare
// `node -e` would mask this by leaking one.)
describe("wrapTranspiledTs", () => {
  it("lets TS using top-level export run instead of crashing on `exports`", () => {
    const js = wrapTranspiledTs(
      transpileTypeScript(
        ts,
        "export function add(a: number, b: number): number { return a + b; } console.log(add(40, 2));"
      )
    );
    const logs: unknown[] = [];
    expect(() =>
      new Function("console", js)({ log: (v: unknown) => logs.push(v) })
    ).not.toThrow();
    expect(logs).toEqual([42]);
  });

  it("rejects real module imports with a clear message, not a bare ReferenceError", () => {
    const js = wrapTranspiledTs(
      transpileTypeScript(ts, 'import x from "lodash"; console.log(typeof x);')
    );
    expect(() => new Function("console", js)({ log: () => {} })).toThrow(
      /Imports aren't supported here/
    );
  });

  it("leaves plain code working", () => {
    const js = wrapTranspiledTs(transpileTypeScript(ts, "console.log(1 + 1);"));
    const logs: unknown[] = [];
    new Function("console", js)({ log: (v: unknown) => logs.push(v) });
    expect(logs).toEqual([2]);
  });
});
