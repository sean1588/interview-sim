"use client";

/** Non-graded end-of-lesson recap (the learning-mode counterpart to Scorecard).
 * No scores, no recommendation — just an encouraging summary of what was
 * practiced and what to reinforce. */
export interface RecapData {
  summary: string;
  conceptsCovered: string[];
  wentWell: string[];
  toReview: string[];
  suggestedNext?: string;
}

export default function RecapCard({
  data,
  onClose,
}: {
  data: RecapData;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 sticky top-0 bg-gray-900">
          <h2 className="text-lg font-semibold text-white">Lesson Recap</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-sm px-2 py-1"
          >
            ✕ Close
          </button>
        </div>

        <div className="p-5 space-y-5 text-sm">
          <p className="text-gray-300 leading-relaxed">{data.summary}</p>

          {data.conceptsCovered?.length > 0 && (
            <div>
              <h3 className="text-gray-200 font-medium mb-2">Concepts covered</h3>
              <div className="flex flex-wrap gap-1.5">
                {data.conceptsCovered.map((c, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-full bg-gray-800 text-gray-300 text-xs"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {data.wentWell?.length > 0 && (
            <div>
              <h3 className="text-emerald-400 font-medium mb-1">What went well</h3>
              <ul className="list-disc pl-5 space-y-0.5 text-gray-300">
                {data.wentWell.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {data.toReview?.length > 0 && (
            <div>
              <h3 className="text-amber-400 font-medium mb-1">To review</h3>
              <ul className="list-disc pl-5 space-y-0.5 text-gray-300">
                {data.toReview.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {data.suggestedNext && (
            <div className="pt-2 border-t border-gray-800">
              <span className="text-gray-500 text-xs uppercase tracking-wide">
                Suggested next
              </span>
              <p className="mt-1 text-gray-300">{data.suggestedNext}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
