// Serializes a lesson (its card + all exercises + where the learner currently
// is) into the `questionPrompt` the client sends the tutor each turn. The tutor
// always sees the whole lesson arc; the learner's position updates as they click
// Prev/Next. The chat route appends live editor state separately, so this is
// purely the static lesson material plus a position marker.

import type { Lesson } from "./types";

export function buildLessonScript(lesson: Lesson, exerciseIndex: number): string {
  const head = `LESSON: ${lesson.title}\n${lesson.content}`;

  if (lesson.exercises.length === 0) {
    return `${head}\n\n(This lesson has no exercises — teach it conversationally.)`;
  }

  const list = lesson.exercises
    .map((ex, i) => `Exercise ${i + 1} — ${ex.title}: ${ex.instructions}`)
    .join("\n\n");

  const idx = Math.min(Math.max(exerciseIndex, 0), lesson.exercises.length - 1);
  const current = lesson.exercises[idx];
  const position = `The learner is currently on Exercise ${idx + 1} of ${lesson.exercises.length}: ${current.title}.`;

  return `${head}

EXERCISES (the learner advances through these with on-screen Prev/Next buttons — you do NOT control which is shown; never claim to switch exercises yourself):
${list}

${position}`;
}
