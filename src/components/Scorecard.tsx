"use client";

import type { InterviewMode } from "@/lib/types/mode";
import { SCORE_LABELS } from "@/lib/score-labels";

export interface ScoreItem {
  score: number;
  notes: string;
}

export interface ScorecardData {
  recommendation: string;
  overall: number;
  scores: Record<string, ScoreItem>;
  strengths: string[];
  improvements: string[];
  summary: string;
  /** Level the candidate actually performed at (behavioral / system-design),
   * judged independently of the level they were targeting. */
  performedAtLevel?: { level: string; rationale: string };
}

// Closed enum from the assessor (see /api/assess) — keyed lookup, so coloring
// can't break on substring ordering (e.g. "Lean No Hire" containing "hire").
const REC_TONE: Record<string, string> = {
  "strong hire": "bg-olive text-[#f3f1e4]",
  hire: "bg-olive text-[#f3f1e4]",
  "lean hire": "bg-olive/85 text-[#f3f1e4]",
  "lean no hire": "bg-[#a8442b] text-[#fbf3e7]",
  "no hire": "bg-[#9c3b28] text-[#fbf3e7]",
};

function recTone(rec: string): string {
  return REC_TONE[rec.trim().toLowerCase()] ?? "bg-gold text-[#3a2c10]";
}

function Dots({ score }: { score: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={`w-2.5 h-2.5 rounded-full ${
            n <= Math.round(score) ? "bg-cognac" : "bg-edge"
          }`}
        />
      ))}
    </div>
  );
}

export default function Scorecard({
  data,
  onClose,
  mode,
}: {
  data: ScorecardData;
  onClose: () => void;
  mode: InterviewMode;
}) {
  // Per-key fallback (labels[key] ?? key below) stays: the LLM may emit a key
  // we don't know. The mode itself is always known.
  const labels = SCORE_LABELS[mode];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2c2722]/55 p-6">
      <div
        className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-[10px] border border-edge bg-frame text-ink"
        style={{ boxShadow: "0 30px 70px rgba(60,40,20,.28)" }}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-section bg-raised px-6 py-4">
          <h2 className="font-serif text-[21px] font-semibold text-ink">Interview Assessment</h2>
          <button
            onClick={onClose}
            className="rounded-md px-2 py-1 font-sans text-[13px] text-ink-muted transition-colors hover:text-ink"
          >
            ✕ Close
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div className="flex items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 font-sans text-[11px] font-semibold uppercase tracking-[0.08em] ${recTone(
                data.recommendation
              )}`}
            >
              {data.recommendation}
            </span>
            <span className="font-sans text-[13px] text-ink-muted">
              Overall <span className="font-semibold text-ink">{data.overall}/5</span>
            </span>
          </div>

          {data.performedAtLevel && (
            <div className="space-y-1">
              <span className="inline-block rounded-full bg-gold/[0.16] px-3 py-1 font-sans text-[11px] font-semibold text-gold-text">
                Performed at: {data.performedAtLevel.level}
              </span>
              <p className="font-serif text-[14px] text-ink-muted">
                {data.performedAtLevel.rationale}
              </p>
            </div>
          )}

          <p className="font-serif text-[16.5px] leading-[1.6] text-ink-body">{data.summary}</p>

          <div className="space-y-3">
            {Object.entries(data.scores ?? {}).map(([key, item]) => (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-sans text-[13px] font-medium text-ink">
                    {labels[key] ?? key}
                  </span>
                  <Dots score={item.score} />
                </div>
                <p className="font-serif text-[14px] text-ink-muted">{item.notes}</p>
              </div>
            ))}
          </div>

          {data.strengths?.length > 0 && (
            <div>
              <h3 className="mb-1 font-sans text-[12px] font-semibold uppercase tracking-[0.1em] text-olive">
                Strengths
              </h3>
              <ul className="markdown list-disc space-y-0.5 pl-5">
                {data.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {data.improvements?.length > 0 && (
            <div>
              <h3 className="mb-1 font-sans text-[12px] font-semibold uppercase tracking-[0.1em] text-cognac-text">
                Areas to Improve
              </h3>
              <ul className="markdown list-disc space-y-0.5 pl-5">
                {data.improvements.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
