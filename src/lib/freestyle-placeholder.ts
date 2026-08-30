/** The starter text the freestyle editor holds before anything real is in it.
 *
 * Freestyle seeds one shared buffer with a note about what the session can be,
 * written as comments so it sits in the editor without tripping the language
 * server. The buffer's language is user-switchable, so the comment marker has
 * to follow it — three `#` lines are syntax errors in TypeScript.
 */

import type { LanguageId } from "@/lib/problems";

const LINES = [
  "Freestyle session — tell the coach what you'd like to work on:",
  "a coding problem, system design, a behavioral interview, or learning",
  "something new. They'll load anything you need right here.",
];

/** Python is the only hash-commented language on offer; the rest use `//`. */
function commentMarker(language: LanguageId): string {
  return language === "python" ? "#" : "//";
}

/** The placeholder written in `language`'s comment syntax (trailing newline). */
export function placeholderFor(language: LanguageId): string {
  const marker = commentMarker(language);
  return LINES.map((line) => `${marker} ${line}\n`).join("");
}

const PLACEHOLDERS: readonly string[] = ["#", "//"].map((marker) =>
  LINES.map((line) => `${marker} ${line}\n`).join("")
);

/**
 * Is the buffer still an untouched placeholder — in any language's syntax?
 *
 * Callers use this both to decide the workspace is still waiting (no Run, keep
 * the overlay up) and to know a language switch may safely rewrite the buffer.
 */
export function isPlaceholder(code: string): boolean {
  return PLACEHOLDERS.includes(code);
}
