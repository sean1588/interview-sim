"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import Scorecard from "@/components/Scorecard";
import {
  subscribeSessions,
  sessionsSnapshot,
  sessionsServerSnapshot,
  deleteSession,
  clearSessions,
  type SessionRecord,
} from "@/lib/history";

const MODE_LABEL: Record<SessionRecord["mode"], string> = {
  coding: "Coding",
  behavioral: "Behavioral",
  "system-design": "System Design",
};

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hr${hr === 1 ? "" : "s"} ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day} day${day === 1 ? "" : "s"} ago`;
  return new Date(ts).toLocaleDateString();
}

export default function HistoryPage() {
  // localStorage is client-only. useSyncExternalStore reads it without a
  // hydration mismatch: SSR gets the empty server snapshot, the client
  // resubscribes to the real store after mount and re-renders on any change.
  const sessions = useSyncExternalStore(
    subscribeSessions,
    sessionsSnapshot,
    sessionsServerSnapshot
  );
  const [openId, setOpenId] = useState<string | null>(null);

  const open = sessions.find((s) => s.id === openId) ?? null;

  const handleDelete = (id: string) => {
    deleteSession(id);
    if (openId === id) setOpenId(null);
  };

  const handleClearAll = () => {
    if (!confirm("Delete all saved sessions? This cannot be undone.")) return;
    clearSessions();
    setOpenId(null);
  };

  return (
    <div className="flex-1 bg-app">
      <div className="mx-auto max-w-3xl px-6 pt-10 pb-24">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Breadcrumbs
              items={[{ label: "Home", href: "/" }, { label: "Past Sessions" }]}
            />
            <h1 className="mt-3 font-serif text-[40px] font-semibold leading-none tracking-tight text-ink">
              Past Sessions
            </h1>
            <p className="mt-3 font-serif text-[16px] italic text-muted">
              Graded interviews, saved on this device. Reopen a scorecard any time.
            </p>
          </div>
          {sessions.length > 0 && (
            <button
              onClick={handleClearAll}
              className="shrink-0 rounded-md border border-edge px-3 py-1.5 font-sans text-[12px] text-ink-muted transition-colors hover:border-cognac/40 hover:text-cognac-text"
            >
              Clear all
            </button>
          )}
        </div>

        {sessions.length === 0 ? (
          <div className="rounded-[10px] border border-dashed border-edge bg-chip px-6 py-16 text-center">
            <p className="font-serif text-[18px] text-ink-body">No past sessions yet</p>
            <p className="mt-2 font-serif text-[15px] italic text-muted">
              Finish a coding, behavioral, or system design interview and its scorecard
              lands here.
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex items-center gap-1 font-sans text-[13px] font-medium text-cognac-text"
            >
              Start a practice interview <span aria-hidden>→</span>
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {sessions.map((s) => (
              <li key={s.id}>
                <div className="group flex items-center gap-4 rounded-[10px] border border-edge bg-chip p-5 transition hover:border-cognac/40">
                  <button
                    onClick={() => setOpenId(s.id)}
                    className="flex-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-cognac/40"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-gold/[0.16] px-2.5 py-0.5 font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-gold-text">
                        {MODE_LABEL[s.mode]}
                      </span>
                      <span className="font-sans text-[12px] text-faint">
                        {relativeTime(s.createdAt)}
                      </span>
                    </div>
                    <h3 className="mt-2 font-serif text-[20px] font-semibold text-ink transition group-hover:text-cognac-text">
                      {s.questionTitle}
                    </h3>
                    <div className="mt-1.5 flex items-center gap-2 font-sans text-[13px] text-ink-muted">
                      <span className="font-medium text-ink">{s.result.recommendation}</span>
                      <span aria-hidden>·</span>
                      <span>
                        Overall <span className="font-semibold text-ink">{s.result.overall}/5</span>
                      </span>
                    </div>
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    aria-label={`Delete ${s.questionTitle}`}
                    className="shrink-0 rounded-md px-2 py-1 font-sans text-[12px] text-faint transition-colors hover:text-cognac-text"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {open && <Scorecard data={open.result} mode={open.mode} onClose={() => setOpenId(null)} />}
    </div>
  );
}
