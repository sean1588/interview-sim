import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type { CareerPlanData } from "@/components/CareerPlanCard";
import {
  savePlan,
  loadPlan,
  clearPlan,
  planSnapshot,
  planServerSnapshot,
  subscribePlan,
} from "@/lib/career-store";

// Mirrors history.test.ts: the test env is "node" (no window/localStorage), so
// we stand up a minimal in-memory localStorage on globalThis.
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

const KEY = "interview-sim:career-plan:v1";

function installStorage(ls: unknown = new MemoryStorage()) {
  (globalThis as { window?: unknown }).window = { localStorage: ls };
}

function uninstallStorage() {
  delete (globalThis as { window?: unknown }).window;
}

function seed(value: string) {
  (globalThis as { window?: { localStorage: Storage } }).window!.localStorage.setItem(KEY, value);
}

const plan = (summary: string): CareerPlanData => ({
  summary,
  strengths: ["Ships infrastructure end to end"],
  roles: [{ title: "Platform Engineer", whyFit: "Ran the deploy pipeline", toStrengthen: "Kubernetes depth" }],
  resumeMarkdown: "# Jane Doe\n\n- Built the thing",
  jobSearchPrompt: "Find me senior platform roles.",
});

describe("career-store", () => {
  beforeEach(() => {
    installStorage();
    clearPlan(); // also invalidates the module-level snapshot cache
  });
  afterEach(() => uninstallStorage());

  it("saves a plan and reads it back", () => {
    savePlan(plan("A backend engineer"));
    expect(loadPlan()?.summary).toBe("A backend engineer");
    expect(loadPlan()?.roles[0].title).toBe("Platform Engineer");
  });

  it("is a single slot — a second save replaces the first", () => {
    savePlan(plan("first"));
    savePlan(plan("second"));
    expect(loadPlan()?.summary).toBe("second");
  });

  it("returns null when nothing has been saved", () => {
    expect(loadPlan()).toBeNull();
  });

  it("tolerates malformed storage → null", () => {
    seed("{not json");
    expect(loadPlan()).toBeNull();
  });

  it("tolerates non-object JSON → null", () => {
    for (const value of ['"a string"', "42", "null", JSON.stringify([1, 2])]) {
      seed(value);
      expect(loadPlan(), `${value} must not parse as a plan`).toBeNull();
    }
  });

  it("clearPlan empties the slot", () => {
    savePlan(plan("A backend engineer"));
    clearPlan();
    expect(loadPlan()).toBeNull();
  });

  it("exposes a snapshot that tracks writes and notifies subscribers", () => {
    let notified = 0;
    const unsubscribe = subscribePlan(() => notified++);

    savePlan(plan("A backend engineer"));
    expect(notified).toBe(1);
    expect(planSnapshot()?.summary).toBe("A backend engineer");
    // Referentially stable between writes — useSyncExternalStore requires it.
    expect(planSnapshot()).toBe(planSnapshot());

    savePlan(plan("second"));
    expect(planSnapshot()?.summary).toBe("second");

    clearPlan();
    expect(planSnapshot()).toBeNull();
    expect(notified).toBe(3);

    unsubscribe();
    savePlan(plan("third"));
    expect(notified).toBe(3);
  });

  it("SSR guard: no throw and null/no-op when window is undefined", () => {
    uninstallStorage(); // simulate server render
    expect(() => savePlan(plan("A backend engineer"))).not.toThrow();
    expect(loadPlan()).toBeNull();
    expect(() => clearPlan()).not.toThrow();
    expect(planServerSnapshot()).toBeNull();
  });
});
