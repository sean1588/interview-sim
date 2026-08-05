// Generates src/lib/lessons/dsa/<module>.ts from the workflow's verified JSON
// in /tmp/dsa-lessons. String fields use JSON.stringify (ids/titles) or escaped
// template literals (markdown/code), so arbitrary content — including ```fences
// and ${...} — round-trips correctly. Deterministic: same JSON in, same .ts out.
// Mirrors gen-ts-lessons.mjs, plus the quiz: authors write options
// CORRECT-ANSWER-FIRST (no `answer` field), and this generator rotates each
// question's options by a hash of its id and sets `answer` to match — so the
// committed data is the reviewable truth and the answer position is spread
// across A-D (the failure the lesson-bank distribution test exists to catch).

import { readFileSync, writeFileSync } from "node:fs";

const SRC = new URL("../src/lib/lessons/dsa/", import.meta.url).pathname;
const TMP = "/tmp/dsa-lessons";
const QUIZ_LENGTH = 3;
const QUIZ_OPTIONS = 4;

// moduleId -> [file, export const name, expected lesson count]
const MAP = [
  ["complexity", "complexity.ts", "complexityLessons", 3],
  ["arrays-strings", "arrays-strings.ts", "arraysStringsLessons", 3],
  ["hash-maps", "hash-maps.ts", "hashMapsLessons", 3],
  ["linked-lists", "linked-lists.ts", "linkedListsLessons", 3],
  ["stacks-queues", "stacks-queues.ts", "stacksQueuesLessons", 3],
  ["trees", "trees.ts", "treesLessons", 3],
  ["graphs", "graphs.ts", "graphsLessons", 3],
  ["sorting-searching", "sorting-searching.ts", "sortingSearchingLessons", 3],
];

const tpl = (s) =>
  "`" +
  String(s).replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${") +
  "`";
const q = (s) => JSON.stringify(s);

// Deterministic per-question hash → answer position 0..3.
const answerSlot = (id) =>
  [...id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % QUIZ_OPTIONS;

/** Rotate correct-first options so the correct one lands at `slot`. */
function rotateQuiz(question) {
  const slot = answerSlot(question.id);
  const rest = question.options.slice(1);
  // Insert the correct option at `slot` among the distractors, preserving the
  // distractors' authored order around it.
  const options = [...rest.slice(0, slot), question.options[0], ...rest.slice(slot)];
  return { ...question, options, answer: slot };
}

function emitExercise(e) {
  return `    {
      id: ${q(e.id)},
      title: ${q(e.title)},
      instructions: ${tpl(e.instructions)},
      starterCode: ${tpl(e.starterCode)},
    }`;
}

function emitQuestion(question) {
  const opts = question.options.map((o) => `        ${q(o)},`).join("\n");
  return `    {
      id: ${q(question.id)},
      prompt: ${q(question.prompt)},
      options: [
${opts}
      ],
      answer: ${question.answer},
      explanation: ${q(question.explanation)},
    }`;
}

function emitLesson(l, moduleId) {
  const exBlock = l.exercises.length
    ? `[\n${l.exercises.map(emitExercise).join(",\n")},\n    ]`
    : `[]`;
  const quizBlock = `[\n${l.quiz.map(emitQuestion).join(",\n")},\n    ]`;
  return `  {
    id: ${q(l.id)},
    module: ${q(moduleId)},
    title: ${q(l.title)},
    blurb: ${q(l.blurb)},
    content: ${tpl(l.content)},
    exercises: ${exBlock},
    quiz: ${quizBlock},
  }`;
}

let totalLessons = 0;
let totalEx = 0;
let totalQ = 0;
const errors = [];

for (const [moduleId, file, konst, expected] of MAP) {
  const data = JSON.parse(readFileSync(`${TMP}/${moduleId}.json`, "utf8"));
  if (data.moduleId !== moduleId) errors.push(`${file}: moduleId mismatch (${data.moduleId})`);
  if (data.lessons.length !== expected)
    errors.push(`${file}: expected ${expected} lessons, got ${data.lessons.length}`);

  for (const l of data.lessons) {
    if (!l.id.startsWith("dsa-")) errors.push(`${l.id}: lesson id not dsa- prefixed`);
    if (!Array.isArray(l.quiz) || l.quiz.length !== QUIZ_LENGTH)
      errors.push(`${l.id}: quiz must have exactly ${QUIZ_LENGTH} questions`);
    for (const [i, question] of (l.quiz ?? []).entries()) {
      if (question.id !== `${l.id}-q${i + 1}`)
        errors.push(`${l.id}: quiz id ${question.id} should be ${l.id}-q${i + 1}`);
      if (question.options?.length !== QUIZ_OPTIONS)
        errors.push(`${question.id}: needs exactly ${QUIZ_OPTIONS} options`);
      if (new Set(question.options).size !== question.options?.length)
        errors.push(`${question.id}: duplicate options`);
      if ("answer" in question)
        errors.push(`${question.id}: authors must not set answer — options go correct-first`);
    }
    l.quiz = l.quiz.map(rotateQuiz);
  }

  const lessons = data.lessons.map((l) => emitLesson(l, moduleId)).join(",\n");
  totalLessons += data.lessons.length;
  totalEx += data.lessons.reduce((n, l) => n + l.exercises.length, 0);
  totalQ += data.lessons.reduce((n, l) => n + l.quiz.length, 0);

  writeFileSync(
    `${SRC}${file}`,
    `import type { Lesson } from "../types";\n\nexport const ${konst}: Lesson[] = [\n${lessons},\n];\n`
  );
  console.log(`wrote ${file}: ${data.lessons.length} lessons`);
}

console.log(`\nTOTAL: ${totalLessons} lessons, ${totalEx} exercises, ${totalQ} quiz questions`);
if (errors.length) {
  console.log("\nERRORS:");
  for (const e of errors) console.log(`  - ${e}`);
  process.exit(1);
}
