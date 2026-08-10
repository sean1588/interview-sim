/** Whether session/lesson screens render at full viewport width instead of the
 * default 1440px cap — a single on-device display preference shared by every
 * SessionFrame instance (interviews and lessons alike), not a per-session flag.
 */

const KEY = "interview-sim:layout:expanded:v1";

/** All persistence is on-device and client-only: on the server (SSR) there is
 * no localStorage, so every reader returns false and every writer is a no-op. */
function store(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Tolerates absent or malformed storage → false. */
export function isExpanded(): boolean {
  const ls = store();
  if (!ls) return false;
  try {
    return ls.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

/** Best-effort: a quota or serialization failure must never break a live session. */
export function setExpanded(value: boolean): void {
  const ls = store();
  if (!ls) return;
  try {
    if (value) ls.setItem(KEY, "1");
    else ls.removeItem(KEY);
  } catch {
    // swallow and continue
  }
  emit();
}

// --- React external-store glue -------------------------------------------
// A cached snapshot to avoid re-reading localStorage on every render, while
// letting `useSyncExternalStore` stay in sync on changes (no hydration mismatch).
const listeners = new Set<() => void>();
let snapshot: boolean | null = null;

function emit(): void {
  snapshot = null; // invalidate; recomputed lazily on next read
  listeners.forEach((l) => l());
}

export function subscribeExpanded(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Stable client snapshot for useSyncExternalStore (recomputed only on change). */
export function expandedSnapshot(): boolean {
  if (snapshot === null) snapshot = isExpanded();
  return snapshot;
}

/** Stable server snapshot — SSR never touches localStorage. */
export function expandedServerSnapshot(): boolean {
  return false;
}
