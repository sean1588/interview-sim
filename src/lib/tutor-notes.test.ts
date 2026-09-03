import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  appendTutorNote,
  listTutorNotes,
  parseTutorNotes,
  TUTOR_NOTES_STORAGE_KEY,
  type TutorNote,
} from "@/lib/tutor-notes";

class MemoryStorage {
  private map = new Map<string, string>();

  getItem(key: string) {
    return this.map.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.map.set(key, String(value));
  }
}

function installStorage(ls: unknown = new MemoryStorage()) {
  (globalThis as { window?: unknown }).window = { localStorage: ls };
}

function uninstallStorage() {
  delete (globalThis as { window?: unknown }).window;
}

const note = (id: string, text = `Note ${id}`): TutorNote => ({
  id,
  createdAt: Date.UTC(2026, 8, Number(id) || 1),
  text,
});

describe("tutor notes journal", () => {
  beforeEach(() => installStorage());
  afterEach(() => uninstallStorage());

  it("appends entries in journal order without overwriting earlier notes", () => {
    expect(appendTutorNote(note("1"))).toBe(true);
    expect(appendTutorNote(note("2"))).toBe(true);

    expect(listTutorNotes()).toEqual([note("1"), note("2")]);
  });

  it("allows only one entry for a session id", () => {
    expect(appendTutorNote(note("1", "first"))).toBe(true);
    expect(appendTutorNote(note("1", "replacement"))).toBe(false);
    expect(listTutorNotes()).toEqual([note("1", "first")]);
  });

  it("keeps only cheap, valid entry shapes from storage", () => {
    const raw = JSON.stringify([
      note("1"),
      { id: "missing-date", text: "invalid" },
      { id: "blank", createdAt: 1, text: "  " },
      "not an entry",
    ]);
    (globalThis as { window?: { localStorage: Storage } }).window!.localStorage.setItem(
      TUTOR_NOTES_STORAGE_KEY,
      raw
    );

    expect(listTutorNotes()).toEqual([note("1")]);
    expect(parseTutorNotes("{bad json")).toEqual([]);
    expect(parseTutorNotes(JSON.stringify({ id: "not-array" }))).toEqual([]);
  });

  it("is empty and safe during server rendering", () => {
    uninstallStorage();
    expect(listTutorNotes()).toEqual([]);
    expect(appendTutorNote(note("1"))).toBe(false);
  });
});
