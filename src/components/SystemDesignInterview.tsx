"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import VoiceChat, { InterviewContext } from "@/components/VoiceChat";
import Scorecard, { ScorecardData } from "@/components/Scorecard";
import { SYSTEM_DESIGN_QUESTIONS } from "@/lib/questions/system-design";

export default function SystemDesignInterview() {
  const [sessionId] = useState(() =>
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `s_${Date.now()}_${Math.random().toString(36).slice(2)}`
  );

  const [questionId, setQuestionId] = useState(SYSTEM_DESIGN_QUESTIONS[0].id);
  const [notes, setNotes] = useState("");

  const [assessing, setAssessing] = useState(false);
  const [scorecard, setScorecard] = useState<ScorecardData | null>(null);
  const [assessError, setAssessError] = useState<string | null>(null);

  const question = useMemo(
    () => SYSTEM_DESIGN_QUESTIONS.find((q) => q.id === questionId)!,
    [questionId]
  );

  const getContext = useCallback(
    (): InterviewContext => ({
      notes,
      questionId: question.id,
      questionTitle: question.title,
      questionPrompt: question.prompt,
    }),
    [notes, question]
  );

  const handleQuestionChange = useCallback((id: string) => {
    setQuestionId(id);
  }, []);

  const endInterview = useCallback(async () => {
    setAssessing(true);
    setAssessError(null);
    try {
      const ctx = getContext();
      const res = await fetch("/api/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          mode: "system-design",
          questionTitle: ctx.questionTitle,
          questionPrompt: ctx.questionPrompt,
          notes: ctx.notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Assessment failed");
      setScorecard(data.scorecard);
    } catch (e) {
      setAssessError(e instanceof Error ? e.message : "Assessment failed");
    } finally {
      setAssessing(false);
    }
  }, [getContext, sessionId]);

  // Helper to insert a section header into the notes (quality-of-life, not required).
  const insertSection = (label: string) => {
    const prefix = notes.trim().length > 0 ? "\n\n" : "";
    setNotes((prev) => prev + `${prefix}${label}:\n`);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-950 text-white overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-white text-sm">← Home</Link>
          <span className="text-gray-600">·</span>
          <h1 className="text-lg font-semibold">System Design Interview</h1>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <label className="text-gray-400">Prompt</label>
          <select
            value={questionId}
            onChange={(e) => handleQuestionChange(e.target.value)}
            className="bg-gray-800 text-gray-200 rounded px-2 py-1 border border-gray-700 focus:outline-none focus:border-gray-500 max-w-[260px] truncate"
          >
            {SYSTEM_DESIGN_QUESTIONS.map((q) => (
              <option key={q.id} value={q.id}>
                {q.title}
              </option>
            ))}
          </select>
          {assessError && (
            <span className="text-red-400 text-xs">{assessError}</span>
          )}
          <button
            onClick={endInterview}
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
          <VoiceChat sessionId={sessionId} mode="system-design" getContext={getContext} />
        </div>

        {/* Right: prompt + design notes workspace */}
        <div className="flex-1 min-w-0 flex flex-col min-h-0">
          <div className="px-5 py-4 border-b border-gray-800 max-h-[34%] overflow-y-auto">
            <div className="flex items-baseline gap-2 mb-2">
              <h2 className="text-base font-semibold">{question.title}</h2>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
              {question.prompt}
            </p>
          </div>

          <div className="flex-1 min-h-0 p-4 flex flex-col">
            <div className="flex items-center justify-between mb-1.5">
              <div className="text-xs uppercase tracking-wide text-gray-500">
                Design notes (live — interviewer sees this)
              </div>
              <div className="flex gap-1.5 text-[10px]">
                {["Requirements", "Scale / Capacity", "High-level design", "Deep dive", "Tradeoffs & failures", "Data model"].map(
                  (label) => (
                    <button
                      key={label}
                      onClick={() => insertSection(label)}
                      className="rounded border border-gray-800 bg-gray-900 px-2 py-0.5 text-gray-400 hover:text-gray-200 hover:border-gray-700"
                    >
                      + {label.split(" / ")[0]}
                    </button>
                  )
                )}
              </div>
            </div>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={`Requirements (functional + non-functional)\n\nHigh-level architecture (services, data stores, queues...)\n\nAPIs / data model\n\nCapacity estimates & bottlenecks\n\nTradeoffs & alternatives\n\nFailure modes & mitigation`}
              className="flex-1 w-full resize-none rounded-lg border border-gray-800 bg-gray-950 p-3 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-gray-600 font-mono leading-relaxed"
            />
            <div className="mt-2 text-[10px] text-gray-500">
              Pro tip: Write key decisions, numbers, and diagrams in text form (e.g. “LB → 4x App servers → Redis cache → Sharded Postgres”). The interviewer will react to what you write here.
            </div>
          </div>
        </div>
      </div>

      {scorecard && (
        <Scorecard data={scorecard} mode="system-design" onClose={() => setScorecard(null)} />
      )}
    </div>
  );
}
