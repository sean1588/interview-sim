/** Which language a multi-language course is being taken in — an on-device
 * preference per course, so choosing Python for DSA is remembered across visits
 * and across the course overview / lesson room boundary.
 *
 * Only *subject* courses offer a choice (see Course.languages in
 * "@/lib/lessons"); for every other course this store is never consulted.
 */

import type { LanguageId } from "@/lib/problems";

const KEY = (courseId: string) => `interview-sim:learn:language:${courseId}:v1`;

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

/**
 * The saved choice for a course, or null when there isn't one. `allowed` is the
 * course's own `languages`: a saved value that isn't in it — a stale preference
 * from before the course dropped or renamed a language — reads as null so the
 * caller falls back to the default rather than resolving to nothing.
 */
export function savedLanguage(
  courseId: string,
  allowed: readonly LanguageId[]
): LanguageId | null {
  const ls = store();
  if (!ls) return null;
  try {
    const raw = ls.getItem(KEY(courseId));
    return raw && (allowed as readonly string[]).includes(raw) ? (raw as LanguageId) : null;
  } catch {
    return null;
  }
}

/** Best-effort: a quota or serialization failure must never break a live lesson. */
export function setSavedLanguage(courseId: string, language: LanguageId): void {
  const ls = store();
  if (!ls) return;
  try {
    ls.setItem(KEY(courseId), language);
  } catch {
    // swallow and continue
  }
  emit();
}

// --- React external-store glue -------------------------------------------
// Mirrors layout-prefs.ts: a cached snapshot avoids re-reading localStorage on
// every render, while `useSyncExternalStore` stays in sync on changes. Because
// the server snapshot is always null, the first client render matches SSR and
// the saved choice is applied on the commit after hydration — no mismatch.
const listeners = new Set<() => void>();
const snapshots = new Map<string, LanguageId | null>();

function emit(): void {
  snapshots.clear(); // invalidate; recomputed lazily on next read
  listeners.forEach((l) => l());
}

export function subscribeLanguage(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Stable client snapshot for useSyncExternalStore (recomputed only on change). */
export function languageSnapshot(
  courseId: string,
  allowed: readonly LanguageId[]
): LanguageId | null {
  if (!snapshots.has(courseId)) snapshots.set(courseId, savedLanguage(courseId, allowed));
  return snapshots.get(courseId) ?? null;
}

/** Stable server snapshot — SSR never touches localStorage, so it renders the default. */
export function languageServerSnapshot(): LanguageId | null {
  return null;
}
