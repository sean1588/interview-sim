"use client";

import { useCallback, useRef, useState } from "react";
import VoiceChat, { SessionContext } from "@/components/VoiceChat";
import CodeEditor from "@/components/CodeEditor";
import RecapCard, { RecapData } from "@/components/RecapCard";
import SessionFrame from "@/components/session/SessionFrame";
import LessonMaterial from "@/components/session/LessonMaterial";
import { useSession } from "@/components/useSession";
import { buildLessonScript, type Course, type Lesson } from "@/lib/lessons";
import type { RunResult } from "@/lib/runner";

export default function LessonWorkspace({
  course,
  lesson,
}: {
  course: Course;
  lesson: Lesson;
}) {
  const hasExercises = lesson.exercises.length > 0;
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const exercise = hasExercises ? lesson.exercises[exerciseIndex] : null;

  const { sessionId, assessing, result: recap, error, endSession, closeResult } =
    useSession<RecapData>("learning");

  // One code buffer per exercise, seeded lazily from its starter scaffold.
  const [buffers, setBuffers] = useState<Record<number, string>>(() => {
    const init: Record<number, string> = {};
    if (hasExercises) init[0] = lesson.exercises[0].starterCode;
    return init;
  });
  const code = exercise ? buffers[exerciseIndex] ?? exercise.starterCode : "";

  const lastRunRef = useRef<string | undefined>(undefined);

  const setCode = useCallback(
    (value: string) => setBuffers((prev) => ({ ...prev, [exerciseIndex]: value })),
    [exerciseIndex]
  );

  const goToExercise = useCallback(
    (idx: number) => {
      if (idx < 0 || idx >= lesson.exercises.length) return;
      setExerciseIndex(idx);
      setBuffers((prev) =>
        idx in prev ? prev : { ...prev, [idx]: lesson.exercises[idx].starterCode }
      );
      lastRunRef.current = undefined;
    },
    [lesson.exercises]
  );

  const handleRun = useCallback((res: RunResult) => {
    const text = res.output || res.stderr || "(no output)";
    lastRunRef.current = `exit ${res.exitCode}\n${text}`.slice(0, 2000);
  }, []);

  // Pulled fresh by VoiceChat each turn: the full lesson script (so the tutor
  // sees the whole arc and where the learner is) plus live editor state.
  const getContext = useCallback(
    (): SessionContext => ({
      questionId: lesson.id,
      questionTitle: lesson.title,
      questionPrompt: buildLessonScript(lesson, exerciseIndex),
      code: hasExercises ? code : undefined,
      // Always sent (even on conversational lessons) so the tutor persona is the
      // course's language; with no code, the editor annotation is a no-op.
      language: course.language,
      lastRun: lastRunRef.current,
    }),
    [course.language, lesson, exerciseIndex, code, hasExercises]
  );

  const handleEnd = useCallback(() => {
    endSession({
      questionTitle: lesson.title,
      code: hasExercises ? code : undefined,
      language: course.language,
    });
  }, [endSession, course.language, lesson.title, code, hasExercises]);

  return (
    <>
      <SessionFrame
        root={{ label: "Lessons", href: `/learn/${course.id}` }}
        title={lesson.title}
        pill={lesson.module}
        endLabel="End Lesson"
        endBusyLabel="Wrapping up…"
        ending={assessing}
        onEnd={handleEnd}
        error={error ?? undefined}
      >
        {/* Conversation (tighter — three columns share the width) */}
        <div className="w-[400px] flex-none border-r border-section min-h-0">
          <VoiceChat sessionId={sessionId} mode="learning" getContext={getContext} orbSize={56} />
        </div>

        {hasExercises && exercise ? (
          <>
            {/* Lesson material — tabbed Notes / Exercise */}
            <div className="w-[440px] flex-none border-r border-hair min-h-0">
              <LessonMaterial
                content={lesson.content}
                exercise={{
                  data: exercise,
                  index: exerciseIndex,
                  total: lesson.exercises.length,
                  onPrev: () => goToExercise(exerciseIndex - 1),
                  onNext: () => goToExercise(exerciseIndex + 1),
                }}
              />
            </div>

            {/* Work */}
            <div className="flex-1 min-w-0 flex flex-col min-h-0 bg-editor">
              <CodeEditor
                code={code}
                language={course.language}
                languages={[course.language]}
                onCodeChange={setCode}
                onLanguageChange={() => {}}
                onRun={handleRun}
              />
            </div>
          </>
        ) : (
          // Conversational lesson: no exercises, no editor — the notes fill the room.
          <div className="flex-1 min-w-0 min-h-0">
            <LessonMaterial content={lesson.content} />
          </div>
        )}
      </SessionFrame>

      {recap && <RecapCard data={recap} onClose={closeResult} />}
    </>
  );
}
