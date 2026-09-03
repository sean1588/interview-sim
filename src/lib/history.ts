import type { ScorecardData } from "@/components/Scorecard";
import type { InterviewMode } from "@/lib/types/mode";

/** A completed, graded interview persisted on-device. Only the three graded
 * modes produce a `ScorecardData`; the learning recap has a different result
 * shape and is intentionally NOT stored here, so history stays single-shape. */
export interface SessionRecord {
  id: string; // sessionId from useSession
  mode: InterviewMode; // coding | behavioral | system-design
  questionTitle: string;
  createdAt: number; // Date.now()
  result: ScorecardData;
}

const KEY = "interview-sim:history:v1";

/** Newest-first window freestyle may feed the coach. A cap, not a rank. */
export const FREESTYLE_HISTORY_LIMIT = 3;

/** All persistence is on-device and client-only: on the server (SSR) there is
 * no localStorage, so every reader returns empty and every writer is a no-op. */
function store(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Newest first. Tolerates absent, malformed, or non-array storage → []. */
export function listSessions(): SessionRecord[] {
  const ls = store();
  if (!ls) return [];
  try {
    const parsed = JSON.parse(ls.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? (parsed as SessionRecord[]) : [];
  } catch {
    return [];
  }
}

function write(records: SessionRecord[]): void {
  const ls = store();
  if (!ls) return;
  try {
    ls.setItem(KEY, JSON.stringify(records));
  } catch {
    // Quota/serialization failures are swallowed: history is best-effort and
    // must never break a live session.
  }
  emit();
}

// --- React external-store glue -------------------------------------------
// A cached, referentially-stable snapshot so `useSyncExternalStore` can read
// localStorage without a hydration mismatch or an effect that sets state.
const listeners = new Set<() => void>();
let snapshot: SessionRecord[] | null = null;
const SERVER_SNAPSHOT: SessionRecord[] = [];

function emit(): void {
  snapshot = null; // invalidate; recomputed lazily on next read
  listeners.forEach((l) => l());
}

export function subscribeSessions(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Stable client snapshot for useSyncExternalStore (recomputed only on change). */
export function sessionsSnapshot(): SessionRecord[] {
  if (snapshot === null) snapshot = listSessions();
  return snapshot;
}

/** Empty, stable server snapshot — SSR never touches localStorage. */
export function sessionsServerSnapshot(): SessionRecord[] {
  return SERVER_SNAPSHOT;
}

/** Prepend the record (newest first); de-dupe by id so a re-save replaces. */
export function saveSession(rec: SessionRecord): void {
  const rest = listSessions().filter((r) => r.id !== rec.id);
  write([rec, ...rest]);
}

export function getRecord(id: string): SessionRecord | undefined {
  return listSessions().find((r) => r.id === id);
}

export function deleteSession(id: string): void {
  write(listSessions().filter((r) => r.id !== id));
}

export function clearSessions(): void {
  const ls = store();
  if (!ls) return;
  try {
    ls.removeItem(KEY);
  } catch {
    // no-op
  }
  emit();
}
