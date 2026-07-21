import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type { ScorecardData } from "@/components/Scorecard";
import type { SessionRecord } from "@/lib/history";
import {
  saveSession,
  listSessions,
  getRecord,
  deleteSession,
  clearSessions,
} from "@/lib/history";

// The test env is "node" (no window/localStorage). We stand up a minimal
// in-memory localStorage on globalThis, mirroring how the browser exposes it.
class MemoryStorage {
  private map = new Map<string, string>();
  getItem(k: string) {
    return this.map.has(k) ? this.map.get(k)! : null;
  }
  setItem(k: string, v: string) {
    this.map.set(k, String(v));
  }
  removeItem(k: string) {
    this.map.delete(k);
  }
}

function installStorage(ls: unknown = new MemoryStorage()) {
  (globalThis as { window?: unknown }).window = { localStorage: ls };
}

function uninstallStorage() {
  delete (globalThis as { window?: unknown }).window;
}

const scorecard = (overall: number): ScorecardData => ({
  recommendation: "Hire",
  overall,
  scores: {},
  strengths: [],
  improvements: [],
  summary: "ok",
});

const rec = (id: string, createdAt: number): SessionRecord => ({
  id,
  mode: "coding",
  questionTitle: `Q ${id}`,
  createdAt,
  result: scorecard(4),
});

describe("history", () => {
  beforeEach(() => installStorage());
  afterEach(() => uninstallStorage());

  it("lists saved sessions newest-first (prepend)", () => {
    saveSession(rec("a", 1));
    saveSession(rec("b", 2));
    saveSession(rec("c", 3));
    expect(listSessions().map((r) => r.id)).toEqual(["c", "b", "a"]);
  });

  it("de-dupes by id, replacing the old record and moving it to front", () => {
    saveSession(rec("a", 1));
    saveSession(rec("b", 2));
    const updated: SessionRecord = { ...rec("a", 99), questionTitle: "new title" };
    saveSession(updated);
    const list = listSessions();
    expect(list.map((r) => r.id)).toEqual(["a", "b"]);
    expect(list[0].questionTitle).toBe("new title");
    expect(list[0].createdAt).toBe(99);
  });

  it("getRecord returns the matching record or undefined", () => {
    saveSession(rec("a", 1));
    expect(getRecord("a")?.questionTitle).toBe("Q a");
    expect(getRecord("missing")).toBeUndefined();
  });

  it("deleteSession removes only the named record", () => {
    saveSession(rec("a", 1));
    saveSession(rec("b", 2));
    deleteSession("a");
    expect(listSessions().map((r) => r.id)).toEqual(["b"]);
  });

  it("clearSessions empties the store", () => {
    saveSession(rec("a", 1));
    saveSession(rec("b", 2));
    clearSessions();
    expect(listSessions()).toEqual([]);
  });

  it("tolerates malformed storage → []", () => {
    installStorage();
    (globalThis as { window?: { localStorage: Storage } }).window!.localStorage.setItem(
      "interview-sim:history:v1",
      "{not json"
    );
    expect(listSessions()).toEqual([]);
  });

  it("tolerates non-array JSON → []", () => {
    (globalThis as { window?: { localStorage: Storage } }).window!.localStorage.setItem(
      "interview-sim:history:v1",
      JSON.stringify({ foo: 1 })
    );
    expect(listSessions()).toEqual([]);
  });

  it("SSR guard: no throw and empty/no-op when window is undefined", () => {
    uninstallStorage(); // simulate server render
    expect(() => saveSession(rec("a", 1))).not.toThrow();
    expect(listSessions()).toEqual([]);
    expect(getRecord("a")).toBeUndefined();
    expect(() => deleteSession("a")).not.toThrow();
    expect(() => clearSessions()).not.toThrow();
  });
});
