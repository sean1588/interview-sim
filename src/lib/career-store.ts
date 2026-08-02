import type { CareerPlanData } from "@/components/CareerPlanCard";

/** The last career plan the coach produced, kept on-device so closing the modal
 * (or reloading the page) doesn't destroy a generated resume. Deliberately a
 * single slot rather than a list: there is one current plan, and a new session
 * supersedes the old one. Graded interviews live in history.ts, which stays
 * single-shape — a career plan is not a ScorecardData. */

const KEY = "interview-sim:career-plan:v1";

/** All persistence is on-device and client-only: on the server (SSR) there is
 * no localStorage, so every reader returns null and every writer is a no-op. */
function store(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** The saved plan, or null. Tolerates absent, malformed, or non-object storage. */
export function loadPlan(): CareerPlanData | null {
  const ls = store();
  if (!ls) return null;
  const raw = ls.getItem(KEY);
  if (raw === null) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as CareerPlanData)
      : null;
  } catch {
    return null;
  }
}

/** Replace the saved plan. Best-effort: a quota or serialization failure must
 * never break the live session or the plan already on screen. */
export function savePlan(plan: CareerPlanData): void {
  const ls = store();
  if (!ls) return;
  try {
    ls.setItem(KEY, JSON.stringify(plan));
  } catch {
    // swallow and continue — the on-device copy is a convenience, not the result
  }
  emit();
}

export function clearPlan(): void {
  const ls = store();
  if (!ls) return;
  try {
    ls.removeItem(KEY);
  } catch {
    // no-op
  }
  emit();
}

// --- React external-store glue -------------------------------------------
// A cached, referentially-stable snapshot so `useSyncExternalStore` can read
// localStorage without a hydration mismatch or an effect that sets state.
const listeners = new Set<() => void>();
let snapshot: CareerPlanData | null = null;
let snapshotValid = false;

function emit(): void {
  snapshotValid = false; // invalidate; recomputed lazily on next read
  listeners.forEach((l) => l());
}

export function subscribePlan(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Stable client snapshot for useSyncExternalStore (recomputed only on change). */
export function planSnapshot(): CareerPlanData | null {
  if (!snapshotValid) {
    snapshot = loadPlan();
    snapshotValid = true;
  }
  return snapshot;
}

/** Empty, stable server snapshot — SSR never touches localStorage. */
export function planServerSnapshot(): CareerPlanData | null {
  return null;
}
