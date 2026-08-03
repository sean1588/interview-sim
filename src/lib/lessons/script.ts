// Serializes a lesson (its card + all exercises + where the learner currently
// is) into the `questionPrompt` the client sends the tutor each turn. The tutor
// always sees the whole lesson arc; the learner's position updates as they click
// Prev/Next. The chat route appends live editor state separately, so this is
// purely the static lesson material plus a position marker.

import type { Lesson } from "./types";

export function buildLessonScript(
  lesson: Lesson,
  exerciseIndex: number,
  /** Ids of quiz questions the learner has answered wrong, in the order missed. */
  missedQuizIds: readonly string[] = []
): string {
  const head = `LESSON: ${lesson.title}\n${lesson.content}`;
  const missed = quizMisses(lesson, missedQuizIds);

  if (lesson.exercises.length === 0) {
    return `${head}\n\n(This lesson has no exercises — teach it conversationally.)${missed}`;
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

${position}${missed}`;
}

/**
 * The lesson's quiz misses, as a block the tutor can teach from. Silent until the
 * learner actually gets one wrong, so the common case adds nothing to the prompt.
 * The learner has already seen the explanation on screen — the tutor's job is to
 * find out *why* they picked what they picked, not to re-read it aloud.
 */
function quizMisses(lesson: Lesson, missedIds: readonly string[]): string {
  const missed = missedIds
    .map((id) => lesson.quiz.find((q) => q.id === id))
    .filter((q) => q !== undefined);
  if (missed.length === 0) return "";

  const list = missed
    .map(
      (q) =>
        `- ${q.prompt}\n  Correct answer: ${q.options[q.answer]}\n  Why: ${q.explanation}`
    )
    .join("\n");

  return `

QUIZ MISSES (the learner got these end-of-lesson questions wrong and has already been shown the explanation on screen — work through the underlying idea with them rather than reciting it back, and ask what led them to their answer):
${list}`;
}
