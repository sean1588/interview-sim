/** Which OpenRouter model the conversation and the assessment run on — a single
 * on-device preference shared by every session (interviews, learning, career),
 * not a per-session flag. Chosen from the model picker on the home page.
 *
 * The default lives here rather than in `openrouter.ts` so the one string is
 * shared by the server calls that send it and the client store that persists
 * it: this module is plain, dependency-free, and safe to import from either
 * side. Speech (transcription and TTS) is deliberately NOT affected — those
 * endpoints take their own fixed models.
 */

/** The model every call uses until the user picks another one. */
export const DEFAULT_MODEL = "google/gemini-3.1-pro-preview";

const KEY = "interview-sim:model:v1";

/** All persistence is on-device and client-only: on the server (SSR) there is
 * no localStorage, so every reader returns the default and every writer is a
 * no-op. */
function store(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** The saved model id. Tolerates absent, empty, or blank storage → the default. */
export function savedModel(): string {
  const ls = store();
  if (!ls) return DEFAULT_MODEL;
  try {
    return resolveModel(ls.getItem(KEY));
  } catch {
    return DEFAULT_MODEL;
  }
}

/** Best-effort: a quota failure must never break the picker or a live session. */
export function setSavedModel(model: string): void {
  const ls = store();
  if (!ls) return;
  try {
    const id = model.trim();
    if (id && id !== DEFAULT_MODEL) ls.setItem(KEY, id);
    else ls.removeItem(KEY); // back to the default → no stored override
  } catch {
    // swallow and continue
  }
  emit();
}

/** Normalize a model id off the wire (a form field, a JSON body, storage) to a
 * usable one: anything absent, non-string, or blank falls back to the default.
 * The API routes validate their `model` field through this. */
export function resolveModel(raw: unknown): string {
  return typeof raw === "string" && raw.trim() ? raw.trim() : DEFAULT_MODEL;
}

// --- React external-store glue -------------------------------------------
// Mirrors layout-prefs.ts: a cached snapshot avoids re-reading localStorage on
// every render, while `useSyncExternalStore` stays in sync on changes.
const listeners = new Set<() => void>();
let snapshot: string | null = null;

function emit(): void {
  snapshot = null; // invalidate; recomputed lazily on next read
  listeners.forEach((l) => l());
}

export function subscribeModel(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Stable client snapshot for useSyncExternalStore (recomputed only on change). */
export function modelSnapshot(): string {
  if (snapshot === null) snapshot = savedModel();
  return snapshot;
}

/** Stable server snapshot. It must be the default, not a read of storage: SSR
 * renders the default, so the first client render has to agree with it or
 * hydration mismatches. The saved choice lands on the commit after hydration. */
export function modelServerSnapshot(): string {
  return DEFAULT_MODEL;
}
