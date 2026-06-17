import { describe, it, expect } from "vitest";
import * as ts from "typescript";
import { COURSES, ALL_LESSONS, getCourse, getLesson, lessonsForModule } from "./index";
import { transpileTypeScript } from "@/lib/runner";

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

describe("learning courses — cross-course invariants", () => {
  it("registers the python and typescript courses", () => {
    expect(COURSES.map((c) => c.id)).toEqual(["python", "typescript"]);
  });

  it("has globally unique, kebab-case lesson ids across all courses", () => {
    const ids = ALL_LESSONS.map((l) => l.id);
    expect(new Set(ids).size, "duplicate lesson id").toBe(ids.length);
    for (const l of ALL_LESSONS) expect(l.id, l.id).toMatch(KEBAB);
  });

  it("has globally unique, kebab-case exercise ids across all courses", () => {
    const exIds = ALL_LESSONS.flatMap((l) => l.exercises.map((e) => e.id));
    expect(new Set(exIds).size, "duplicate exercise id").toBe(exIds.length);
    for (const id of exIds) expect(id, id).toMatch(KEBAB);
  });

  it("resolves known courses and rejects unknown ones", () => {
    expect(getCourse("python")?.id).toBe("python");
    expect(getCourse("typescript")?.id).toBe("typescript");
    expect(getCourse("does-not-exist")).toBeUndefined();
  });
});

describe.each(COURSES)("course: $id", (course) => {
  it("has a healthy number of lessons", () => {
    expect(course.lessons.length).toBeGreaterThanOrEqual(12);
  });

  it("declares modules, each with at least one lesson", () => {
    expect(course.modules.length).toBeGreaterThan(0);
    for (const m of course.modules) {
      expect(
        lessonsForModule(course, m.id).length,
        `${course.id}/${m.id} has no lessons`
      ).toBeGreaterThan(0);
    }
  });

  it("every lesson references a real module and is well-formed", () => {
    const moduleIds = new Set(course.modules.map((m) => m.id));
    for (const l of course.lessons) {
      expect(moduleIds.has(l.module), `${l.id} bad module ${l.module}`).toBe(true);
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

  it("getLesson resolves this course's lessons and rejects unknown ones", () => {
    const first = course.lessons[0];
    expect(getLesson(course.id, first.id)?.id).toBe(first.id);
    expect(getLesson(course.id, "does-not-exist")).toBeUndefined();
  });
});

// Run-every-scaffold gate (CI-safe slice): transpile every TypeScript starter
// the same way Run does, then CONSTRUCT the emitted JS — proving each starter is
// syntactically valid without executing its example calls (no infinite-loop hang
// risk in the test process). Full transpile+execute validation runs in the
// authoring workflow and scripts/run-ts-lesson-gate.mjs. Mirrors problems.test.ts.
describe("typescript course — every starter transpiles to valid JS", () => {
  const tsCourse = getCourse("typescript");
  const starters = (tsCourse?.lessons ?? []).flatMap((l) =>
    l.exercises.map((e) => [e.id, e.starterCode] as const)
  );
  it.each(starters)("%s transpiles + constructs", (_id, code) => {
    const js = transpileTypeScript(ts, code);
    expect(() => new Function(js)).not.toThrow();
  });
});
