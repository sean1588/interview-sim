"use client";

import { useEffect, useState } from "react";

/** Lets a freestyle user type the exact thing they want to work on instead of
 * speaking it. The text rides to the coach as `questionPrompt`; the session
 * opens on it (see getKickoffPrompt / the freestyle system prompt). Submitting
 * an empty box clears the question. */
export default function CustomQuestionModal({
  initialValue,
  onSubmit,
  onClose,
}: {
  initialValue: string;
  onSubmit: (question: string) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(initialValue);

  // Esc-to-close at the document level so it works regardless of which control
  // holds focus. `onClose` is stable while typing (the parent doesn't re-render
  // on the modal's internal draft state), so this won't resubscribe per key.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = () => {
    onSubmit(draft.trim());
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#2c2722]/55 p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-[10px] border border-edge bg-frame text-ink"
        style={{ boxShadow: "0 30px 70px rgba(60,40,20,.28)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-section bg-raised px-6 py-4">
          <h2 className="font-serif text-[21px] font-semibold text-ink">Custom question</h2>
          <button
            onClick={onClose}
            className="rounded-md px-2 py-1 font-sans text-[13px] text-ink-muted transition-colors hover:text-ink"
          >
            ✕ Close
          </button>
        </div>

        <div className="space-y-3 p-6">
          <p className="font-serif text-[16px] leading-[1.6] text-ink-body">
            Tell the coach exactly what to run — paste a coding problem, name a
            system to design, or give a behavioral prompt. The session opens on
            this instead of asking what you&apos;d like to do.
          </p>
          <textarea
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit();
            }}
            placeholder="e.g. Implement an LRU cache with O(1) get and put, then we'll discuss the complexity and edge cases."
            className="h-40 w-full resize-none rounded-lg border border-edge bg-editor px-3 py-2.5 font-mono text-[13px] text-ink-body placeholder:text-faint focus:border-cognac/40 focus:outline-none"
          />
          <p className="font-sans text-[12px] text-faint">
            Applies when the session starts. ⌘/Ctrl+Enter to set.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-section px-6 py-4">
          {draft.trim() && (
            <button
              onClick={() => {
                onSubmit("");
                onClose();
              }}
              className="mr-auto px-3 py-1.5 font-sans text-[13px] text-ink-muted transition-colors hover:text-ink"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 font-sans text-[13px] text-ink-muted transition-colors hover:text-ink"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            className="rounded-lg bg-cognac px-4 py-2 font-sans text-[13px] font-medium text-[#fbf3e7] transition-colors hover:bg-cognac/90"
          >
            Set question
          </button>
        </div>
      </div>
    </div>
  );
}
