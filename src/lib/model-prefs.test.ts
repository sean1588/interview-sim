import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  DEFAULT_MODEL,
  savedModel,
  setSavedModel,
  resolveModel,
  subscribeModel,
  modelSnapshot,
  modelServerSnapshot,
} from "@/lib/model-prefs";

// Mirrors career-store.test.ts / layout-prefs.test.ts: the test env is "node"
// (no window/localStorage), so we stand up a minimal in-memory localStorage on
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

/** Storage that fails every operation — a private-mode / quota-exhausted browser. */
class HostileStorage {
  getItem(): string {
    throw new Error("nope");
  }
  setItem() {
    throw new Error("nope");
  }
  removeItem() {
    throw new Error("nope");
  }
}

const KEY = "interview-sim:model:v1";

function installStorage(ls: unknown = new MemoryStorage()) {
  (globalThis as { window?: unknown }).window = { localStorage: ls };
}

function uninstallStorage() {
  delete (globalThis as { window?: unknown }).window;
}

function seed(value: string) {
  (globalThis as { window?: { localStorage: Storage } }).window!.localStorage.setItem(KEY, value);
}

describe("model-prefs", () => {
  beforeEach(() => {
    installStorage();
    setSavedModel(DEFAULT_MODEL); // clears any override + the snapshot cache
  });
  afterEach(() => uninstallStorage());

  it("defaults to the Gemini model when nothing has been saved", () => {
    expect(savedModel()).toBe(DEFAULT_MODEL);
    expect(DEFAULT_MODEL).toBe("google/gemini-3.1-pro-preview");
  });

  it("saves and reads back a chosen model", () => {
    setSavedModel("anthropic/claude-opus-5");
    expect(savedModel()).toBe("anthropic/claude-opus-5");
  });

  it("is a single slot — a second choice replaces the first", () => {
    setSavedModel("anthropic/claude-opus-5");
    setSavedModel("openai/gpt-5");
    expect(savedModel()).toBe("openai/gpt-5");
  });

  it("selecting the default again drops the stored override", () => {
    setSavedModel("openai/gpt-5");
    setSavedModel(DEFAULT_MODEL);
    expect(savedModel()).toBe(DEFAULT_MODEL);
  });

  it("tolerates a malformed stored value → the default", () => {
    for (const value of ["", "   ", "\n\t"]) {
      seed(value);
      expect(savedModel(), `${JSON.stringify(value)} must not read as a model`).toBe(
        DEFAULT_MODEL
      );
    }
  });

  it("trims surrounding whitespace on the way in and out", () => {
    setSavedModel("  openai/gpt-5  ");
    expect(savedModel()).toBe("openai/gpt-5");
  });

  it("resolveModel validates a field off the wire", () => {
    expect(resolveModel("openai/gpt-5")).toBe("openai/gpt-5");
    expect(resolveModel("  openai/gpt-5 ")).toBe("openai/gpt-5");
    for (const bad of [null, undefined, "", "   ", 42, {}, ["openai/gpt-5"]]) {
      expect(resolveModel(bad), `${JSON.stringify(bad)} must fall back`).toBe(DEFAULT_MODEL);
    }
  });

  it("exposes a snapshot that tracks writes and notifies subscribers", () => {
    let notified = 0;
    const unsubscribe = subscribeModel(() => notified++);

    setSavedModel("openai/gpt-5");
    expect(notified).toBe(1);
    expect(modelSnapshot()).toBe("openai/gpt-5");
    // Referentially stable between writes — useSyncExternalStore requires it.
    expect(modelSnapshot()).toBe(modelSnapshot());

    setSavedModel(DEFAULT_MODEL);
    expect(modelSnapshot()).toBe(DEFAULT_MODEL);
    expect(notified).toBe(2);

    unsubscribe();
    setSavedModel("openai/gpt-5");
    expect(notified).toBe(2);
  });

  it("no throw and the default when storage itself is unavailable", () => {
    installStorage(new HostileStorage());
    expect(() => setSavedModel("openai/gpt-5")).not.toThrow();
    expect(savedModel()).toBe(DEFAULT_MODEL);
  });

  it("SSR guard: no throw and the default when window is undefined", () => {
    uninstallStorage();
    expect(() => setSavedModel("openai/gpt-5")).not.toThrow();
    expect(savedModel()).toBe(DEFAULT_MODEL);
    expect(modelServerSnapshot()).toBe(DEFAULT_MODEL);
  });
});
