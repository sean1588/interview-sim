import { describe, it, expect, beforeAll } from "vitest";
import * as ts from "typescript";
import {
  COURSES,
  ALL_LESSONS,
  QUIZ_LENGTH,
  QUIZ_OPTIONS,
  buildLessonScript,
  getCourse,
  getLesson,
  lessonsForModule,
} from "./index";
import { transpileTypeScript } from "@/lib/runner";
import { ARTICLES } from "@/lib/library";

const ALL_QUESTIONS = ALL_LESSONS.flatMap((l) => l.quiz);

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
/** Every /library/<id> href appearing in a lesson card. */
const LIBRARY_HREF = /\/library\/([a-z0-9-]+)/g;

describe("learning courses — cross-course invariants", () => {
  it("registers the language courses, the subject course, then the concept courses", () => {
    expect(COURSES.map((c) => c.id)).toEqual([
      "python",
      "typescript",
      "go",
      "dsa",
      "distributed-systems",
      "aws",
    ]);
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
    expect(getCourse("dsa")?.id).toBe("dsa");
    expect(getCourse("distributed-systems")?.id).toBe("distributed-systems");
    expect(getCourse("aws")?.id).toBe("aws");
    expect(getCourse("does-not-exist")).toBeUndefined();
  });

  it("has globally unique, kebab-case quiz question ids across all courses", () => {
    const ids = ALL_QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size, "duplicate quiz question id").toBe(ids.length);
    for (const id of ids) expect(id, id).toMatch(KEBAB);
  });

  it("links only to library articles that exist", () => {
    // Lesson cards cross-link the concept library instead of restating it; a
    // renamed article must not leave a dead link in a lesson.
    const ids = new Set(ARTICLES.map((a) => a.id));
    for (const l of ALL_LESSONS) {
      for (const [, articleId] of l.content.matchAll(LIBRARY_HREF)) {
        expect(ids.has(articleId), `${l.id} links to unknown article ${articleId}`).toBe(true);
      }
    }
  });

  // The one quiz defect that's invisible when reviewing any single file: a bulk
  // authoring pass that leaves the correct answer in the same slot every time,
  // so "always pick A" scores full marks. Loose enough never to be flaky over
  // hundreds of questions, tight enough to catch a whole course landing skewed.
  it("spreads the correct answer across every option position", () => {
    const floor = ALL_QUESTIONS.length * 0.1;
    for (let position = 0; position < QUIZ_OPTIONS; position++) {
      const count = ALL_QUESTIONS.filter((q) => q.answer === position).length;
      expect(count, `only ${count} answers sit at position ${position}`).toBeGreaterThan(floor);
    }
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

  // The quiz is the one part of a lesson that is never optional — a concept
  // course has no exercises to check understanding with, and a language course's
  // exercises check that you can write it, not that you know when to reach for it.
  it("gives every lesson a well-formed quiz", () => {
    for (const l of course.lessons) {
      expect(l.quiz.length, `${l.id} quiz length`).toBe(QUIZ_LENGTH);
      for (const q of l.quiz) {
        expect(q.prompt.trim(), `${q.id} prompt`).not.toBe("");
        expect(q.explanation.trim(), `${q.id} explanation`).not.toBe("");
        expect(q.options.length, `${q.id} option count`).toBe(QUIZ_OPTIONS);
        expect(new Set(q.options).size, `${q.id} has duplicate options`).toBe(QUIZ_OPTIONS);
        for (const o of q.options) expect(o.trim(), `${q.id} blank option`).not.toBe("");
        expect(q.answer, `${q.id} answer index`).toBeGreaterThanOrEqual(0);
        expect(q.answer, `${q.id} answer index`).toBeLessThan(QUIZ_OPTIONS);
      }
    }
  });

  // A course's `language` decides its whole shape: with one it gets an editor
  // and hands-on exercises; without one it is a concept course, taught purely
  // by voice against the notes (LessonWorkspace renders no editor at all).
  it("matches its exercises to whether it declares a language", () => {
    const exercises = course.lessons.flatMap((l) => l.exercises);
    if (course.language) {
      expect(exercises.length, `${course.id} is a language course with no exercises`).toBeGreaterThan(0);
    } else {
      expect(exercises, `${course.id} is a concept course but ships exercises`).toEqual([]);
    }
  });

  it("getLesson resolves this course's lessons and rejects unknown ones", () => {
    const first = course.lessons[0];
    expect(getLesson(course.id, first.id)?.id).toBe(first.id);
    expect(getLesson(course.id, "does-not-exist")).toBeUndefined();
  });
});

// Concept courses (no language, no editor) exist to teach the mechanism where
// the library gives the interview answer, so they carry two obligations the
// language courses don't: real per-module depth, and a link back to the library
// from every module. Same invariant for each, so one table — the expected module
// count is the only thing that differs.
const CONCEPT_COURSES = [
  { id: "distributed-systems", modules: 6, minLessons: 18 },
  { id: "aws", modules: 7, minLessons: 21 },
] as const;

it("pins every concept course — a new one must be added to the table above", () => {
  expect(COURSES.filter((c) => !c.language).map((c) => c.id)).toEqual(
    CONCEPT_COURSES.map((c) => c.id)
  );
});

describe.each(CONCEPT_COURSES)("concept course: $id", ({ id, modules, minLessons }) => {
  const course = getCourse(id)!;

  it("declares no language, so it renders no editor", () => {
    expect(course.language).toBeUndefined();
  });

  it("covers its modules with real depth", () => {
    expect(course.modules.length).toBe(modules);
    expect(course.lessons.length).toBeGreaterThanOrEqual(minLessons);
    for (const m of course.modules) {
      expect(lessonsForModule(course, m.id).length, `${m.id}`).toBeGreaterThanOrEqual(3);
    }
  });

  it("cross-links the concept library from every module", () => {
    for (const m of course.modules) {
      const links = lessonsForModule(course, m.id)
        .flatMap((l) => [...l.content.matchAll(LIBRARY_HREF)])
        .map(([, articleId]) => articleId);
      expect(links.length, `${m.id} links to no library article`).toBeGreaterThan(0);
    }
  });
});

describe("buildLessonScript — quiz misses reach the tutor", () => {
  const withExercises = ALL_LESSONS.find((l) => l.exercises.length > 0)!;
  const conversational = ALL_LESSONS.find((l) => l.exercises.length === 0)!;

  it("says nothing about the quiz until the learner gets one wrong", () => {
    for (const lesson of [withExercises, conversational]) {
      expect(buildLessonScript(lesson, 0)).not.toMatch(/QUIZ MISSES/);
      expect(buildLessonScript(lesson, 0, [])).not.toMatch(/QUIZ MISSES/);
    }
  });

  it("carries the missed question, its answer, and its explanation", () => {
    const missed = conversational.quiz[1];
    const script = buildLessonScript(conversational, 0, [missed.id]);

    expect(script).toContain(missed.prompt);
    expect(script).toContain(missed.options[missed.answer]);
    expect(script).toContain(missed.explanation);
    // Only what they actually got wrong — not the whole quiz.
    expect(script).not.toContain(conversational.quiz[0].prompt);
  });

  it("appends misses to a lesson with exercises without disturbing the arc", () => {
    const script = buildLessonScript(withExercises, 0, [withExercises.quiz[0].id]);

    expect(script).toContain("EXERCISES");
    expect(script).toContain(withExercises.exercises[0].title);
    expect(script).toContain(withExercises.quiz[0].prompt);
  });

  it("ignores an id that isn't one of this lesson's questions", () => {
    // A stale id from the previous lesson must not produce an empty misses block.
    expect(buildLessonScript(conversational, 0, ["not-a-question"])).not.toMatch(/QUIZ MISSES/);
  });
});

// Every course whose starters run through the TypeScript pipeline — the gate
// belongs to the language, not to one course, so a new TS-language course (DSA)
// is covered automatically.
const TS_STARTERS = COURSES.filter((c) => c.language === "typescript").flatMap((c) =>
  c.lessons.flatMap((l) => l.exercises.map((e) => [e.id, e.starterCode] as const))
);

// Run-every-scaffold gate (CI-safe slice): transpile every TypeScript starter
// the same way Run does, then CONSTRUCT the emitted JS — proving each starter is
// syntactically valid without executing its example calls (no infinite-loop hang
// risk in the test process). Full transpile+execute validation runs in the
// authoring workflows and scripts/run-ts-lesson-gate.mjs. Mirrors problems.test.ts.
describe("typescript-language courses — every starter transpiles to valid JS", () => {
  it.each(TS_STARTERS)("%s transpiles + constructs", (_id, code) => {
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
describe("typescript-language courses — starters are type-clean in the editor", () => {
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

  // Parsing lib.esnext.full.d.ts dominates the first createProgram and fills
  // `cache` for every case after it, so whichever starter sorts first was paying
  // for all of them — and blowing the 5s default under CI load. Do it here
  // instead: one real typecheck, billed to setup, on a setup-sized budget.
  beforeAll(() => void squiggles("warmup", ""), 60_000);

  it.each(TS_STARTERS)("%s", (id, code) => {
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
