import { describe, it, expect } from "vitest";
import { getSession, resetSession } from "@/lib/session-store";

// Each test uses a unique id so the shared module-level Map doesn't bleed
// between cases.
let n = 0;
const freshId = () => `test-session-${n++}`;

const TTL_MS = 2 * 60 * 60 * 1000;

describe("session-store", () => {
  it("auto-creates an empty session on first access", () => {
    const s = getSession(freshId());
    expect(s.history).toEqual([]);
    expect(s.problemId).toBeNull();
  });

  it("resetSession replaces history and sets the problem (no leak across interviews)", () => {
    const id = freshId();
    const s = getSession(id);
    s.history.push({ role: "user", content: "leftover" });

    const reset = resetSession(id, "two-sum");
    expect(reset.history).toEqual([]);
    expect(reset.problemId).toBe("two-sum");
    // The live handle the caller would read next is the reset one.
    expect(getSession(id).history).toEqual([]);
  });

  it("evicts a session left idle past the TTL", () => {
    const id = freshId();
    const s = getSession(id);
    s.history.push({ role: "user", content: "stale" });
    // Backdate it beyond the eviction window.
    s.lastActive = Date.now() - (TTL_MS + 1000);

    // Next access sweeps the stale entry and hands back a fresh, empty one.
    expect(getSession(id).history).toEqual([]);
  });

  it("keeps a recently-active session alive", () => {
    const id = freshId();
    const s = getSession(id);
    s.history.push({ role: "user", content: "recent" });
    expect(getSession(id).history).toHaveLength(1);
  });
});
