import { describe, it, expect } from "vitest";
import { PROBLEMS, getProblem } from "./index";

const DIFFICULTIES = new Set(["Easy", "Medium", "Hard"]);
const LANGUAGES = new Set(["python", "javascript", "typescript"]);
const RUNNABLE = new Set(["python", "javascript"]);

describe("problem bank invariants", () => {
  it("has a healthy number of problems", () => {
    expect(PROBLEMS.length).toBeGreaterThanOrEqual(40);
  });

  it("has unique, kebab-case ids", () => {
    const ids = PROBLEMS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("every problem is well-formed", () => {
    for (const p of PROBLEMS) {
      expect(p.title.trim(), p.id).not.toBe("");
      expect(p.prompt.trim(), p.id).not.toBe("");
      expect(DIFFICULTIES.has(p.difficulty), `${p.id} difficulty`).toBe(true);

      const langs = Object.keys(p.starterCode);
      expect(langs.length, `${p.id} has no languages`).toBeGreaterThan(0);
      for (const l of langs) expect(LANGUAGES.has(l), `${p.id} lang ${l}`).toBe(true);

      // Must be runnable in at least one language we can execute.
      expect(langs.some((l) => RUNNABLE.has(l)), `${p.id} not runnable`).toBe(true);

      // Every declared starter is non-empty.
      for (const [l, code] of Object.entries(p.starterCode)) {
        expect((code ?? "").trim(), `${p.id}:${l} empty`).not.toBe("");
      }
    }
  });

  it("every JavaScript starter is syntactically valid", () => {
    for (const p of PROBLEMS) {
      const js = p.starterCode.javascript;
      if (!js) continue;
      // Construct (don't call) — throws SyntaxError on invalid JS, without
      // executing the example console.log calls.
      expect(() => new Function(js), `${p.id} JS`).not.toThrow();
    }
  });

  it("getProblem resolves known ids and rejects unknown ones", () => {
    expect(getProblem(PROBLEMS[0].id)?.id).toBe(PROBLEMS[0].id);
    expect(getProblem("does-not-exist")).toBeUndefined();
  });
});
