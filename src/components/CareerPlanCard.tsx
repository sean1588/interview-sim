"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

/** One suggested software engineering track, with the case for it. */
export interface CareerRole {
  title: string;
  whyFit: string;
  toStrengthen: string;
}

/** The career coach's end-of-session output (the career-mode counterpart to
 * Scorecard and RecapCard). No scores, no recommendation — a read of the user's
 * experience plus the artifacts they came for. */
export interface CareerPlanData {
  summary: string;
  strengths: string[];
  roles: CareerRole[];
  resumeMarkdown: string;
  jobSearchPrompt: string;
}

/** Copy `text` to the clipboard, showing "Copied" for a moment afterwards. Each
 * button owns its own transient state, so two of them on one card can't fight. */
function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return; // no clipboard permission — leave the label alone rather than lie
    }
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1600);
  };

  return (
    <button onClick={copy} aria-label={label} className={ACTION_CLASS}>
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

/** Hand the markdown to the browser as a downloadable file. The object URL is
 * revoked straight after the click — nothing else references it. */
function downloadMarkdown(markdown: string) {
  const url = URL.createObjectURL(new Blob([markdown], { type: "text/markdown" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "resume.md";
  link.click();
  URL.revokeObjectURL(url);
}

const ACTION_CLASS =
  "rounded-[6px] border border-edge bg-chip px-2.5 py-1 font-sans text-[11px] text-ink-muted transition-colors hover:border-cognac/40 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cognac/40";

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-sans text-[12px] font-semibold uppercase tracking-[0.1em] text-ink-muted">
      {children}
    </h3>
  );
}

export default function CareerPlanCard({
  data,
  onClose,
}: {
  data: CareerPlanData;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2c2722]/55 p-6">
      <div
        className="w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-[10px] border border-edge bg-frame text-ink"
        style={{ boxShadow: "0 30px 70px rgba(60,40,20,.28)" }}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-section bg-raised px-6 py-4">
          <h2 className="font-serif text-[21px] font-semibold text-ink">Your Career Plan</h2>
          <button
            onClick={onClose}
            className="rounded-md px-2 py-1 font-sans text-[13px] text-ink-muted transition-colors hover:text-ink"
          >
            ✕ Close
          </button>
        </div>

        <div className="space-y-6 p-6">
          <p className="font-serif text-[16.5px] leading-[1.6] text-ink-body">{data.summary}</p>

          {data.strengths?.length > 0 && (
            <div>
              <SectionHeading>Strengths</SectionHeading>
              <ul className="markdown mt-1 list-disc space-y-0.5 pl-5">
                {data.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {data.roles?.length > 0 && (
            <div>
              <SectionHeading>Roles to target</SectionHeading>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                {data.roles.map((role, i) => (
                  <div key={i} className="rounded-[8px] border border-edge bg-chip p-4">
                    <div className="flex items-baseline gap-2">
                      <span className="font-sans text-[10px] font-medium text-faint">{i + 1}</span>
                      <h4 className="font-serif text-[17px] font-semibold text-ink">{role.title}</h4>
                    </div>
                    <p className="mt-1.5 font-serif text-[15px] leading-[1.55] text-ink-body">
                      {role.whyFit}
                    </p>
                    {role.toStrengthen && (
                      <p className="mt-2 font-sans text-[12px] leading-[1.5] text-cognac-text">
                        To strengthen: {role.toStrengthen}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.resumeMarkdown && (
            <div>
              <div className="flex items-center justify-between gap-3">
                <SectionHeading>Resume draft</SectionHeading>
                <div className="flex gap-1.5">
                  <CopyButton text={data.resumeMarkdown} label="Copy the resume markdown" />
                  <button
                    onClick={() => downloadMarkdown(data.resumeMarkdown)}
                    className={ACTION_CLASS}
                  >
                    Download .md
                  </button>
                </div>
              </div>
              <div className="markdown mt-2 rounded-[8px] border border-edge bg-chip px-5 py-4">
                <ReactMarkdown>{data.resumeMarkdown}</ReactMarkdown>
              </div>
            </div>
          )}

          {data.jobSearchPrompt && (
            <div>
              <div className="flex items-center justify-between gap-3">
                <SectionHeading>Job-search prompt</SectionHeading>
                <CopyButton text={data.jobSearchPrompt} label="Copy the job-search prompt" />
              </div>
              <p className="mt-1 font-sans text-[11px] text-faint">
                Paste this into ChatGPT, Claude, or any assistant with web search to go find roles.
              </p>
              <pre className="mt-2 whitespace-pre-wrap rounded-[8px] border border-edge bg-chip px-5 py-4 font-mono text-[12.5px] leading-[1.6] text-ink-body">
                {data.jobSearchPrompt}
              </pre>
            </div>
          )}

          <p className="border-t border-section pt-3 font-sans text-[11px] leading-[1.6] text-faint">
            This draft was built entirely from what you said in the conversation and pasted into
            your background pane — nothing was invented. Read it through and fill in every
            bracketed placeholder before you send it anywhere.
          </p>
        </div>
      </div>
    </div>
  );
}
