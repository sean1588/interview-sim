"use client";

import { useCallback, useState } from "react";
import type { ScorecardData } from "@/components/Scorecard";
import type { InterviewMode } from "@/lib/types/mode";

/** Session id + end-of-interview assessment state shared by every interview
 * workspace. `endInterview` posts the mode-specific context to /api/assess
 * and surfaces the scorecard (or the error). */
export function useInterviewSession(mode: InterviewMode) {
  const [sessionId] = useState(() =>
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `s_${Date.now()}_${Math.random().toString(36).slice(2)}`
  );

  const [assessing, setAssessing] = useState(false);
  const [scorecard, setScorecard] = useState<ScorecardData | null>(null);
  const [assessError, setAssessError] = useState<string | null>(null);

  const endInterview = useCallback(
    async (context: Record<string, unknown>) => {
      setAssessing(true);
      setAssessError(null);
      try {
        const res = await fetch("/api/assess", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, mode, ...context }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Assessment failed");
        setScorecard(data.scorecard);
      } catch (e) {
        setAssessError(e instanceof Error ? e.message : "Assessment failed");
      } finally {
        setAssessing(false);
      }
    },
    [sessionId, mode]
  );

  const closeScorecard = useCallback(() => setScorecard(null), []);

  return { sessionId, assessing, scorecard, assessError, endInterview, closeScorecard };
}
