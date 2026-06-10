// Live workspace context appended to a candidate's spoken turn so the
// interviewer LLM "sees" it: editor state (coding) and freeform notes
// (behavioral / system-design). Also the inverse that strips every annotation
// back out for a clean transcript. The producer (chat route) and consumer
// (assess route) MUST share these — a marker that drifts between them
// silently corrupts the transcript.

const EDITOR_MARKER = "\n\n[Editor state";
const NOTES_MARKER = "\n\n[Candidate notes:";

export interface EditorContext {
  code?: string;
  language?: string;
  lastRun?: string;
}

/** Build the bracketed editor annotation, or "" when there's nothing to show. */
export function formatEditorContext({ code = "", language = "", lastRun = "" }: EditorContext): string {
  if (!code && !lastRun) return "";
  const head = `${EDITOR_MARKER} — ${language || "code"}:\n${code || "(empty)"}\n]`;
  const run = lastRun ? `\n[Latest run output:\n${lastRun}\n]` : "";
  return head + run;
}

/** Build the bracketed notes annotation, or "" when the notes are empty. */
export function formatNotesContext(notes: string): string {
  if (!notes.trim()) return "";
  return `${NOTES_MARKER}\n${notes}\n]`;
}

/** Remove every workspace annotation (and everything after the first) from a turn. */
export function stripTurnContext(content: string): string {
  const positions = [EDITOR_MARKER, NOTES_MARKER]
    .map((m) => content.indexOf(m))
    .filter((i) => i !== -1);
  if (positions.length === 0) return content.trim();
  return content.slice(0, Math.min(...positions)).trim();
}
