// Generates src/lib/lessons/<module>.ts from the workflow's verified JSON in
// /tmp/py-lessons. String fields use JSON.stringify (ids/titles) or escaped
// template literals (markdown/code), so arbitrary content — including ```fences
// — round-trips correctly. Deterministic: same JSON in, same .ts out.

import { readFileSync, writeFileSync } from "node:fs";

const SRC = new URL("../src/lib/lessons/", import.meta.url).pathname;
const TMP = "/tmp/py-lessons";

// moduleId -> [file, export const name, expected lesson count]
const MAP = [
  ["basics", "basics.ts", "basicsLessons", 4],
  ["data-structures", "data-structures.ts", "dataStructuresLessons", 4],
  ["idioms", "idioms.ts", "idiomsLessons", 4],
  ["oop-typing", "oop-typing.ts", "oopTypingLessons", 3],
  ["stdlib", "stdlib.ts", "stdlibLessons", 3],
  ["errors-testing", "errors-testing.ts", "errorsTestingLessons", 2],
  ["tooling", "tooling.ts", "toolingLessons", 2],
  ["libraries", "libraries.ts", "librariesLessons", 3],
];

const tpl = (s) =>
  "`" +
  String(s).replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${") +
  "`";
const q = (s) => JSON.stringify(s);

function emitExercise(e) {
  return `    {
      id: ${q(e.id)},
      title: ${q(e.title)},
      instructions: ${tpl(e.instructions)},
      starterCode: ${tpl(e.starterCode)},
    }`;
}

function emitLesson(l, moduleId) {
  const exBlock = l.exercises.length
    ? `[\n${l.exercises.map(emitExercise).join(",\n")},\n    ]`
    : `[]`;
  return `  {
    id: ${q(l.id)},
    module: ${q(moduleId)},
    title: ${q(l.title)},
    blurb: ${q(l.blurb)},
    content: ${tpl(l.content)},
    exercises: ${exBlock},
  }`;
}

let totalLessons = 0;
let totalEx = 0;
const warnings = [];

for (const [moduleId, file, konst, expected] of MAP) {
  const data = JSON.parse(readFileSync(`${TMP}/${moduleId}.json`, "utf8"));
  if (data.moduleId !== moduleId)
    warnings.push(`${file}: moduleId mismatch (${data.moduleId})`);
  if (data.lessons.length !== expected)
    warnings.push(`${file}: expected ${expected} lessons, got ${data.lessons.length}`);

  const lessons = data.lessons.map((l) => emitLesson(l, moduleId)).join(",\n");
  totalLessons += data.lessons.length;
  totalEx += data.lessons.reduce((n, l) => n + l.exercises.length, 0);

  writeFileSync(
    `${SRC}${file}`,
    `import type { Lesson } from "./types";\n\nexport const ${konst}: Lesson[] = [\n${lessons},\n];\n`
  );
  console.log(`wrote ${file}: ${data.lessons.length} lessons`);
}

console.log(`\nTOTAL: ${totalLessons} lessons, ${totalEx} exercises`);
if (warnings.length) {
  console.log("\nWARNINGS:");
  for (const w of warnings) console.log(`  - ${w}`);
  process.exit(1);
}
