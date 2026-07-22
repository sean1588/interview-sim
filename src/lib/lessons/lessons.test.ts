import { describe, it, expect } from "vitest";
import * as ts from "typescript";
import { COURSES, ALL_LESSONS, getCourse, getLesson, lessonsForModule } from "./index";
import { transpileTypeScript } from "@/lib/runner";

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

describe("learning courses — cross-course invariants", () => {
  it("registers the python, typescript, and go courses", () => {
    expect(COURSES.map((c) => c.id)).toEqual(["python", "typescript", "go"]);
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
    expect(getCourse("go")?.id).toBe("go");
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

// Squiggle gate (CI): type-check every TypeScript starter the way the single-file
// Monaco editor does — non-strict, the full DOM-inclusive lib, each starter seen
// as an ISOLATED SCRIPT — so a starter never shows the learner a SPURIOUS red
// squiggle. Script scope is what surfaces collisions with browser globals
// (Event / status / name / Cache). The transpile-construct test above can't see
// type errors at all; this is the gate that protects the typing-course UX.
describe("typescript course — starters are type-clean in the editor", () => {
  const INTENTIONAL = new Set(["spot-the-squiggle"]); // ships a type error on purpose
  const opts: ts.CompilerOptions = {
    strict: false,
    target: ts.ScriptTarget.ESNext,
    lib: ["lib.esnext.full.d.ts"],
    noEmit: true,
    skipLibCheck: true,
  };
  const baseHost = ts.createCompilerHost(opts);
  const cache = new Map<string, ts.SourceFile | undefined>();

  function squiggles(id: string, code: string): string[] {
    const fileName = `/virtual/${id}.ts`;
    const sf = ts.createSourceFile(fileName, code, opts.target!, true);
    const host: ts.CompilerHost = {
      ...baseHost,
      getSourceFile: (name, lang, onError, shouldCreate) => {
        if (name === fileName) return sf;
        if (!cache.has(name)) cache.set(name, baseHost.getSourceFile(name, lang, onError, shouldCreate));
        return cache.get(name);
      },
      fileExists: (name) => name === fileName || baseHost.fileExists(name),
      readFile: (name) => (name === fileName ? code : baseHost.readFile(name)),
    };
    const program = ts.createProgram([fileName], opts, host);
    return ts
      .getPreEmitDiagnostics(program)
      .filter((d) => d.file?.fileName === fileName)
      .map((d) => `[${d.code}] ${ts.flattenDiagnosticMessageText(d.messageText, " ")}`);
  }

  const starters = (getCourse("typescript")?.lessons ?? []).flatMap((l) =>
    l.exercises.map((e) => [e.id, e.starterCode] as const)
  );

  it.each(starters)("%s", (id, code) => {
    const found = squiggles(id, code);
    if (INTENTIONAL.has(id)) {
      // The lesson teaches that a type error squiggles but doesn't block Run — so
      // it must still carry one, or the teaching point silently breaks.
      expect(found.length, `${id} must keep its teaching squiggle`).toBeGreaterThan(0);
    } else {
      expect(found, `${id} has spurious editor squiggle(s)`).toEqual([]);
    }
  });
});
