"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import VoiceChat, { InterviewContext } from "@/components/VoiceChat";
import Scorecard from "@/components/Scorecard";
import { LEVELS, type TargetLevel } from "@/lib/levels";
import { useInterviewSession } from "@/components/useInterviewSession";
import type { InterviewMode } from "@/lib/types/mode";

/** The notes-based interview workspace shared by the behavioral and
 * system-design modes: question picker, target level, live notes the
 * interviewer can see, and end-of-interview assessment. The two modes differ
 * only in data and copy, which is what this config carries. */
export interface NotesInterviewConfig {
  mode: Exclude<InterviewMode, "coding">;
  title: string;
  /** Label for the question picker, e.g. "Scenario" or "Prompt". */
  questionLabel: string;
  questions: ReadonlyArray<{ id: string; title: string; prompt: string }>;
  /** Optional guidance shown under the question text. */
  questionTip?: string;
  notesHeading: string;
  notesPlaceholder: string;
  /** Optional quick "+ Section" buttons above the notes area. */
  sectionChips?: string[];
  /** Optional guidance shown under the notes area. */
  notesFooter?: string;
}

export default function NotesInterview(cfg: NotesInterviewConfig) {
  const { mode, questions } = cfg;
  const [questionId, setQuestionId] = useState(questions[0].id);
  const [level, setLevel] = useState<TargetLevel>("senior");
  // Notes survive question switches — the candidate may want to carry ideas over.
  const [notes, setNotes] = useState("");

  const { sessionId, assessing, scorecard, assessError, endInterview, closeScorecard } =
    useInterviewSession(mode);

  const question = useMemo(
    () => questions.find((q) => q.id === questionId)!,
    [questions, questionId]
  );

  const getContext = useCallback(
    (): InterviewContext => ({
      notes,
      questionId: question.id,
      questionTitle: question.title,
      questionPrompt: question.prompt,
      level,
    }),
    [notes, question, level]
  );

  const insertSection = (label: string) =>
    setNotes((prev) => prev + (prev.trim() ? "\n\n" : "") + `${label}:\n`);

  const handleEnd = () => {
    const ctx = getContext();
    endInterview({
      questionTitle: ctx.questionTitle,
      questionPrompt: ctx.questionPrompt,
      notes: ctx.notes,
      level: ctx.level,
    });
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-950 text-white overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-white text-sm">← Home</Link>
          <span className="text-gray-600">·</span>
          <h1 className="text-lg font-semibold">{cfg.title}</h1>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <label className="text-gray-400">Level</label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as TargetLevel)}
            className="bg-gray-800 text-gray-200 rounded px-2 py-1 border border-gray-700 focus:outline-none focus:border-gray-500"
          >
            {LEVELS.map((lvl) => (
              <option key={lvl.id} value={lvl.id}>
                {lvl.label} ({lvl.hint})
              </option>
            ))}
          </select>
          <label className="text-gray-400">{cfg.questionLabel}</label>
          <select
            value={questionId}
            onChange={(e) => setQuestionId(e.target.value)}
            className="bg-gray-800 text-gray-200 rounded px-2 py-1 border border-gray-700 focus:outline-none focus:border-gray-500 max-w-[260px] truncate"
          >
            {questions.map((q) => (
              <option key={q.id} value={q.id}>
                {q.title}
              </option>
            ))}
          </select>
          {assessError && (
            <span className="text-red-400 text-xs">{assessError}</span>
          )}
          <button
            onClick={handleEnd}
            disabled={assessing}
            className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
              assessing
                ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-500 text-white"
            }`}
          >
            {assessing ? "Assessing…" : "End Interview"}
          </button>
        </div>
      </header>

      {/* Split screen */}
      <div className="flex-1 min-h-0 flex">
        {/* Left: interviewer + voice */}
        <div className="w-[38%] min-w-[320px] border-r border-gray-800 min-h-0">
          <VoiceChat sessionId={sessionId} mode={mode} getContext={getContext} />
        </div>

        {/* Right: question + notes workspace */}
        <div className="flex-1 min-w-0 flex flex-col min-h-0">
          <div className="px-5 py-4 border-b border-gray-800 max-h-[38%] overflow-y-auto">
            <div className="flex items-baseline gap-2 mb-2">
              <h2 className="text-base font-semibold">{question.title}</h2>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
              {question.prompt}
            </p>
            {cfg.questionTip && (
              <p className="mt-3 text-[11px] text-gray-500">{cfg.questionTip}</p>
            )}
          </div>

          <div className="flex-1 min-h-0 p-4 flex flex-col">
            <div className="flex items-center justify-between mb-1.5">
              <div className="text-xs uppercase tracking-wide text-gray-500">
                {cfg.notesHeading}
              </div>
              {cfg.sectionChips && (
                <div className="flex gap-1.5 text-[10px]">
                  {cfg.sectionChips.map((label) => (
                    <button
                      key={label}
                      onClick={() => insertSection(label)}
                      className="rounded border border-gray-800 bg-gray-900 px-2 py-0.5 text-gray-400 hover:text-gray-200 hover:border-gray-700"
                    >
                      + {label.split(" / ")[0]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={cfg.notesPlaceholder}
              className="flex-1 w-full resize-none rounded-lg border border-gray-800 bg-gray-950 p-3 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-gray-600 font-mono leading-relaxed"
            />
            {cfg.notesFooter && (
              <div className="mt-2 text-[10px] text-gray-500">{cfg.notesFooter}</div>
            )}
          </div>
        </div>
      </div>

      {scorecard && (
        <Scorecard data={scorecard} mode={mode} onClose={closeScorecard} />
      )}
    </div>
  );
}
