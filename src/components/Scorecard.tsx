"use client";

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
}

const SCORE_LABELS: Record<string, string> = {
  correctness: "Correctness",
  problemSolving: "Problem Solving",
  codeQuality: "Code Quality",
  communication: "Communication",
  complexity: "Complexity Analysis",
};

// Closed enum from the assessor (see /api/assess) — keyed lookup, so coloring
// can't break on substring ordering (e.g. "Lean No Hire" containing "hire").
const REC_COLORS: Record<string, string> = {
  "strong hire": "bg-green-600",
  hire: "bg-emerald-600",
  "lean hire": "bg-emerald-600",
  "lean no hire": "bg-red-600",
  "no hire": "bg-red-600",
};

function recColor(rec: string): string {
  return REC_COLORS[rec.trim().toLowerCase()] ?? "bg-yellow-600";
}

function Dots({ score }: { score: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={`w-2.5 h-2.5 rounded-full ${
            n <= Math.round(score) ? "bg-blue-400" : "bg-gray-700"
          }`}
        />
      ))}
    </div>
  );
}

export default function Scorecard({
  data,
  onClose,
}: {
  data: ScorecardData;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 sticky top-0 bg-gray-900">
          <h2 className="text-lg font-semibold text-white">Interview Assessment</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-sm px-2 py-1"
          >
            ✕ Close
          </button>
        </div>

        <div className="p-5 space-y-5 text-sm">
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full text-white text-xs font-semibold ${recColor(
                data.recommendation
              )}`}
            >
              {data.recommendation}
            </span>
            <span className="text-gray-400">
              Overall{" "}
              <span className="text-white font-semibold">
                {data.overall}/5
              </span>
            </span>
          </div>

          <p className="text-gray-300 leading-relaxed">{data.summary}</p>

          <div className="space-y-3">
            {Object.entries(data.scores ?? {}).map(([key, item]) => (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-gray-200 font-medium">
                    {SCORE_LABELS[key] ?? key}
                  </span>
                  <Dots score={item.score} />
                </div>
                <p className="text-gray-500 text-xs">{item.notes}</p>
              </div>
            ))}
          </div>

          {data.strengths?.length > 0 && (
            <div>
              <h3 className="text-green-400 font-medium mb-1">Strengths</h3>
              <ul className="list-disc pl-5 space-y-0.5 text-gray-300">
                {data.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {data.improvements?.length > 0 && (
            <div>
              <h3 className="text-amber-400 font-medium mb-1">
                Areas to Improve
              </h3>
              <ul className="list-disc pl-5 space-y-0.5 text-gray-300">
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
