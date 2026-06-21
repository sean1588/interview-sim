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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2c2722]/55 p-6">
      <div
        className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-[10px] border border-edge bg-frame text-ink"
        style={{ boxShadow: "0 30px 70px rgba(60,40,20,.28)" }}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-section bg-raised px-6 py-4">
          <h2 className="font-serif text-[21px] font-semibold text-ink">Lesson Recap</h2>
          <button
            onClick={onClose}
            className="rounded-md px-2 py-1 font-sans text-[13px] text-ink-muted transition-colors hover:text-ink"
          >
            ✕ Close
          </button>
        </div>

        <div className="space-y-5 p-6">
          <p className="font-serif text-[16.5px] leading-[1.6] text-ink-body">{data.summary}</p>

          {data.conceptsCovered?.length > 0 && (
            <div>
              <h3 className="mb-2 font-sans text-[12px] font-semibold uppercase tracking-[0.1em] text-ink-muted">
                Concepts covered
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {data.conceptsCovered.map((c, i) => (
                  <span
                    key={i}
                    className="rounded-full border border-edge bg-chip px-2.5 py-1 font-sans text-[12px] text-ink-soft"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {data.wentWell?.length > 0 && (
            <div>
              <h3 className="mb-1 font-sans text-[12px] font-semibold uppercase tracking-[0.1em] text-olive">
                What went well
              </h3>
              <ul className="markdown list-disc space-y-0.5 pl-5">
                {data.wentWell.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {data.toReview?.length > 0 && (
            <div>
              <h3 className="mb-1 font-sans text-[12px] font-semibold uppercase tracking-[0.1em] text-cognac-text">
                To review
              </h3>
              <ul className="markdown list-disc space-y-0.5 pl-5">
                {data.toReview.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {data.suggestedNext && (
            <div className="border-t border-section pt-3">
              <span className="font-sans text-[10px] font-medium uppercase tracking-[0.14em] text-faint">
                Suggested next
              </span>
              <p className="mt-1 font-serif text-[16px] text-ink-body">{data.suggestedNext}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
