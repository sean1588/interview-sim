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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 sticky top-0 bg-gray-900">
          <h2 className="text-lg font-semibold text-white">Custom question</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-sm px-2 py-1"
          >
            ✕ Close
          </button>
        </div>

        <div className="p-5 space-y-3">
          <p className="text-sm text-gray-400 leading-relaxed">
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
            className="w-full h-40 resize-none rounded-lg bg-gray-950 border border-gray-700 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-gray-500"
          />
          <p className="text-xs text-gray-600">
            Applies when the session starts. ⌘/Ctrl+Enter to set.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-800">
          {draft.trim() && (
            <button
              onClick={() => {
                onSubmit("");
                onClose();
              }}
              className="mr-auto text-sm text-gray-400 hover:text-white px-3 py-1.5"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="text-sm text-gray-300 hover:text-white px-3 py-1.5 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            className="text-sm font-medium px-4 py-1.5 rounded-lg bg-fuchsia-600 hover:bg-fuchsia-500 text-white"
          >
            Set question
          </button>
        </div>
      </div>
    </div>
  );
}
