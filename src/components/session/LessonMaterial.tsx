"use client";

import { useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import type { Exercise } from "@/lib/lessons";

/** The middle column of the lesson room: a tabbed reading area that swaps between
 * the lesson notes and the current exercise — the de-cramping fix that replaces
 * the old stack of four scroll panes. When a lesson has no exercises it's just the
 * notes, full height, no tabs. */
export default function LessonMaterial({
  content,
  exercise,
  exerciseIndex,
  total,
  onPrev,
  onNext,
}: {
  content: string;
  exercise: Exercise | null;
  exerciseIndex: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const [tab, setTab] = useState<"notes" | "exercise">("notes");
  const showExercise = tab === "exercise" && exercise;

  return (
    <div className="flex flex-col min-h-0 bg-chip">
      {/* Tab row */}
      <div className="flex-none flex gap-0.5 border-b border-hair bg-inset px-[18px]">
        <Tab active={tab === "notes"} onClick={() => setTab("notes")}>
          Lesson Notes
        </Tab>
        {exercise && (
          <Tab active={tab === "exercise"} onClick={() => setTab("exercise")}>
            Exercise · {exerciseIndex + 1}/{total}
          </Tab>
        )}
      </div>

      {showExercise ? (
        <div className="flex-1 min-h-0 overflow-y-auto px-[22px] py-[22px]">
          <div className="mb-3.5 flex items-start justify-between gap-3">
            <div>
              <div className="font-serif text-[18px] font-semibold text-ink">
                {exercise.title}
              </div>
              <div className="mt-[3px] font-sans text-[10px] font-medium uppercase tracking-[0.12em] text-faint">
                Exercise {exerciseIndex + 1} of {total}
              </div>
            </div>
            <div className="flex flex-none gap-[7px]">
              <NavButton onClick={onPrev} disabled={exerciseIndex === 0}>
                ← Prev
              </NavButton>
              <NavButton onClick={onNext} disabled={exerciseIndex >= total - 1}>
                Next →
              </NavButton>
            </div>
          </div>
          <div className="markdown">
            <ReactMarkdown>{exercise.instructions}</ReactMarkdown>
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
      className={`relative px-4 py-3.5 font-sans text-[12px] font-medium uppercase tracking-[0.12em] transition-colors ${
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
      className="rounded-[6px] border border-edge bg-chip px-3 py-1.5 font-sans text-[12px] font-medium text-ink-soft transition-colors hover:border-cognac/40 disabled:cursor-not-allowed disabled:text-faint disabled:hover:border-edge"
    >
      {children}
    </button>
  );
}
