"use client";

import { useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import type { Exercise } from "@/lib/lessons";

/** The current exercise plus its navigation — present only on lessons that have
 * exercises. Bundling these keeps the conversational-lesson caller from passing
 * no-op filler for fields it doesn't use. */
export interface ExerciseView {
  data: Exercise;
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}

/** The middle column of the lesson room: a tabbed reading area that swaps between
 * the lesson notes and the current exercise — the de-cramping fix that replaces
 * the old stack of four scroll panes. With no exercise it's just the notes, full
 * height, no tabs. */
export default function LessonMaterial({
  content,
  exercise,
}: {
  content: string;
  exercise?: ExerciseView;
}) {
  const [tab, setTab] = useState<"notes" | "exercise">("notes");
  const showExercise = tab === "exercise" && exercise;

  return (
    <div className="h-full flex flex-col min-h-0 bg-chip">
      {/* Tab row */}
      <div className="flex-none flex gap-0.5 border-b border-hair bg-inset px-[18px]">
        <Tab active={tab === "notes"} onClick={() => setTab("notes")}>
          Lesson Notes
        </Tab>
        {exercise && (
          <Tab active={tab === "exercise"} onClick={() => setTab("exercise")}>
            Exercise · {exercise.index + 1}/{exercise.total}
          </Tab>
        )}
      </div>

      {showExercise ? (
        <div className="flex-1 min-h-0 overflow-y-auto px-[22px] py-[22px]">
          <div className="mb-3.5 flex items-start justify-between gap-3">
            <div>
              <div className="font-serif text-[18px] font-semibold text-ink">
                {exercise.data.title}
              </div>
              <div className="mt-[3px] font-sans text-[10px] font-medium uppercase tracking-[0.12em] text-faint">
                Exercise {exercise.index + 1} of {exercise.total}
              </div>
            </div>
            <div className="flex flex-none gap-[7px]">
              <NavButton onClick={exercise.onPrev} disabled={exercise.index === 0}>
                ← Prev
              </NavButton>
              <NavButton
                onClick={exercise.onNext}
                disabled={exercise.index >= exercise.total - 1}
              >
                Next →
              </NavButton>
            </div>
          </div>
          <div className="markdown">
            <ReactMarkdown>{exercise.data.instructions}</ReactMarkdown>
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto px-[22px] py-[22px] markdown">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

function Tab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative px-4 py-3.5 font-sans text-[12px] font-medium uppercase tracking-[0.12em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cognac/40 ${
        active ? "text-ink" : "text-ink-muted hover:text-ink"
      }`}
    >
      {children}
      {active && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-cognac" />}
    </button>
  );
}

function NavButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-[6px] border border-edge bg-chip px-3 py-1.5 font-sans text-[12px] font-medium text-ink-soft transition-colors hover:border-cognac/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cognac/40 disabled:cursor-not-allowed disabled:text-faint disabled:hover:border-edge"
    >
      {children}
    </button>
  );
}
