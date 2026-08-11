import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  isExpanded,
  setExpanded,
  subscribeExpanded,
  expandedSnapshot,
  expandedServerSnapshot,
} from "@/lib/layout-prefs";

// Mirrors history.test.ts / career-store.test.ts: the test env is "node" (no
// window/localStorage), so we stand up a minimal in-memory localStorage on
// globalThis.
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

const KEY = "interview-sim:layout:expanded:v1";

function installStorage(ls: unknown = new MemoryStorage()) {
  (globalThis as { window?: unknown }).window = { localStorage: ls };
}

function uninstallStorage() {
  delete (globalThis as { window?: unknown }).window;
}

function seed(value: string) {
  (globalThis as { window?: { localStorage: Storage } }).window!.localStorage.setItem(KEY, value);
}

describe("layout-prefs", () => {
  beforeEach(() => installStorage());
  afterEach(() => uninstallStorage());

  it("defaults to false when nothing has been saved", () => {
    expect(isExpanded()).toBe(false);
  });

  it("saves and reads back true", () => {
    setExpanded(true);
    expect(isExpanded()).toBe(true);
  });

  it("setExpanded(false) removes the stored value", () => {
    setExpanded(true);
    setExpanded(false);
    expect(isExpanded()).toBe(false);
  });

  it("tolerates a garbage stored value → false", () => {
    seed("not-a-flag");
    expect(isExpanded()).toBe(false);
  });

  it("exposes a snapshot that tracks writes and notifies subscribers", () => {
    let notified = 0;
    const unsubscribe = subscribeExpanded(() => notified++);

    setExpanded(true);
    expect(notified).toBe(1);
    expect(expandedSnapshot()).toBe(true);
    // Referentially stable between writes — useSyncExternalStore requires it.
    expect(expandedSnapshot()).toBe(expandedSnapshot());

    setExpanded(false);
    expect(expandedSnapshot()).toBe(false);
    expect(notified).toBe(2);

    unsubscribe();
    setExpanded(true);
    expect(notified).toBe(2);
  });

  it("SSR guard: no throw and false/no-op when window is undefined", () => {
    uninstallStorage();
    expect(() => setExpanded(true)).not.toThrow();
    expect(isExpanded()).toBe(false);
    expect(expandedServerSnapshot()).toBe(false);
  });
});
