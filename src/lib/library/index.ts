// The concept library: reading material for the system design question bank.
// Articles live in per-section files and are assembled here. Public import path:
// "@/lib/library". Mirrors the shape of "@/lib/lessons" and "@/lib/problems".

import type { Article, LibrarySection } from "./types";
import { foundationArticles } from "./foundations";
import { dataArticles } from "./data";
import { trafficArticles } from "./traffic";
import { streamingArticles } from "./streaming";
import { coordinationArticles } from "./coordination";
import { reliabilityArticles } from "./reliability";
import { toolkitArticles } from "./toolkits";

export type { Article, LibrarySection } from "./types";

/** Ordered sections — drives the library index and the home "Library" section. */
export const LIBRARY_SECTIONS: LibrarySection[] = [
  {
    id: "foundations",
    title: "Foundations",
    blurb: "Scope the prompt, size the system, and name the guarantees you're promising.",
  },
  {
    id: "data",
    title: "Data & Storage",
    blurb: "Where the state lives: choosing a store, splitting it, copying it, and indexing it.",
  },
  {
    id: "traffic",
    title: "Traffic & Delivery",
    blurb: "Getting requests to a server and bytes to a user, then protecting both.",
  },
  {
    id: "streaming",
    title: "Async & Streaming",
    blurb: "Queues, logs, aggregation over unbounded streams, and pushing to live clients.",
  },
  {
    id: "coordination",
    title: "Correctness & Coordination",
    blurb: "The paths that must never double-book, double-charge, or double-run.",
  },
  {
    id: "reliability",
    title: "Reliability & Operations",
    blurb: "Partial failure, multiple regions, seeing inside the system, and shipping changes safely.",
  },
  {
    id: "toolkits",
    title: "Specialized Toolkits",
    blurb: "The purpose-built structures: geo, search, sketches, ids, ML serving, and media.",
  },
];

/** Every article, in section order. */
export const ARTICLES: Article[] = [
  ...foundationArticles,
  ...dataArticles,
  ...trafficArticles,
  ...streamingArticles,
  ...coordinationArticles,
  ...reliabilityArticles,
  ...toolkitArticles,
];

export function getArticle(id: string): Article | undefined {
  return ARTICLES.find((a) => a.id === id);
}

export function articlesForSection(sectionId: string): Article[] {
  return ARTICLES.filter((a) => a.section === sectionId);
}

/** Articles covering a given system design question, for cross-linking. */
export function articlesForQuestion(questionId: string): Article[] {
  return ARTICLES.filter((a) => a.appliesTo.includes(questionId));
}
