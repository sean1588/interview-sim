"use client";

import { useCallback, useState } from "react";
import type { InterviewMode, SessionMode } from "@/lib/types/mode";
import type { ScorecardData } from "@/components/Scorecard";
import { saveSession } from "@/lib/history";
import { savedModel } from "@/lib/model-prefs";

const GRADED_MODES = new Set<SessionMode>(["coding", "behavioral", "system-design"]);
const isGraded = (m: SessionMode): m is InterviewMode => GRADED_MODES.has(m);

/** Session id + end-of-session assessment shared by every voice workspace.
 * `endSession` posts the mode-specific context to /api/assess and surfaces the
 * result (a graded scorecard for interviews, a recap for learning and for tutor
 * sessions) or the error. Generic over the result shape so each workspace types
 * it precisely — an interview workspace passes the union of both card shapes and
 * picks the card off `tutorResult`, never by sniffing fields off the response. */
export function useSession<T>(mode: SessionMode) {
  const [sessionId] = useState(() =>
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `s_${Date.now()}_${Math.random().toString(36).slice(2)}`
  );

  const [assessing, setAssessing] = useState(false);
  const [result, setResult] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Whether `result` is a tutor recap rather than a graded result. Captured from
  // the context that produced it, so toggling Tutor mode while the card is open
  // can't hand a recap to the scorecard renderer.
  const [tutorResult, setTutorResult] = useState(false);

  const endSession = useCallback(
    async (context: Record<string, unknown>) => {
      // Tutor sessions are ungraded: /api/assess returns a recap, and nothing is
      // written to history (see below).
      const tutor = context.tutor === true;
      setAssessing(true);
      setError(null);
      setTutorResult(tutor);
      try {
        const res = await fetch("/api/assess", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // `model` is the home-page choice, read at send time (see VoiceChat).
          body: JSON.stringify({ sessionId, mode, model: savedModel(), ...context }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Assessment failed");
        setResult(data.result);

        // Persist graded scorecards to on-device history (best-effort). Learning
        // recaps — and tutor sessions, which are still a graded `mode` but
        // produce a recap — have a different result shape and are intentionally
        // skipped, so the history UI stays single-shape. A storage failure must
        // never break the live session or the in-modal result — hence the
        // try/catch.
        if (isGraded(mode) && !tutor) {
          try {
            saveSession({
              id: sessionId,
              mode,
              questionTitle: String(context.questionTitle ?? "Untitled"),
              createdAt: Date.now(),
              result: data.result as ScorecardData,
            });
          } catch {
            // ignore: history is non-essential
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Assessment failed");
      } finally {
        setAssessing(false);
      }
    },
    [sessionId, mode]
  );

  const closeResult = useCallback(() => setResult(null), []);

  return { sessionId, assessing, result, tutorResult, error, endSession, closeResult };
}
