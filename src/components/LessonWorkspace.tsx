"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import VoiceChat, { SessionContext } from "@/components/VoiceChat";
import CodeEditor from "@/components/CodeEditor";
import RecapCard, { RecapData } from "@/components/RecapCard";
import { useSession } from "@/components/useSession";
import { buildLessonScript, type Lesson } from "@/lib/lessons";
import type { LanguageId } from "@/lib/problems";
import type { RunResult } from "@/lib/runner";

// Learning mode is Python-only.
const PYTHON_ONLY: LanguageId[] = ["python"];

export default function LessonWorkspace({ lesson }: { lesson: Lesson }) {
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
      language: hasExercises ? "python" : undefined,
      lastRun: lastRunRef.current,
    }),
    [lesson, exerciseIndex, code, hasExercises]
  );

  const handleEnd = useCallback(() => {
    endSession({
      questionTitle: lesson.title,
      code: hasExercises ? code : undefined,
    });
  }, [endSession, lesson.title, code, hasExercises]);

  const markdown = useMemo(() => lesson.content, [lesson.content]);

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-950 text-white overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/learn" className="text-gray-400 hover:text-white text-sm">← Lessons</Link>
          <span className="text-gray-600">·</span>
          <h1 className="text-lg font-semibold">{lesson.title}</h1>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {error && <span className="text-red-400 text-xs">{error}</span>}
          <button
            onClick={handleEnd}
            disabled={assessing}
            className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
              assessing
                ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-500 text-white"
            }`}
          >
            {assessing ? "Wrapping up…" : "End Lesson"}
          </button>
        </div>
      </header>

      {/* Split screen */}
      <div className="flex-1 min-h-0 flex">
        {/* Left: tutor + voice */}
        <div className="w-[38%] min-w-[320px] border-r border-gray-800 min-h-0">
          <VoiceChat sessionId={sessionId} mode="learning" getContext={getContext} />
        </div>

        {/* Right: lesson card + exercise editor */}
        <div className="flex-1 min-w-0 flex flex-col min-h-0">
          <div
            className={`px-5 py-4 border-b border-gray-800 overflow-y-auto ${
              hasExercises ? "max-h-[45%]" : "flex-1"
            }`}
          >
            <div className="prose-invert max-w-none text-sm text-gray-300 space-y-2 markdown">
              <ReactMarkdown>{markdown}</ReactMarkdown>
            </div>
          </div>

          {hasExercises && exercise && (
            <>
              <div className="px-5 py-3 border-b border-gray-800 shrink-0">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-sm font-semibold">{exercise.title}</h2>
                    <span className="text-xs text-gray-500">
                      Exercise {exerciseIndex + 1} of {lesson.exercises.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => goToExercise(exerciseIndex - 1)}
                      disabled={exerciseIndex === 0}
                      className="px-2.5 py-1 rounded text-xs border border-gray-700 text-gray-300 hover:border-gray-500 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      ← Prev
                    </button>
                    <button
                      onClick={() => goToExercise(exerciseIndex + 1)}
                      disabled={exerciseIndex === lesson.exercises.length - 1}
                      className="px-2.5 py-1 rounded text-xs border border-gray-700 text-gray-300 hover:border-gray-500 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Next →
                    </button>
                  </div>
                </div>
                <div className="prose-invert max-w-none text-xs text-gray-400 markdown">
                  <ReactMarkdown>{exercise.instructions}</ReactMarkdown>
                </div>
              </div>
              <div className="flex-1 min-h-0">
                <CodeEditor
                  code={code}
                  language="python"
                  languages={PYTHON_ONLY}
                  onCodeChange={setCode}
                  onLanguageChange={() => {}}
                  onRun={handleRun}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {recap && <RecapCard data={recap} onClose={closeResult} />}
    </div>
  );
}
