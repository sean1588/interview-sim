// Authoring-time run-every-scaffold gate for the TypeScript course: execute
// every exercise starter through the worker-faithful transpileAndRun (see
// ts-lesson-check.mjs) and prove nothing throws on Run. Mirrors
// scripts/run-lesson-gate.mjs (Python).
//
// The caller bundles the course first, e.g.:
//   npx esbuild src/lib/lessons/typescript/index.ts --bundle --format=esm \
//     --outfile=/tmp/ts-lessons-bundle.mjs
// (type-only imports are erased, so the bundle is just the lesson data.)

import { transpileAndRun } from "./ts-lesson-check.mjs";

// Starters run synchronously; a stray post-sync promise rejection (e.g. an async
// helper that throws) would otherwise crash this gate on a later tick. The
// browser worker swallows such rejections, so match it rather than counting them.
process.on("unhandledRejection", () => {});

const { typescriptCourse } = await import("/tmp/ts-lessons-bundle.mjs");

let pass = 0;
let fail = 0;
const failures = [];

for (const lesson of typescriptCourse.lessons) {
  for (const ex of lesson.exercises) {
    try {
      transpileAndRun(ex.starterCode);
      pass++;
    } catch (e) {
      fail++;
      failures.push(`${lesson.id} / ${ex.id}:\n${(e && e.stack) || e}`);
    }
  }
}

console.log(`Ran ${pass + fail} TS exercise starters: ${pass} clean, ${fail} failed.`);
if (failures.length) {
  console.log("\nFAILURES:\n\n" + failures.join("\n\n"));
  process.exit(1);
}
console.log("All TS exercise starters run clean. ✅");
