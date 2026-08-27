"use client";

import { useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import LessonQuiz from "@/components/session/LessonQuiz";
import type { LessonGraphic, ResolvedExercise, ResolvedQuizQuestion } from "@/lib/lessons";

/** The current exercise plus its navigation — present only on lessons that have
 * exercises. Bundling these keeps the conversational-lesson caller from passing
 * no-op filler for fields it doesn't use. */
export interface ExerciseView {
  data: ResolvedExercise;
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}

type TabId = "notes" | "exercise" | "graphics" | "quiz";

/** The middle column of the lesson room: a tabbed reading area that swaps between
 * the lesson notes, the current exercise, concept graphics, and the end-of-lesson
 * quiz — the de-cramping fix that replaces the old stack of four scroll panes.
 * Exercise and Graphics tabs appear only when the lesson has those assets.
 *
 * Every pane stays mounted and is hidden rather than unmounted, so switching tabs
 * keeps both scroll position and half-finished quiz answers. */
export default function LessonMaterial({
  content,
  quiz,
  onMissedChange,
  exercise,
  graphics,
}: {
  content: string;
  quiz: ResolvedQuizQuestion[];
  onMissedChange: (missedIds: string[]) => void;
  exercise?: ExerciseView;
  graphics?: LessonGraphic[];
}) {
  const [tab, setTab] = useState<TabId>("notes");
  const hasGraphics = !!graphics && graphics.length > 0;

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
        {hasGraphics && (
          <Tab active={tab === "graphics"} onClick={() => setTab("graphics")}>
            Graphics
          </Tab>
        )}
        <Tab active={tab === "quiz"} onClick={() => setTab("quiz")}>
          Quiz
        </Tab>
      </div>

      <Pane active={tab === "notes"}>
        <div className="markdown">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </Pane>

      {exercise && (
        <Pane active={tab === "exercise"}>
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
        </Pane>
      )}

      {hasGraphics && (
        <Pane active={tab === "graphics"}>
          <div className="flex flex-col gap-7">
            {graphics.map((g) => (
              <figure key={g.id} className="m-0">
                <div className="font-serif text-[18px] font-semibold text-ink">
                  {g.title}
                </div>
                <div className="mt-3 overflow-hidden rounded-[10px] border border-edge bg-inset">
                  {/* eslint-disable-next-line @next/next/no-img-element -- static public lesson art */}
                  <img
                    src={g.src}
                    alt={g.title}
                    className="block w-full h-auto"
                  />
                </div>
                {g.caption && (
                  <figcaption className="mt-2.5 font-sans text-[13px] leading-relaxed text-ink-muted">
                    {g.caption}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        </Pane>
      )}

      <Pane active={tab === "quiz"}>
        <LessonQuiz quiz={quiz} onMissedChange={onMissedChange} />
      </Pane>
    </div>
  );
}

/** One tab body. Hidden, not unmounted, so pane state survives tab switches. */
function Pane({ active, children }: { active: boolean; children: ReactNode }) {
  return (
    <div
      className={`flex-1 min-h-0 overflow-y-auto px-[22px] py-[22px] ${active ? "" : "hidden"}`}
    >
      {children}
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
