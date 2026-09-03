"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import {
  subscribeSessions,
  sessionsSnapshot,
  sessionsServerSnapshot,
} from "@/lib/history";

/** Home deep-link into the history-aware freestyle session. Hidden when there
 * are no scorecards — empty history must not invent a coach. */
export default function WeakLinesEntry() {
  const sessions = useSyncExternalStore(
    subscribeSessions,
    sessionsSnapshot,
    sessionsServerSnapshot
  );
  if (sessions.length === 0) return null;

  return (
    <Link
      href="/freestyle?focus=weak-lines"
      className="group mb-4 block rounded-[10px] border border-cognac/40 bg-chip p-6 transition hover:border-cognac/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-cognac/40"
    >
      <div className="flex items-start gap-4">
        <div className="mt-0.5 text-3xl">🎯</div>
        <div className="flex-1">
          <h2 className="font-serif text-[22px] font-semibold text-ink transition group-hover:text-cognac-text">
            Work on my weak lines
          </h2>
          <p className="mt-1.5 font-serif text-[16px] font-medium leading-[1.55] text-ink-body">
            Open freestyle with your recent scorecards. Ask what to work on —
            the coach assigns one drill from those cards.
          </p>
          <div className="mt-4 inline-flex items-center gap-1 font-sans text-[13px] font-medium text-cognac-text">
            Start session <span aria-hidden>→</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
