"use client";

import { useCallback, useMemo, useState } from "react";
import VoiceChat, { SessionContext } from "@/components/VoiceChat";
import Scorecard, { ScorecardData } from "@/components/Scorecard";
import RecapCard, { RecapData } from "@/components/RecapCard";
import SessionFrame from "@/components/session/SessionFrame";
import SelectChip from "@/components/session/SelectChip";
import ToggleChip from "@/components/session/ToggleChip";
import { LEVELS, type TargetLevel } from "@/lib/levels";
import { useSession } from "@/components/useSession";
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
  /** Offer the "Tutor mode" toggle. Opt-in per mode: system-design hands over
   * the approach; behavioral coaches STAR storytelling (shaping the
   * candidate's own story rather than handing over an answer). Ending a tutor
   * session produces an ungraded recap rather than a scorecard. */
  allowTutor?: boolean;
}

export default function NotesInterview(cfg: NotesInterviewConfig) {
  const { mode, questions } = cfg;
  const [questionId, setQuestionId] = useState(questions[0].id);
  const [level, setLevel] = useState<TargetLevel>("senior");
  const [tutor, setTutor] = useState(false);
  // Notes survive question switches — the candidate may want to carry ideas over.
  const [notes, setNotes] = useState("");

  const {
    sessionId,
    assessing,
    result,
    tutorResult,
    error: assessError,
    endSession,
    closeResult,
  } = useSession<ScorecardData | RecapData>(mode);

  const question = useMemo(
    () => questions.find((q) => q.id === questionId)!,
    [questions, questionId]
  );

  const getContext = useCallback(
    (): SessionContext => ({
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
    endSession({
      questionTitle: ctx.questionTitle,
      questionPrompt: ctx.questionPrompt,
      notes: ctx.notes,
      // Still sent in tutor mode, and still ignored there: the picker always
      // ships a level, but an ungraded recap must not anchor to one.
      level: ctx.level,
      tutor,
    });
  };

  const controls = (
    <>
      <span className="font-sans text-[10px] font-medium uppercase tracking-[0.18em] text-faint">
        Level
      </span>
      <SelectChip value={level} onChange={(e) => setLevel(e.target.value as TargetLevel)} ariaLabel="Level">
        {LEVELS.map((lvl) => (
          <option key={lvl.id} value={lvl.id}>
            {lvl.label} ({lvl.hint})
          </option>
        ))}
      </SelectChip>
      <span className="font-sans text-[10px] font-medium uppercase tracking-[0.18em] text-faint">
        {cfg.questionLabel}
      </span>
      <SelectChip
        value={questionId}
        onChange={(e) => setQuestionId(e.target.value)}
        ariaLabel={cfg.questionLabel}
        className="max-w-[240px] truncate"
      >
        {questions.map((q) => (
          <option key={q.id} value={q.id}>
            {q.title}
          </option>
        ))}
      </SelectChip>
      {cfg.allowTutor && (
        <ToggleChip checked={tutor} onChange={setTutor} label="Tutor mode" />
      )}
    </>
  );

  return (
    <>
      <SessionFrame
        root={{ label: "Studio", href: "/" }}
        title={cfg.title}
        endLabel="End Interview"
        endBusyLabel="Assessing…"
        ending={assessing}
        onEnd={handleEnd}
        error={assessError ?? undefined}
        controls={controls}
      >
        {/* Conversation */}
        <div className="w-[466px] flex-none border-r border-section min-h-0">
          <VoiceChat sessionId={sessionId} mode={mode} tutor={tutor} getContext={getContext} />
        </div>

        {/* Work: question + notes */}
        <div className="flex-1 min-w-0 flex flex-col min-h-0 bg-editor">
          <div className="h-[218px] flex-none overflow-y-auto border-b border-hair px-[26px] py-5">
            <h2 className="mb-2 font-serif text-[25px] font-semibold text-ink">
              {question.title}
            </h2>
            <p className="whitespace-pre-wrap font-serif text-[16.5px] leading-[1.6] text-ink-body">
              {question.prompt}
            </p>
            {cfg.questionTip && (
              <p className="mt-3 font-sans text-[11px] text-faint">{cfg.questionTip}</p>
            )}
          </div>

          <div className="flex-1 min-h-0 flex flex-col p-5">
            <div className="mb-2 flex items-center justify-between">
              <div className="font-sans text-[10px] font-medium uppercase tracking-[0.16em] text-faint">
                {cfg.notesHeading}
              </div>
              {cfg.sectionChips && (
                <div className="flex gap-1.5">
                  {cfg.sectionChips.map((label) => (
                    <button
                      key={label}
                      onClick={() => insertSection(label)}
                      className="rounded-[6px] border border-edge bg-chip px-2.5 py-1 font-sans text-[11px] text-ink-muted transition-colors hover:border-cognac/40 hover:text-ink"
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
              className="flex-1 w-full resize-none rounded-lg border border-edge bg-frame p-4 font-mono text-[13px] leading-relaxed text-ink-body placeholder:text-faint focus:border-cognac/40 focus:outline-none"
            />
            {cfg.notesFooter && (
              <div className="mt-2 font-sans text-[11px] text-faint">{cfg.notesFooter}</div>
            )}
          </div>
        </div>
      </SessionFrame>

      {/* Which card to show is decided by the flag the assessment ran under, not
          by sniffing fields off the response. */}
      {result &&
        (tutorResult ? (
          <RecapCard
            data={result as RecapData}
            heading="Session Recap"
            onClose={closeResult}
          />
        ) : (
          <Scorecard data={result as ScorecardData} mode={mode} onClose={closeResult} />
        ))}
    </>
  );
}
