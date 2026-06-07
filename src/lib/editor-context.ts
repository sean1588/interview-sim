// The live editor state appended to a candidate's turn so the interviewer LLM
// "sees" their code, plus the inverse that strips it back out for a clean
// transcript. The producer (chat route) and consumer (assess route) MUST share
// these — a marker that drifts between them silently corrupts the transcript.

const MARKER = "\n\n[Editor state";

export interface EditorContext {
  code?: string;
  language?: string;
  lastRun?: string;
}

/** Build the bracketed editor annotation, or "" when there's nothing to show. */
export function formatEditorContext({ code = "", language = "", lastRun = "" }: EditorContext): string {
  if (!code && !lastRun) return "";
  const head = `${MARKER} — ${language || "code"}:\n${code || "(empty)"}\n]`;
  const run = lastRun ? `\n[Latest run output:\n${lastRun}\n]` : "";
  return head + run;
}

/** Remove the editor annotation (and everything after it) from a turn. */
export function stripEditorContext(content: string): string {
  const i = content.indexOf(MARKER);
  return (i === -1 ? content : content.slice(0, i)).trim();
}
