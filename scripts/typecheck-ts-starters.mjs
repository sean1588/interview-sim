// Squiggle gate for the TypeScript course: type-check every exercise starter the
// way the in-editor experience does, so a starter never shows the learner a
// SPURIOUS red squiggle. Each starter is checked as a single ISOLATED SCRIPT
// (no import/export) under Monaco's default diagnostics — non-strict + the DOM
// lib — which is exactly how the single-file Monaco editor sees it. That script
// scope is what surfaces collisions with browser globals (Event, status, name,
// Cache, …): a top-level `const name` or `class Cache` clashes with window.name
// / the DOM Cache and squiggles, even though it transpiles + runs fine.
//
// Complements run-ts-lesson-gate.mjs (which proves starters RUN) — this proves
// they're type-CLEAN. The runtime checker can't see type errors at all.
//
// The caller bundles the course first, e.g.:
//   npx esbuild src/lib/lessons/typescript/index.ts --bundle --format=esm \
//     --outfile=/tmp/ts-lessons-bundle.mjs

import ts from "typescript";

const { typescriptCourse } = await import("/tmp/ts-lessons-bundle.mjs");

// Exercises whose starter INTENTIONALLY ships a type error as the teaching point.
// `spot-the-squiggle` exists to show that a type error squiggles but does NOT
// block Run — a clean starter there would defeat the lesson.
const INTENTIONAL = new Set(["spot-the-squiggle"]);

const options = {
  strict: false,
  target: ts.ScriptTarget.ES2020,
  lib: ["lib.es2020.d.ts", "lib.dom.d.ts"],
  noEmit: true,
  skipLibCheck: true,
};
const host = ts.createCompilerHost(options);

let clean = 0;
let intentional = 0;
const failures = [];

for (const lesson of typescriptCourse.lessons) {
  for (const ex of lesson.exercises) {
    const name = `/virtual/${ex.id}.ts`;
    const sf = ts.createSourceFile(name, ex.starterCode, options.target, true);
    const fileHost = {
      ...host,
      getSourceFile: (f, lv, oe, sn) => (f === name ? sf : host.getSourceFile(f, lv, oe, sn)),
      fileExists: (f) => f === name || host.fileExists(f),
      readFile: (f) => (f === name ? ex.starterCode : host.readFile(f)),
    };
    const program = ts.createProgram([name], options, fileHost);
    const diags = ts
      .getPreEmitDiagnostics(program)
      .filter((d) => d.file && d.file.fileName === name);

    if (INTENTIONAL.has(ex.id)) {
      intentional++;
      continue;
    }
    if (diags.length === 0) {
      clean++;
      continue;
    }
    const lines = diags.map((d) => {
      const msg = ts.flattenDiagnosticMessageText(d.messageText, "\n");
      const pos = d.start != null ? d.file.getLineAndCharacterOfPosition(d.start) : null;
      return `    [${d.code}]${pos ? ` L${pos.line + 1}` : ""}: ${msg}`;
    });
    failures.push(`✗ ${lesson.id} / ${ex.id}\n${lines.join("\n")}`);
  }
}

console.log(
  `Type-checked starters (Monaco-faithful: non-strict + dom, isolated scripts): ` +
    `${clean} clean, ${intentional} intentional-squiggle, ${failures.length} with spurious errors.`
);
if (failures.length) {
  console.log("\nSPURIOUS SQUIGGLES (fix these — the learner would see them):\n\n" + failures.join("\n\n"));
  process.exit(1);
}
console.log("No spurious squiggles. ✅");
