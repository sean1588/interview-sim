"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import type { ResolvedQuizQuestion } from "@/lib/lessons";

/**
 * The lesson's end-of-lesson retention check, shown in the Quiz tab. All the
 * questions are on one page — there are only a few, and a wizard would hide the
 * one thing the learner wants at the end, which is the whole picture.
 *
 * Answering is immediate and final until they retake: pick an option, see whether
 * it was right, the correct answer, and why. Misses are reported upward so the
 * tutor can pick them up mid-conversation.
 */
export default function LessonQuiz({
  quiz,
  onMissedChange,
}: {
  quiz: ResolvedQuizQuestion[];
  /** The full missed-id list after every answer — the parent just stores it. */
  onMissedChange: (missedIds: string[]) => void;
}) {
  // Question index -> chosen option index. Absent means unanswered.
  const [chosen, setChosen] = useState<Record<number, number>>({});

  const answeredCount = Object.keys(chosen).length;
  const done = answeredCount === quiz.length;
  const score = quiz.filter((q, i) => chosen[i] === q.answer).length;

  function answer(index: number, option: number) {
    const next = { ...chosen, [index]: option };
    setChosen(next);
    onMissedChange(quiz.filter((q, i) => i in next && next[i] !== q.answer).map((q) => q.id));
  }

  function retake() {
    setChosen({});
    onMissedChange([]);
  }

  return (
    <>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="font-serif text-[18px] font-semibold text-ink">
            Check yourself
          </div>
          <div className="mt-[3px] font-sans text-[10px] font-medium uppercase tracking-[0.12em] text-faint">
            {done
              ? `${score} of ${quiz.length} correct`
              : `${answeredCount} of ${quiz.length} answered`}
          </div>
        </div>
        {done && (
          <button
            onClick={retake}
            className="flex-none rounded-[6px] border border-edge bg-chip px-3 py-1.5 font-sans text-[12px] font-medium text-ink-soft transition-colors hover:border-cognac/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cognac/40"
          >
            Retake
          </button>
        )}
      </div>

      <div className="space-y-6">
        {quiz.map((question, index) => (
          <Question
            key={question.id}
            question={question}
            number={index + 1}
            chosen={chosen[index]}
            onAnswer={(option) => answer(index, option)}
          />
        ))}
      </div>

      {done && (
        <p className="mt-6 border-t border-hair pt-4 font-serif text-[15px] leading-[1.6] text-ink-muted">
          {score === quiz.length
            ? "All correct. Ask your tutor to push you somewhere harder."
            : "Your tutor can see what you missed — ask them to walk you through it."}
        </p>
      )}
    </>
  );
}

function Question({
  question,
  number,
  chosen,
  onAnswer,
}: {
  question: ResolvedQuizQuestion;
  number: number;
  chosen: number | undefined;
  onAnswer: (option: number) => void;
}) {
  return (
    <div>
      <div className="mb-1 font-sans text-[10px] font-medium uppercase tracking-[0.12em] text-faint">
        Question {number}
      </div>
      <div className="markdown mb-2.5 text-[15px]">
        <ReactMarkdown>{question.prompt}</ReactMarkdown>
      </div>

      <div className="space-y-1.5">
        {question.options.map((option, i) => (
          <button
            key={i}
            onClick={() => onAnswer(i)}
            disabled={chosen !== undefined}
            className={`block w-full rounded-[7px] border px-3 py-2 text-left font-sans text-[13.5px] leading-[1.45] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cognac/40 ${
              OPTION_STYLE[optionState(chosen, i, question.answer)]
            }`}
          >
            <span className="mr-2 font-mono text-[12px] text-faint">
              {"ABCD"[i] ?? i + 1}
            </span>
            {option}
          </button>
        ))}
      </div>

      {chosen !== undefined && (
        <div
          className={`mt-2 border-l-[3px] pl-3 ${
            chosen === question.answer ? "border-olive" : "border-cognac"
          }`}
        >
          <div
            className={`font-sans text-[11px] font-semibold uppercase tracking-[0.1em] ${
              chosen === question.answer ? "text-olive" : "text-cognac-text"
            }`}
          >
            {chosen === question.answer ? "Correct" : "Not quite"}
          </div>
          <div className="markdown mt-0.5 text-[14px]">
            <ReactMarkdown>{question.explanation}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}

/** How one option should read once the learner has (or hasn't) committed. */
type OptionState = "idle" | "picked-right" | "picked-wrong" | "reveal" | "muted";

function optionState(
  chosen: number | undefined,
  index: number,
  answer: number
): OptionState {
  if (chosen === undefined) return "idle";
  if (index === chosen) return index === answer ? "picked-right" : "picked-wrong";
  return index === answer ? "reveal" : "muted";
}

const OPTION_STYLE: Record<OptionState, string> = {
  idle: "border-edge bg-chip text-ink-soft hover:border-cognac/40 cursor-pointer",
  "picked-right": "border-olive bg-olive/10 text-ink",
  "picked-wrong": "border-cognac bg-cognac/10 text-ink",
  // The answer they should have picked, so a miss still teaches.
  reveal: "border-olive/50 bg-olive/5 text-ink-body",
  muted: "border-hair bg-chip/40 text-faint",
};
