# Full-Width Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a header toggle to every interview/lesson screen that expands the content area to full viewport width, persisted across sessions.

**Architecture:** `SessionFrame.tsx` is the single shared shell behind all six live screens (behavioral, coding, freestyle, system-design, career, and lesson pages) and already owns the one width cap that governs all of them. A new `src/lib/layout-prefs.ts` module holds a boolean preference in localStorage using the exact `useSyncExternalStore` snapshot/listener pattern already established by `history.ts` and `career-store.ts` — `SessionFrame` calls the store's primitives directly (no wrapping hook), matching how `history/page.tsx` and `CareerCoach.tsx` already consume their own stores inline. Two new icons in `icons.tsx` render the toggle's two states.

**Tech Stack:** Next.js 16 / React 19, Tailwind v4 (arbitrary-value utility classes), Vitest.

## Global Constraints

- Scope is `SessionFrame`-based screens only — the static `/learn` and `/learn/[course]` overview pages are explicitly out of scope (spec: Scope).
- The preference persists in localStorage using the codebase's established SSR-safe external-store pattern (spec: State & persistence).
- "Full width" means removing the width cap entirely — no intermediate/capped "wide" state (spec: Behavior, Out of scope).
- No animation/transition requirement; a plain width change is sufficient (spec: Behavior).
- No cross-tab sync requirement (spec: Out of scope).

---

### Task 1: `layout-prefs.ts` — the persisted width preference

**Files:**
- Create: `src/lib/layout-prefs.ts`
- Test: `src/lib/layout-prefs.test.ts`

**Interfaces:**
- Produces: `isExpanded(): boolean`, `setExpanded(value: boolean): void`, `subscribeExpanded(cb: () => void): () => void`, `expandedSnapshot(): boolean`, `expandedServerSnapshot(): boolean` — all consumed directly by Task 3 via `useSyncExternalStore(subscribeExpanded, expandedSnapshot, expandedServerSnapshot)` and `setExpanded(!expanded)`.

- [ ] **Step 1: Write the failing test**

Create `src/lib/layout-prefs.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  isExpanded,
  setExpanded,
  subscribeExpanded,
  expandedSnapshot,
  expandedServerSnapshot,
} from "@/lib/layout-prefs";

// Mirrors history.test.ts / career-store.test.ts: the test env is "node" (no
// window/localStorage), so we stand up a minimal in-memory localStorage on
// globalThis.
class MemoryStorage {
  private map = new Map<string, string>();
  getItem(k: string) {
    return this.map.has(k) ? this.map.get(k)! : null;
  }
  setItem(k: string, v: string) {
    this.map.set(k, String(v));
  }
  removeItem(k: string) {
    this.map.delete(k);
  }
}

const KEY = "interview-sim:layout:expanded";

function installStorage(ls: unknown = new MemoryStorage()) {
  (globalThis as { window?: unknown }).window = { localStorage: ls };
}

function uninstallStorage() {
  delete (globalThis as { window?: unknown }).window;
}

function seed(value: string) {
  (globalThis as { window?: { localStorage: Storage } }).window!.localStorage.setItem(KEY, value);
}

describe("layout-prefs", () => {
  beforeEach(() => installStorage());
  afterEach(() => uninstallStorage());

  it("defaults to false when nothing has been saved", () => {
    expect(isExpanded()).toBe(false);
  });

  it("saves and reads back true", () => {
    setExpanded(true);
    expect(isExpanded()).toBe(true);
  });

  it("setExpanded(false) removes the stored value", () => {
    setExpanded(true);
    setExpanded(false);
    expect(isExpanded()).toBe(false);
  });

  it("tolerates a garbage stored value → false", () => {
    seed("not-a-flag");
    expect(isExpanded()).toBe(false);
  });

  it("exposes a snapshot that tracks writes and notifies subscribers", () => {
    let notified = 0;
    const unsubscribe = subscribeExpanded(() => notified++);

    setExpanded(true);
    expect(notified).toBe(1);
    expect(expandedSnapshot()).toBe(true);
    // Referentially stable between writes — useSyncExternalStore requires it.
    expect(expandedSnapshot()).toBe(expandedSnapshot());

    setExpanded(false);
    expect(expandedSnapshot()).toBe(false);
    expect(notified).toBe(2);

    unsubscribe();
    setExpanded(true);
    expect(notified).toBe(2);
  });

  it("SSR guard: no throw and false/no-op when window is undefined", () => {
    uninstallStorage();
    expect(() => setExpanded(true)).not.toThrow();
    expect(isExpanded()).toBe(false);
    expect(expandedServerSnapshot()).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/layout-prefs.test.ts`
Expected: FAIL — `Cannot find module '@/lib/layout-prefs'` (the module doesn't exist yet).

- [ ] **Step 3: Write the implementation**

Create `src/lib/layout-prefs.ts`:

```ts
/** Whether session/lesson screens render at full viewport width instead of the
 * default 1440px cap — a single on-device display preference shared by every
 * SessionFrame instance (interviews and lessons alike), not a per-session flag.
 */

const KEY = "interview-sim:layout:expanded";

/** All persistence is on-device and client-only: on the server (SSR) there is
 * no localStorage, so every reader returns false and every writer is a no-op. */
function store(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Tolerates absent or malformed storage → false. */
export function isExpanded(): boolean {
  const ls = store();
  if (!ls) return false;
  try {
    return ls.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

/** Best-effort: a quota or serialization failure must never break a live session. */
export function setExpanded(value: boolean): void {
  const ls = store();
  if (!ls) return;
  try {
    if (value) ls.setItem(KEY, "1");
    else ls.removeItem(KEY);
  } catch {
    // swallow and continue
  }
  emit();
}

// --- React external-store glue -------------------------------------------
// A cached, referentially-stable snapshot so `useSyncExternalStore` can read
// localStorage without a hydration mismatch or an effect that sets state.
const listeners = new Set<() => void>();
let snapshot: boolean | null = null;

function emit(): void {
  snapshot = null; // invalidate; recomputed lazily on next read
  listeners.forEach((l) => l());
}

export function subscribeExpanded(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Stable client snapshot for useSyncExternalStore (recomputed only on change). */
export function expandedSnapshot(): boolean {
  if (snapshot === null) snapshot = isExpanded();
  return snapshot;
}

/** Stable server snapshot — SSR never touches localStorage. */
export function expandedServerSnapshot(): boolean {
  return false;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/layout-prefs.test.ts`
Expected: PASS — 6 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/layout-prefs.ts src/lib/layout-prefs.test.ts
git commit -m "Add layout-prefs store for the full-width toggle preference"
```

---

### Task 2: Expand/Collapse icons

**Files:**
- Modify: `src/components/session/icons.tsx` (append after the existing `Send` function, end of file)

**Interfaces:**
- Produces: `Expand(props: IconProps)`, `Collapse(props: IconProps)` — both React components, consumed by Task 3.

- [ ] **Step 1: Add the two icons**

Append to `src/components/session/icons.tsx`, after the closing `}` of the `Send` function:

```tsx

/** Diagonal corner arrows — the "grow to full width" toggle in its unexpanded state. */
export function Expand(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M15 3h6v6" />
      <path d="M9 21H3v-6" />
      <line x1="21" y1="3" x2="14" y2="10" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </Stroke>
  );
}

/** Inward corner arrows — the same toggle's expanded state. */
export function Collapse(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M4 14h6v6" />
      <path d="M20 10h-6V4" />
      <line x1="21" y1="3" x2="14" y2="10" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </Stroke>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no output (clean). No dedicated icon test exists in this codebase — every other icon (`ChevronLeft`, `Mic`, `Pencil`, `Sun`, …) is unverified beyond compiling and a visual check once wired up, which happens in Task 3.

- [ ] **Step 3: Commit**

```bash
git add src/components/session/icons.tsx
git commit -m "Add Expand/Collapse icons for the full-width toggle"
```

---

### Task 3: Wire the toggle into `SessionFrame`

**Files:**
- Modify: `src/components/session/SessionFrame.tsx`

**Interfaces:**
- Consumes: `isExpanded, setExpanded, subscribeExpanded, expandedSnapshot, expandedServerSnapshot` from `@/lib/layout-prefs` (Task 1); `Expand, Collapse` from `./icons` (Task 2).
- Produces: no new exports. `SessionFrameProps` is unchanged — the toggle is entirely self-contained inside `SessionFrame`, so none of its six callers (`InterviewSim`, `NotesInterview`, `FreestyleWorkspace`, `CareerCoach`, `LessonWorkspace`) need any change. The fixed-width side columns each of those callers renders (e.g. `w-[466px] flex-none` chat panes, `LessonWorkspace`'s `w-[440px] flex-none` material pane) are untouched by this task — they're literal pixel widths, so they don't grow when the frame does; only their sibling `flex-1` column absorbs the freed space. That's why this task is the only one needed to satisfy the spec's "flex-1 column grows, fixed columns don't" behavior.

- [ ] **Step 1: Update imports**

In `src/components/session/SessionFrame.tsx`, replace:

```tsx
"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft } from "./icons";
```

with:

```tsx
"use client";

import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, Collapse, Expand } from "./icons";
import {
  expandedServerSnapshot,
  expandedSnapshot,
  setExpanded,
  subscribeExpanded,
} from "@/lib/layout-prefs";
```

- [ ] **Step 2: Read the preference in the component**

Immediately after `const elapsed = useElapsed();` (inside the `SessionFrame` function body), add:

```tsx
  const expanded = useSyncExternalStore(subscribeExpanded, expandedSnapshot, expandedServerSnapshot);
```

- [ ] **Step 3: Drop the width cap when expanded**

Replace:

```tsx
      <div
        className="w-full max-w-[1440px] flex flex-col bg-frame text-ink rounded-[7px] border border-edge overflow-hidden"
        style={{ boxShadow: "0 30px 70px rgba(60,40,20,.22)" }}
      >
```

with:

```tsx
      <div
        className={`w-full flex flex-col bg-frame text-ink rounded-[7px] border border-edge overflow-hidden ${
          expanded ? "" : "max-w-[1440px]"
        }`}
        style={{ boxShadow: "0 30px 70px rgba(60,40,20,.22)" }}
      >
```

- [ ] **Step 4: Add the toggle button to the header**

Replace:

```tsx
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/[0.13] px-2.5 py-[5px] font-sans text-[11px] font-medium tracking-[0.1em] text-gold-text">
              <span className="h-[7px] w-[7px] rounded-full bg-gold animate-livedot" />
              LIVE · {elapsed}
            </span>
            {controls}
```

with:

```tsx
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/[0.13] px-2.5 py-[5px] font-sans text-[11px] font-medium tracking-[0.1em] text-gold-text">
              <span className="h-[7px] w-[7px] rounded-full bg-gold animate-livedot" />
              LIVE · {elapsed}
            </span>
            <button
              onClick={() => setExpanded(!expanded)}
              aria-label={expanded ? "Return to normal width" : "Expand to full width"}
              title={expanded ? "Return to normal width" : "Expand to full width"}
              className="inline-flex items-center justify-center rounded-[7px] border border-edge bg-chip p-2 text-ink-muted transition-colors hover:border-cognac/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cognac/40"
            >
              {expanded ? <Collapse size={15} /> : <Expand size={15} />}
            </button>
            {controls}
```

- [ ] **Step 5: Run the full verification gate**

```bash
npx tsc --noEmit
npm run lint
npx vitest run
npm run build
```

Expected: all four clean/passing (tsc: no output; lint: no errors; vitest: all test files including the new `layout-prefs.test.ts` pass; build: succeeds).

- [ ] **Step 6: Manual check in the browser**

```bash
npm run dev
```

- Open a coding interview (`/coding`) and click the new toggle in the header (between the LIVE badge and any mode-specific controls). Confirm the frame grows to fill the viewport width and the editor/work-area column gets the extra space while the conversation column stays the same width.
- Click it again; confirm it returns to the 1440px-capped width.
- Reload the page after expanding; confirm it opens expanded again (localStorage persistence).
- Open a lesson page (`/learn/dsa/dsa-two-pointers` or any lesson with an editor) without touching the toggle there; confirm it opens already expanded (the preference is global, not per-mode) — then confirm the code-editor column is the one that grows, with the conversation and lesson-material columns holding their widths.
- Stop the dev server (Ctrl-C) once confirmed.

- [ ] **Step 7: Commit**

```bash
git add src/components/session/SessionFrame.tsx
git commit -m "Wire the full-width toggle into SessionFrame (issue #50)"
```

---

## Self-Review Notes

- **Spec coverage:** Scope (Task 3 touches only `SessionFrame`) · Component & placement (Task 2 + Task 3 Step 4) · State & persistence (Task 1) · Behavior — full width no cap (Task 3 Step 3), fixed columns unaffected (explained in Task 3's Interfaces block, no code needed elsewhere) · Testing — `layout-prefs.test.ts` (Task 1), no `SessionFrame` component test (matches spec), manual check (Task 3 Step 6). All spec sections have a task.
- **Placeholder scan:** none — every step has literal file content or an exact runnable command.
- **Type consistency:** `isExpanded`/`setExpanded`/`subscribeExpanded`/`expandedSnapshot`/`expandedServerSnapshot` are named identically in Task 1's produces, Task 1's implementation, and Task 3's imports/usage.
