"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import VoiceChat, { SessionContext } from "@/components/VoiceChat";
import CodeEditor from "@/components/CodeEditor";
import RecapCard, { RecapData } from "@/components/RecapCard";
import SessionFrame from "@/components/session/SessionFrame";
import LessonMaterial from "@/components/session/LessonMaterial";
import { useSession } from "@/components/useSession";
import { useCourseLanguage } from "@/components/useCourseLanguage";
import { buildLessonScript, resolveLesson, type Course, type Lesson } from "@/lib/lessons";
import type { RunResult } from "@/lib/runner";

export default function LessonWorkspace({
  course,
  lesson,
}: {
  course: Course;
  lesson: Lesson;
}) {
  const hasExercises = lesson.exercises.length > 0;

  // Which language this course is being taken in. One course (DSA) teaches the
  // same subject in more than one, so the choice lives in a shared store rather
  // than in this component — the course overview sets it too, and both must agree.
  const [language, selectLanguage] = useCourseLanguage(course.id, course.languages);

  // Everything downstream — notes, exercises, quiz, tutor script — works in plain
  // strings, so the lesson is resolved for the chosen language exactly once here.
  const resolved = useMemo(() => resolveLesson(lesson, language), [lesson, language]);

  // The editor needs a language to run and highlight, so it belongs only to a
  // course that declares one. A concept course (no languages) is conversational
  // throughout — its lessons carry no exercises either. Holding the language
  // rather than a boolean is what lets CodeEditor's props narrow below.
  const editorLanguage = hasExercises ? language : undefined;
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const exercise = hasExercises ? resolved.exercises[exerciseIndex] : null;

  const { sessionId, assessing, result: recap, error, endSession, closeResult } =
    useSession<RecapData>("learning");

  // One code buffer per exercise *per language*, seeded lazily from that
  // language's starter scaffold. Keying by language as well is what lets a
  // learner switch to Python and back without losing the TypeScript they wrote —
  // a single index key would hand the other language's buffer to the editor.
  const bufferKey = `${language ?? "none"}:${exerciseIndex}`;
  const [buffers, setBuffers] = useState<Record<string, string>>({});
  const code = exercise ? buffers[bufferKey] ?? exercise.starterCode : "";

  const lastRunRef = useRef<string | undefined>(undefined);

  // Quiz questions answered wrong, owned here rather than in the quiz so the
  // tutor sees them on the next turn (see buildLessonScript).
  const [missedQuizIds, setMissedQuizIds] = useState<string[]>([]);

  const setCode = useCallback(
    (value: string) => setBuffers((prev) => ({ ...prev, [bufferKey]: value })),
    [bufferKey]
  );

  // The tutor pushed new contents into the editor (same <editor> protocol
  // freestyle uses). The write lands straight in the active buffer — no diff and
  // no accept step — and it goes through `setCode`, so it respects the
  // per-exercise-per-language bufferKey rather than leaking into another buffer.
  // Unlike freestyle, the block's `language` is ignored: a lesson's language is
  // the course's, chosen by the learner, so honouring a drifting `lang` would
  // silently swap the buffer the editor is showing.
  const handleEditorWrite = useCallback(
    (block: { language: string; code: string }) => {
      setCode(block.code);
      // The last run described code that's no longer there; leaving it would
      // have the tutor read a stale error against the code it just wrote.
      lastRunRef.current = undefined;
    },
    [setCode]
  );

  const goToExercise = useCallback(
    (idx: number) => {
      if (idx < 0 || idx >= resolved.exercises.length) return;
      setExerciseIndex(idx);
      lastRunRef.current = undefined;
    },
    [resolved.exercises.length]
  );

  // A language switch invalidates the last run: its output came from code the
  // learner is no longer looking at, and the tutor would read it as current.
  const handleLanguageChange = useCallback(
    (next: typeof language) => {
      if (!next) return;
      selectLanguage(next);
      lastRunRef.current = undefined;
    },
    [selectLanguage]
  );

  const handleRun = useCallback((res: RunResult) => {
    const text = res.output || res.stderr || "(no output)";
    lastRunRef.current = `exit ${res.exitCode}\n${text}`.slice(0, 2000);
  }, []);

  // Pulled fresh by VoiceChat each turn: the full lesson script (so the tutor
  // sees the whole arc and where the learner is) plus live editor state.
  const getContext = useCallback(
    (): SessionContext => ({
      questionId: resolved.id,
      questionTitle: resolved.title,
      questionPrompt: buildLessonScript(resolved, exerciseIndex, missedQuizIds),
      code: hasExercises ? code : undefined,
      // Always sent (even on conversational lessons) so the tutor persona is the
      // course's language; with no code, the editor annotation is a no-op. A
      // concept course sends undefined, and `course` below names the persona.
      language,
      course: course.id,
      lastRun: lastRunRef.current,
    }),
    [language, course.id, resolved, exerciseIndex, code, hasExercises, missedQuizIds]
  );

  const handleEnd = useCallback(() => {
    endSession({
      questionTitle: resolved.title,
      code: hasExercises ? code : undefined,
      language,
      course: course.id,
    });
  }, [endSession, language, course.id, resolved.title, code, hasExercises]);

  return (
    <>
      <SessionFrame
        root={{ label: "Lessons", href: `/learn/${course.id}` }}
        title={resolved.title}
        pill={resolved.module}
        endLabel="End Lesson"
        endBusyLabel="Wrapping up…"
        ending={assessing}
        onEnd={handleEnd}
        error={error ?? undefined}
      >
        {/* Conversation (tighter — three columns share the width) */}
        <div className="w-[400px] flex-none border-r border-section min-h-0">
          <VoiceChat
            sessionId={sessionId}
            mode="learning"
            getContext={getContext}
            // Only a lesson with exercises has an editor to write into; a
            // conversational lesson passes nothing, so a stray block is dropped
            // rather than written to a buffer nobody can see.
            onEditorWrite={hasExercises ? handleEditorWrite : undefined}
            orbSize={56}
          />
        </div>

        {editorLanguage && exercise ? (
          <>
            {/* Lesson material — tabbed Notes / Exercise */}
            <div className="w-[440px] flex-none border-r border-hair min-h-0">
              <LessonMaterial
                content={resolved.content}
                quiz={resolved.quiz}
                graphics={resolved.graphics}
                onMissedChange={setMissedQuizIds}
                exercise={{
                  data: exercise,
                  index: exerciseIndex,
                  total: resolved.exercises.length,
                  onPrev: () => goToExercise(exerciseIndex - 1),
                  onNext: () => goToExercise(exerciseIndex + 1),
                }}
              />
            </div>

            {/* Work */}
            <div className="flex-1 min-w-0 flex flex-col min-h-0 bg-editor">
              <CodeEditor
                code={code}
                language={editorLanguage}
                // A subject course taught in more than one language drives the
                // editor's own picker; a single-language course renders it fixed.
                languages={course.languages ?? [editorLanguage]}
                onCodeChange={setCode}
                onLanguageChange={handleLanguageChange}
                onRun={handleRun}
              />
            </div>
          </>
        ) : (
          // Conversational lesson: no exercises, no editor — the notes fill the room.
          <div className="flex-1 min-w-0 min-h-0">
            <LessonMaterial
              content={resolved.content}
              quiz={resolved.quiz}
              graphics={resolved.graphics}
              onMissedChange={setMissedQuizIds}
            />
          </div>
        )}
      </SessionFrame>

      {recap && <RecapCard data={recap} onClose={closeResult} />}
    </>
  );
}
