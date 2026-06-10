import { describe, it, expect } from "vitest";
import {
  LEVELS,
  isValidLevel,
  getLevel,
  describeLevelLadder,
} from "./levels";

describe("level ladder", () => {
  it("exports the five levels in ascending order", () => {
    expect(LEVELS.map((l) => l.id)).toEqual([
      "e1",
      "e2",
      "senior",
      "staff",
      "principal",
    ]);
  });

  it("every level is fully described", () => {
    for (const lvl of LEVELS) {
      expect(lvl.label.trim(), `label for ${lvl.id}`).not.toBe("");
      expect(lvl.hint.trim(), `hint for ${lvl.id}`).not.toBe("");
      // Blurbs complete the sentence "A strong candidate at this level …"
      expect(lvl.blurb.length, `blurb too short for ${lvl.id}`).toBeGreaterThan(60);
    }
  });

  it("isValidLevel accepts the five levels and rejects others", () => {
    for (const lvl of LEVELS) {
      expect(isValidLevel(lvl.id)).toBe(true);
    }
    expect(isValidLevel("Senior")).toBe(false); // ids are lowercase
    expect(isValidLevel("l4")).toBe(false);
    expect(isValidLevel("")).toBe(false);
    expect(isValidLevel(null)).toBe(false);
    expect(isValidLevel(undefined)).toBe(false);
  });

  it("getLevel resolves each id to its info", () => {
    expect(getLevel("staff").label).toBe("Staff");
    expect(getLevel("e1").hint).toContain("junior");
  });

  it("describeLevelLadder includes every level label", () => {
    const ladder = describeLevelLadder();
    for (const lvl of LEVELS) {
      expect(ladder).toContain(`${lvl.label} (${lvl.hint})`);
    }
  });
});
