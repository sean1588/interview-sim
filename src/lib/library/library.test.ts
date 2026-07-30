import { describe, it, expect } from "vitest";
import {
  ARTICLES,
  LIBRARY_SECTIONS,
  getArticle,
  articlesForSection,
  articlesForQuestion,
} from "./index";
import { SYSTEM_DESIGN_QUESTIONS } from "@/lib/questions/system-design";

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

describe("library structure", () => {
  it("has unique, kebab-case section ids", () => {
    const ids = LIBRARY_SECTIONS.map((s) => s.id);
    expect(new Set(ids).size, "duplicate section id").toBe(ids.length);
    for (const s of LIBRARY_SECTIONS) {
      expect(s.id, s.id).toMatch(KEBAB);
      expect(s.title.trim(), `${s.id} title`).not.toBe("");
      expect(s.blurb.trim(), `${s.id} blurb`).not.toBe("");
    }
  });

  it("has unique, kebab-case article ids", () => {
    const ids = ARTICLES.map((a) => a.id);
    expect(new Set(ids).size, "duplicate article id").toBe(ids.length);
    for (const a of ARTICLES) expect(a.id, a.id).toMatch(KEBAB);
  });

  it("gives every section at least one article", () => {
    for (const s of LIBRARY_SECTIONS) {
      expect(articlesForSection(s.id).length, `${s.id} has no articles`).toBeGreaterThan(0);
    }
  });

  it("has no article stranded outside a declared section", () => {
    const sectionIds = new Set(LIBRARY_SECTIONS.map((s) => s.id));
    for (const a of ARTICLES) {
      expect(sectionIds.has(a.section), `${a.id} bad section ${a.section}`).toBe(true);
    }
  });

  it("resolves articles by id and rejects unknown ones", () => {
    expect(getArticle(ARTICLES[0].id)?.id).toBe(ARTICLES[0].id);
    expect(getArticle("does-not-exist")).toBeUndefined();
  });
});

describe("library articles are well-formed", () => {
  it("has substantial content and a blurb per article", () => {
    for (const a of ARTICLES) {
      expect(a.title.trim(), `${a.id} title`).not.toBe("");
      expect(a.blurb.trim(), `${a.id} blurb`).not.toBe("");
      // Concept notes, not stubs — every article should carry real reading material.
      expect(a.content.trim().length, `${a.id} content too short`).toBeGreaterThan(1500);
      expect(a.content, `${a.id} has no headings`).toMatch(/^## /m);
    }
  });

  it("has balanced markdown code fences", () => {
    for (const a of ARTICLES) {
      const fences = a.content.match(/^```/gm) ?? [];
      expect(fences.length % 2, `${a.id} has an unclosed code fence`).toBe(0);
    }
  });

  it("only links to library articles that exist", () => {
    const ids = new Set(ARTICLES.map((a) => a.id));
    for (const a of ARTICLES) {
      for (const [, target] of a.content.matchAll(/\]\(\/library\/([^)]*)\)/g)) {
        expect(ids.has(target), `${a.id} links to missing article /library/${target}`).toBe(true);
      }
    }
  });
});

// The library exists to serve the system design bank, so the two must stay in
// step: no article may point at a question that no longer exists, and no question
// may be left without any reading material. Adding a question means mapping it to
// at least one article (or writing a new one).
describe("library ↔ system design bank", () => {
  const questionIds = new Set(SYSTEM_DESIGN_QUESTIONS.map((q) => q.id));

  it("only references real system design questions", () => {
    for (const a of ARTICLES) {
      expect(a.appliesTo.length, `${a.id} lists no questions`).toBeGreaterThan(0);
      for (const qid of a.appliesTo) {
        expect(questionIds.has(qid), `${a.id} references unknown question ${qid}`).toBe(true);
      }
      expect(new Set(a.appliesTo).size, `${a.id} repeats a question`).toBe(a.appliesTo.length);
    }
  });

  it("covers every question with at least one article", () => {
    const uncovered = SYSTEM_DESIGN_QUESTIONS.filter(
      (q) => articlesForQuestion(q.id).length === 0
    ).map((q) => q.id);
    expect(uncovered, "questions with no library article").toEqual([]);
  });
});
