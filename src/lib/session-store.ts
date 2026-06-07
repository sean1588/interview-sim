// Per-session interview state. Replaces the old module-global conversation
// history so multiple interviews (eventually multiple users) don't share one
// transcript. Still in-memory — fine for the local spike; swap for a real store
// (Redis/DB) when we deploy.

import type { ChatMessage } from "./openrouter";

export type { ChatMessage };

export interface SessionState {
  history: ChatMessage[];
  problemId: string | null;
  createdAt: number;
  lastActive: number;
}

const sessions = new Map<string, SessionState>();

// Evict sessions untouched for this long so memory doesn't grow unbounded.
const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2h

function sweep() {
  const now = Date.now();
  for (const [id, s] of sessions) {
    if (now - s.lastActive > SESSION_TTL_MS) sessions.delete(id);
  }
}

export function getSession(id: string): SessionState {
  sweep();
  let s = sessions.get(id);
  if (!s) {
    s = {
      history: [],
      problemId: null,
      createdAt: Date.now(),
      lastActive: Date.now(),
    };
    sessions.set(id, s);
  }
  s.lastActive = Date.now();
  return s;
}

/** Start a fresh interview for this session (called on kickoff). */
export function resetSession(id: string, problemId: string | null): SessionState {
  const s: SessionState = {
    history: [],
    problemId,
    createdAt: Date.now(),
    lastActive: Date.now(),
  };
  sessions.set(id, s);
  return s;
}
