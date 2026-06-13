// Run-every-scaffold quality gate: execute every exercise starterCode and prove
// none throw on Run. Imports the esbuild-bundled lesson bank (built by the
// caller into /tmp/lessons-bundle.mjs) so it tests the real repo artifact.
// numpy/pandas starters run under the isolated gate venv; everything else under
// python3. Mirrors how the browser's Pyodide runtime would execute them.

import { execFileSync } from "node:child_process";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";

const { LESSONS } = await import("/tmp/lessons-bundle.mjs");

const GATE = "/tmp/gate";
mkdirSync(GATE, { recursive: true });

const VENV = "/tmp/lessongate-venv/bin/python";
const haveVenv = existsSync(VENV);
const usesSci = (code) => /\b(import\s+(numpy|pandas)|from\s+(numpy|pandas))\b/.test(code);

let pass = 0;
let fail = 0;
let skipped = 0;
const failures = [];
const sciRun = [];

for (const lesson of LESSONS) {
  for (const ex of lesson.exercises) {
    const path = `${GATE}/${ex.id}.py`;
    writeFileSync(path, ex.starterCode);
    const sci = usesSci(ex.starterCode);
    if (sci && !haveVenv) {
      // No local numpy/pandas: compile-check only (these run in Pyodide).
      try {
        execFileSync("python3", ["-c", `compile(open(${JSON.stringify(path)}).read(), ${JSON.stringify(path)}, 'exec')`], { stdio: "pipe" });
        skipped++;
      } catch (e) {
        fail++;
        failures.push(`${lesson.id} / ${ex.id} [compile-check]:\n${tail(e)}`);
      }
      continue;
    }
    const py = sci ? VENV : "python3";
    try {
      execFileSync(py, [path], { stdio: "pipe", timeout: 30000 });
      pass++;
      if (sci) sciRun.push(ex.id);
    } catch (e) {
      fail++;
      failures.push(`${lesson.id} / ${ex.id} [${py}]:\n${tail(e)}`);
    }
  }
}

function tail(e) {
  return (e.stderr?.toString() || e.message || "").trim().split("\n").slice(-4).join("\n");
}

console.log(`Ran ${pass + fail + skipped} exercise starters: ${pass} executed clean, ${fail} failed, ${skipped} compile-checked only (numpy/pandas, no local venv).`);
if (sciRun.length) console.log(`numpy/pandas starters executed under the gate venv: ${sciRun.join(", ")}`);
if (failures.length) {
  console.log("\nFAILURES:\n\n" + failures.join("\n\n"));
  process.exit(1);
}
console.log("All exercise starters run clean. ✅");
