import { describe, it, expect } from "vitest";
import { stripCodeFences } from "@/lib/llm-json";

describe("stripCodeFences", () => {
  it("passes bare JSON through unchanged", () => {
    expect(stripCodeFences('{"a":1}')).toBe('{"a":1}');
  });

  it("unwraps a ```json fenced block", () => {
    expect(stripCodeFences('```json\n{"a":1}\n```')).toBe('{"a":1}');
  });

  it("unwraps a bare ``` fenced block", () => {
    expect(stripCodeFences('```\n{"a":1}\n```')).toBe('{"a":1}');
  });

  it("tolerates surrounding whitespace", () => {
    expect(stripCodeFences('  \n```json\n{"a":1}\n```  \n')).toBe('{"a":1}');
  });

  it("produces parseable JSON from a fenced model response", () => {
    expect(JSON.parse(stripCodeFences('```json\n{"recommendation":"Hire"}\n```'))).toEqual({
      recommendation: "Hire",
    });
  });
});
