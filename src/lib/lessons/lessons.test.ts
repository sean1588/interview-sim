import { describe, it, expect } from "vitest";
import { LESSONS, MODULES, getLesson, lessonsForModule } from "./index";

const MODULE_IDS = new Set(MODULES.map((m) => m.id));
const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

describe("learning bank invariants", () => {
  it("has a healthy number of lessons", () => {
    expect(LESSONS.length).toBeGreaterThanOrEqual(20);
  });

  it("declares all eight modules, each with at least one lesson", () => {
    expect(MODULES.length).toBe(8);
    for (const m of MODULES) {
      expect(lessonsForModule(m.id).length, `${m.id} has no lessons`).toBeGreaterThan(0);
    }
  });

  it("has unique, kebab-case lesson ids that reference a real module", () => {
    const ids = LESSONS.map((l) => l.id);
    expect(new Set(ids).size, "duplicate lesson id").toBe(ids.length);
    for (const l of LESSONS) {
      expect(l.id).toMatch(KEBAB);
      expect(MODULE_IDS.has(l.module), `${l.id} bad module ${l.module}`).toBe(true);
    }
  });

  it("has globally unique, kebab-case exercise ids", () => {
    const exIds = LESSONS.flatMap((l) => l.exercises.map((e) => e.id));
    expect(new Set(exIds).size, "duplicate exercise id").toBe(exIds.length);
    for (const id of exIds) expect(id).toMatch(KEBAB);
  });

  it("every lesson is well-formed", () => {
    for (const l of LESSONS) {
      expect(l.title.trim(), `${l.id} title`).not.toBe("");
      expect(l.blurb.trim(), `${l.id} blurb`).not.toBe("");
      expect(l.content.trim(), `${l.id} content`).not.toBe("");
      for (const e of l.exercises) {
        expect(e.title.trim(), `${e.id} title`).not.toBe("");
        expect(e.instructions.trim(), `${e.id} instructions`).not.toBe("");
        expect(e.starterCode.trim(), `${e.id} starter`).not.toBe("");
      }
    }
  });

  it("getLesson resolves known ids and rejects unknown ones", () => {
    expect(getLesson(LESSONS[0].id)?.id).toBe(LESSONS[0].id);
    expect(getLesson("does-not-exist")).toBeUndefined();
  });
});
