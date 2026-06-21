"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft } from "./icons";

/** Seconds since mount, formatted mm:ss — drives the LIVE clock. The session is
 * "live" from the moment you enter the room. */
function useElapsed(): string {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const mm = Math.floor(secs / 60)
    .toString()
    .padStart(2, "0");
  const ss = (secs % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
}

export interface SessionFrameProps {
  /** Breadcrumb root, e.g. { label: "Studio", href: "/" }. */
  root: { label: string; href: string };
  /** Current screen name shown after the breadcrumb separator. */
  title: string;
  /** Optional pill after the title, e.g. "Module 2 · Lesson 1". */
  pill?: string;
  /** End button label, e.g. "End Interview". */
  endLabel: string;
  /** Busy label shown on the End button while assessing/wrapping up. */
  endBusyLabel?: string;
  ending?: boolean;
  onEnd: () => void;
  /** Optional error surfaced beside the End button. */
  error?: string;
  /** Mode-specific header controls (selectors, custom-question…), left of End. */
  controls?: ReactNode;
  /** The session body — the flex row of columns. */
  children: ReactNode;
}

/** The shared framed-window shell every live screen sits inside: a centered cream
 * card on the sand background, a 62px header (breadcrumb · LIVE clock · controls ·
 * End), then the column body. Mode differences arrive as data + the `controls`
 * slot — the frame itself never branches on mode. */
export default function SessionFrame({
  root,
  title,
  pill,
  endLabel,
  endBusyLabel,
  ending = false,
  onEnd,
  error,
  controls,
  children,
}: SessionFrameProps) {
  const elapsed = useElapsed();

  return (
    <div className="h-screen w-full bg-app flex justify-center p-3 sm:p-5 overflow-hidden">
      <div
        className="w-full max-w-[1440px] flex flex-col bg-frame text-ink rounded-[7px] border border-edge overflow-hidden"
        style={{ boxShadow: "0 30px 70px rgba(60,40,20,.22)" }}
      >
        {/* Header */}
        <header className="h-[62px] flex-none flex items-center justify-between px-6 bg-raised border-b border-section">
          <div className="flex items-center gap-3.5 min-w-0">
            <Link
              href={root.href}
              className="inline-flex items-center gap-2 text-muted hover:text-ink transition-colors text-sm"
            >
              <ChevronLeft size={15} />
              {root.label}
            </Link>
            <span className="text-[#cabfa6]">/</span>
            <span className="font-serif font-semibold text-[17px] text-ink truncate">
              {title}
            </span>
            {pill && (
              <span className="ml-1.5 flex-none rounded-full border border-gold/35 bg-gold/[0.13] px-2.5 py-[3px] font-sans text-[10px] font-medium uppercase tracking-[0.08em] text-gold-text">
                {pill}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/[0.13] px-2.5 py-[5px] font-sans text-[11px] font-medium tracking-[0.1em] text-gold-text">
              <span className="h-[7px] w-[7px] rounded-full bg-gold animate-livedot" />
              LIVE · {elapsed}
            </span>
            {controls}
            {error && <span className="text-red-700 text-xs max-w-[200px] truncate">{error}</span>}
            <button
              onClick={onEnd}
              disabled={ending}
              className={`rounded-[7px] px-4 py-[9px] font-sans text-[13px] font-medium transition-colors ${
                ending
                  ? "cursor-not-allowed bg-edge text-faint"
                  : "bg-cognac text-[#fbf3e7] hover:bg-cognac/90"
              }`}
            >
              {ending ? (endBusyLabel ?? "Ending…") : endLabel}
            </button>
          </div>
        </header>

        {/* Body */}
        <div className="flex-1 min-h-0 flex">{children}</div>
      </div>
    </div>
  );
}
