"use client";

import { useCallback, useState } from "react";
import type { InterviewMode, SessionMode } from "@/lib/types/mode";
import type { ScorecardData } from "@/components/Scorecard";
import { saveSession } from "@/lib/history";

const GRADED_MODES = new Set<SessionMode>(["coding", "behavioral", "system-design"]);
const isGraded = (m: SessionMode): m is InterviewMode => GRADED_MODES.has(m);

/** Session id + end-of-session assessment shared by every voice workspace.
 * `endSession` posts the mode-specific context to /api/assess and surfaces the
 * result (a graded scorecard for interviews, a recap for learning) or the error.
 * Generic over the result shape so each workspace types it precisely. */
export function useSession<T>(mode: SessionMode) {
  const [sessionId] = useState(() =>
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `s_${Date.now()}_${Math.random().toString(36).slice(2)}`
  );

  const [assessing, setAssessing] = useState(false);
  const [result, setResult] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  const endSession = useCallback(
    async (context: Record<string, unknown>) => {
      setAssessing(true);
      setError(null);
      try {
        const res = await fetch("/api/assess", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, mode, ...context }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Assessment failed");
        setResult(data.result);

        // Persist graded scorecards to on-device history (best-effort). Learning
        // recaps have a different result shape and are intentionally skipped, so
        // the history UI stays single-shape. A storage failure must never break
        // the live session or the in-modal result — hence the try/catch.
        if (isGraded(mode)) {
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

  return { sessionId, assessing, result, error, endSession, closeResult };
}
