// Shared types for the concept library — the reading companion to the system
// design question bank. Articles live in per-section files and are assembled
// into the registry in index.ts. Public import: "@/lib/library".
// Mirrors the shape of "@/lib/lessons" and "@/lib/problems".

export interface LibrarySection {
  /** Kebab-case, unique — also the anchor id on the library index. */
  id: string;
  title: string;
  /** One-liner for the section header. */
  blurb: string;
}

export interface Article {
  /** Kebab-case, globally unique — the /library/[articleId] route segment. */
  id: string;
  /** A section id within LIBRARY_SECTIONS. */
  section: string;
  title: string;
  /** One-liner for the index cards. */
  blurb: string;
  /**
   * Markdown "concept note": what the thing is, the tradeoffs, the numbers, and
   * the move to make in an interview. Written for an engineer who can code but
   * hasn't designed at this scale.
   */
  content: string;
  /**
   * Ids of SYSTEM_DESIGN_QUESTIONS this concept unlocks. Tests assert every id
   * resolves and that every question is covered by at least one article, so the
   * two banks can't silently drift apart.
   */
  appliesTo: string[];
}
