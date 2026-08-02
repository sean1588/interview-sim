import { describe, it, expect } from "vitest";
import * as ts from "typescript";
import { PROBLEMS, PROBLEM_GROUPS, getProblem } from "./index";
import { transpileTypeScript } from "@/lib/runner";

const DIFFICULTIES = new Set(["Easy", "Medium", "Hard"]);
const LANGUAGES = new Set(["python", "javascript", "typescript"]);
const RUNNABLE = new Set(["python", "javascript", "typescript"]);

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

  it("every TypeScript starter transpiles to syntactically valid JS", () => {
    for (const p of PROBLEMS) {
      const tsCode = p.starterCode.typescript;
      if (!tsCode) continue;
      // Transpile (type-strip) the same way Run does, then construct the JS —
      // throws SyntaxError on a malformed starter, without running it.
      const js = transpileTypeScript(ts, tsCode);
      expect(() => new Function(js), `${p.id} TS`).not.toThrow();
    }
  });

  it("PROBLEM_GROUPS covers every problem exactly once", () => {
    const grouped = PROBLEM_GROUPS.flatMap((g) => g.problems);
    // Same size as the derived flat list — no problem is dropped or duplicated.
    expect(grouped.length).toBe(PROBLEMS.length);
    // Ids are unique across all groups.
    const ids = grouped.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    // No empty group would render a bare topic header.
    for (const g of PROBLEM_GROUPS) {
      expect(g.problems.length, `${g.topic} empty`).toBeGreaterThan(0);
    }
  });

  // The authoring failure mode is a spec that silently never grades: an entry
  // point naming a function the starter doesn't declare, or a language with a
  // starter but no entry point. Both look fine in review and both produce
  // "tests didn't run" in the editor, so they're pinned here instead.
  it("every tests spec lines up with its starter code", () => {
    for (const p of PROBLEMS) {
      if (!p.tests) continue;
      for (const [lang, starter] of Object.entries(p.starterCode)) {
        const entry = p.tests.entryPoint[lang as keyof typeof p.tests.entryPoint];
        expect(entry, `${p.id}: no entryPoint for ${lang}`).toBeTruthy();
        expect(starter, `${p.id}:${lang} does not declare ${entry}`).toContain(entry!);
      }
    }
  });

  it("every tests spec has enough JSON-able cases", () => {
    for (const p of PROBLEMS) {
      if (!p.tests) continue;
      expect(p.tests.cases.length, `${p.id} case count`).toBeGreaterThanOrEqual(4);
      p.tests.cases.forEach((c, i) => {
        expect(Array.isArray(c.args), `${p.id} case ${i + 1} args`).toBe(true);
        // The harness ships args and returns values as JSON; anything that
        // doesn't survive the round-trip can never compare equal.
        for (const [what, value] of [["args", c.args], ["expected", c.expected]] as const) {
          expect(
            JSON.parse(JSON.stringify(value)),
            `${p.id} case ${i + 1} ${what} is not JSON-stable`
          ).toEqual(value);
        }
      });
    }
  });

  it("getProblem resolves known ids and rejects unknown ones", () => {
    expect(getProblem(PROBLEMS[0].id)?.id).toBe(PROBLEMS[0].id);
    expect(getProblem("does-not-exist")).toBeUndefined();
  });
});
