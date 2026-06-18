// Worker-faithful checker for a single TypeScript lesson starter. Transpiles the
// file exactly like the in-browser runner (type-strip via ts.transpileModule +
// the CommonJS wrap shim) and executes it in a bare new Function("console", …)
// scope — the same scope the JS worker uses — so a starter that throws on Run
// fails here too. Kept in sync with src/lib/runner.ts (source of truth).
//
// CLI:   node scripts/ts-lesson-check.mjs path/to/starter.ts
// Module: import { transpileAndRun } from "./ts-lesson-check.mjs"
//
// Run under ESM (the default for .mjs) so there is NO ambient CommonJS `exports`
// in scope — the wrap shim supplies it, matching the browser worker.

import ts from "typescript";
import { readFileSync } from "node:fs";

export function transpile(code) {
  return ts.transpileModule(code, {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.None },
  }).outputText;
}

export function wrap(js) {
  const shim =
    `const module = { exports: {} }, exports = module.exports, ` +
    `require = (name) => { throw new Error("Imports aren't supported here — write a single self-contained file (no import/require)."); };`;
  return `${shim}\n${js}`;
}

/** Transpile + run `code`; throws if it doesn't run clean. Returns captured stdout. */
export function transpileAndRun(code) {
  const logs = [];
  const fmt = (a) =>
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
  const mockConsole = {
    log: (...a) => logs.push(fmt(a)),
    error: (...a) => logs.push(fmt(a)),
    warn: (...a) => logs.push(fmt(a)),
    info: (...a) => logs.push(fmt(a)),
  };
  const js = wrap(transpile(code));
  new Function("console", js)(mockConsole);
  return logs.join("\n");
}

// CLI mode: check a file path.
if (process.argv[1] && process.argv[1].endsWith("ts-lesson-check.mjs")) {
  const file = process.argv[2];
  if (!file) {
    console.error("usage: node scripts/ts-lesson-check.mjs <file.ts>");
    process.exit(2);
  }
  try {
    const out = transpileAndRun(readFileSync(file, "utf8"));
    console.log(out || "(ran clean, no output)");
    console.log("OK ✅");
  } catch (e) {
    console.error("FAILED ❌");
    console.error((e && e.stack) || e);
    process.exit(1);
  }
}
