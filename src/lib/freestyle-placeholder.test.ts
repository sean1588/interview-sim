import { describe, it, expect } from "vitest";
import { placeholderFor, isPlaceholder } from "@/lib/freestyle-placeholder";

describe("placeholderFor", () => {
  it("comments with # in python", () => {
    expect(placeholderFor("python")).toBe(
      `# Freestyle session — tell the coach what you'd like to work on:
# a coding problem, system design, a behavioral interview, or learning
# something new. They'll load anything you need right here.
`
    );
  });

  it("comments with // in javascript", () => {
    expect(placeholderFor("javascript")).toBe(
      `// Freestyle session — tell the coach what you'd like to work on:
// a coding problem, system design, a behavioral interview, or learning
// something new. They'll load anything you need right here.
`
    );
  });

  it("comments with // in typescript", () => {
    expect(placeholderFor("typescript")).toBe(placeholderFor("javascript"));
  });

  it("keeps the same prose in every language", () => {
    const strip = (s: string) =>
      s
        .split("\n")
        .map((l) => l.replace(/^(#|\/\/) ?/, ""))
        .join("\n");
    expect(strip(placeholderFor("typescript"))).toBe(strip(placeholderFor("python")));
  });
});

describe("isPlaceholder", () => {
  it("recognizes every language's placeholder", () => {
    for (const language of ["python", "javascript", "typescript"] as const) {
      expect(isPlaceholder(placeholderFor(language))).toBe(true);
    }
  });

  it("is false for real code", () => {
    expect(isPlaceholder("def two_sum(nums, target):\n    return []\n")).toBe(false);
  });

  it("is false for an edited placeholder", () => {
    expect(isPlaceholder(placeholderFor("python") + "print('hi')\n")).toBe(false);
    expect(isPlaceholder("")).toBe(false);
  });
});
