"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import {
  subscribeSessions,
  sessionsSnapshot,
  sessionsServerSnapshot,
} from "@/lib/history";
import { nextSession } from "@/lib/next-session";

/** Featured start on home: the next session, picked in place from history. */
export default function NextSessionLine() {
  // Same localStorage subscription as /history — SSR sees [], client hydrates.
  const sessions = useSyncExternalStore(
    subscribeSessions,
    sessionsSnapshot,
    sessionsServerSnapshot
  );
  const next = nextSession(sessions);

  return (
    <Link
      href={next.href}
      data-next-session={next.kind}
      className="group mb-4 block rounded-[10px] border border-cognac/40 bg-chip p-6 transition hover:border-cognac/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-cognac/40"
    >
      <div className="flex items-start gap-4">
        <div className="mt-0.5 text-3xl">{next.icon}</div>
        <div className="flex-1">
          <h2 className="font-serif text-[22px] font-semibold text-ink transition group-hover:text-cognac-text">
            {next.title}
          </h2>
          {next.description ? (
            <p className="mt-1.5 font-serif text-[16px] font-medium leading-[1.55] text-ink-body">
              {next.description}
            </p>
          ) : null}
          <div className="mt-4 inline-flex items-center gap-1 font-sans text-[13px] font-medium text-cognac-text">
            {next.cta} <span aria-hidden>→</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
