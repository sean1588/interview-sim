export interface TutorNote {
  id: string;
  createdAt: number;
  text: string;
}

export const TUTOR_NOTES_STORAGE_KEY = "interview-sim:tutor-notes:v1";

function isTutorNote(value: unknown): value is TutorNote {
  if (!value || typeof value !== "object") return false;
  const note = value as Record<string, unknown>;
  return (
    typeof note.id === "string" &&
    typeof note.createdAt === "number" &&
    Number.isFinite(note.createdAt) &&
    typeof note.text === "string" &&
    note.text.trim().length > 0
  );
}

function store(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function parseTutorNotes(raw: string | null | undefined): TutorNote[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter(isTutorNote) : [];
  } catch {
    return [];
  }
}

export function listTutorNotes(): TutorNote[] {
  const ls = store();
  if (!ls) return [];
  try {
    return parseTutorNotes(ls.getItem(TUTOR_NOTES_STORAGE_KEY));
  } catch {
    return [];
  }
}

export function appendTutorNote(note: TutorNote): boolean {
  if (!isTutorNote(note)) return false;
  const ls = store();
  if (!ls) return false;
  const journal = listTutorNotes();
  if (journal.some((entry) => entry.id === note.id)) return false;
  try {
    ls.setItem(TUTOR_NOTES_STORAGE_KEY, JSON.stringify([...journal, note]));
    return true;
  } catch {
    return false;
  }
}
