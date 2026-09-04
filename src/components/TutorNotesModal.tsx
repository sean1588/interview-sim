"use client";

import { useEffect } from "react";
import type { TutorNote } from "@/lib/tutor-notes";

function entryDate(createdAt: number): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(createdAt));
}

export default function TutorNotesModal({
  notes,
  onClose,
}: {
  notes: TutorNote[];
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#2c2722]/55 p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutor-notes-title"
        className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-[10px] border border-edge bg-frame text-ink"
        style={{ boxShadow: "0 30px 70px rgba(60,40,20,.28)" }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-section bg-raised px-6 py-4">
          <div>
            <h2
              id="tutor-notes-title"
              className="font-serif text-[21px] font-semibold text-ink"
            >
              Tutor notes
            </h2>
            <p className="mt-0.5 font-sans text-[12px] text-faint">
              Your coach&apos;s private journal from freestyle sessions
            </p>
          </div>
          <button
            autoFocus
            onClick={onClose}
            className="rounded-md px-2 py-1 font-sans text-[13px] text-ink-muted transition-colors hover:text-ink"
          >
            ✕ Close
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          {notes.length === 0 ? (
            <p className="font-serif text-[16px] italic text-faint">
              No tutor notes yet.
            </p>
          ) : (
            <div className="space-y-5">
              {notes.map((note) => (
                <article
                  key={note.id}
                  className="rounded-lg border border-hair bg-chip px-4 py-3.5"
                >
                  <time
                    dateTime={new Date(note.createdAt).toISOString()}
                    className="font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-[#a8754a]"
                  >
                    {entryDate(note.createdAt)}
                  </time>
                  <p className="mt-2 whitespace-pre-wrap font-serif text-[16px] leading-[1.6] text-ink-body">
                    {note.text}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
