import { describe, it, expect } from "vitest";
import { runCode } from "@/lib/runner";

// Only the language-dispatch fallback is unit-testable without a real
// Worker/Pyodide environment; the execution paths are integration territory.
describe("runCode dispatch", () => {
  it("reports unsupported languages with a friendly message and exit 1", async () => {
    const r = await runCode("typescript", "const x: number = 1;");
    expect(r.exitCode).toBe(1);
    expect(r.stderr).toContain("isn't supported yet");
    expect(r.output).toBe(r.stderr);
  });

  it("treats any unknown language the same way", async () => {
    const r = await runCode("rust", "fn main() {}");
    expect(r.exitCode).toBe(1);
    expect(r.output).toContain("rust");
  });
});
