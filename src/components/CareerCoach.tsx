"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import VoiceChat, { SessionContext } from "@/components/VoiceChat";
import CareerPlanCard, { type CareerPlanData } from "@/components/CareerPlanCard";
import SessionFrame from "@/components/session/SessionFrame";
import { useSession } from "@/components/useSession";
import { savePlan, planSnapshot, planServerSnapshot, subscribePlan } from "@/lib/career-store";

const PLACEHOLDER = `Paste your resume or LinkedIn profile here and the coach will read it — it'll skip what's already covered and dig into what's thin.

Or just jot notes as you talk: companies, dates, projects, numbers you remember mid-sentence.`;

/** The career coaching workspace: a conversation on the left, the user's own
 * background on the right. Shaped like NotesInterview but deliberately separate
 * — there is no question, no target level, and the session ends in a plan rather
 * than a scorecard, so sharing that component would mean making all three
 * conditional. */
export default function CareerCoach() {
  const [notes, setNotes] = useState("");

  const { sessionId, assessing, result, error, endSession, closeResult } =
    useSession<CareerPlanData>("career");

  // The last plan generated on this device, so closing the modal — or reloading
  // mid-session — doesn't destroy a resume the user just spent 20 minutes on.
  const savedPlan = useSyncExternalStore(subscribePlan, planSnapshot, planServerSnapshot);
  const [reopened, setReopened] = useState<CareerPlanData | null>(null);
  const shownPlan = result ?? reopened;

  useEffect(() => {
    if (result) savePlan(result);
  }, [result]);

  const getContext = useCallback((): SessionContext => ({ notes }), [notes]);

  const closePlan = () => {
    setReopened(null);
    closeResult();
  };

  return (
    <>
      <SessionFrame
        root={{ label: "Studio", href: "/" }}
        title="Career Coach"
        endLabel="Build my plan"
        endBusyLabel="Building…"
        ending={assessing}
        onEnd={() => endSession({ notes })}
        error={error ?? undefined}
        controls={
          savedPlan && !shownPlan ? (
            <button
              onClick={() => setReopened(savedPlan)}
              className="rounded-[7px] border border-edge bg-chip px-3 py-[7px] font-sans text-[13px] text-ink-soft transition-colors hover:border-cognac/40 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cognac/40"
            >
              View last plan
            </button>
          ) : undefined
        }
      >
        {/* Conversation */}
        <div className="w-[466px] flex-none border-r border-section min-h-0">
          <VoiceChat sessionId={sessionId} mode="career" getContext={getContext} />
        </div>

        {/* The user's own background — pasted resume, LinkedIn, or live notes */}
        <div className="flex-1 min-w-0 flex flex-col min-h-0 bg-editor">
          <div className="flex-1 min-h-0 flex flex-col p-5">
            <div className="mb-2 font-sans text-[10px] font-medium uppercase tracking-[0.16em] text-faint">
              Your background
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={PLACEHOLDER}
              aria-label="Your background"
              className="flex-1 w-full resize-none rounded-lg border border-edge bg-frame p-4 font-mono text-[13px] leading-relaxed text-ink-body placeholder:text-faint focus:border-cognac/40 focus:outline-none"
            />
            <div className="mt-2 font-sans text-[11px] text-faint">
              The coach reads this but never reads it aloud. Everything stays on your machine
              until you end the session.
            </div>
          </div>
        </div>
      </SessionFrame>

      {shownPlan && <CareerPlanCard data={shownPlan} onClose={closePlan} />}
    </>
  );
}
