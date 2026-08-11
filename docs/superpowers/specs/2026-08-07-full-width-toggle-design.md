# Full-width toggle for session & lesson screens — design

**Date:** 2026-08-07 · **Status:** approved · **Issue:** #50

## What

A width-expansion toggle in the header of every live interview and lesson screen — behavioral,
coding, freestyle, system-design, career, and `/learn/[course]/[lessonId]` — that lets the
content area grow to fill the viewport instead of capping at 1440px.

## Scope

`SessionFrame.tsx` is the one shared shell behind all six of those screens; it already owns the
single `max-w-[1440px]` cap that governs every one of them (`SessionFrame.tsx:64`). The plain
static pages (`/learn`, `/learn/[course]`) don't use `SessionFrame` and aren't part of this
change — they're card/link grids that don't benefit from extra width, and touching them would
mean a second, unrelated implementation. Out of scope; can be its own issue if it turns out to
matter.

## Component & placement

A new icon button in `SessionFrame`'s header, between the `LIVE` clock and the mode-specific
`controls` slot — grouped with the frame's own chrome, not the per-mode controls, the same way
the End button always sits last regardless of mode. Two new stroke icons in
`src/components/session/icons.tsx`, `Expand`/`Collapse`, matching the existing icon set (24×24
viewBox, `currentColor`, round caps, same shape as `Pencil`/`ChevronLeft`) and swapped based on
state. `aria-label`/`title` communicate the action ("Expand to full width" / "Return to normal
width"). Button chrome (rounded-[7px] border-edge bg-chip, hover:border-cognac/40,
focus-visible:ring-cognac/40) matches the existing icon+text header button
(`FreestyleWorkspace.tsx`'s "Custom question" toggle) minus the label — icon-only, sized to sit
comfortably in the 62px header.

## State & persistence

New `src/lib/layout-prefs.ts`, mirroring the SSR-safe localStorage pattern already established
by `history.ts` and `career-store.ts` — a `store()` guard that no-ops on the server, and a
`useSyncExternalStore` snapshot/listener pair so the client read never causes a hydration
mismatch. This is the third localStorage-backed preference in the codebase; reusing the existing
idiom keeps it consistent rather than introducing a lighter one-off for a single boolean.

- Key: `interview-sim:layout:expanded`.
- `useExpandedLayout(): [boolean, (v: boolean) => void]` — `SessionFrame` calls this directly;
  no prop threading through the six callers (`InterviewSim`, `NotesInterview`,
  `FreestyleWorkspace`, `CareerCoach`, `LessonWorkspace`, and system-design via `NotesInterview`).
- The preference is global, not per-mode or per-session: expand once, every session/lesson
  screen opens expanded until toggled back.

## Behavior

- Toggling flips the outer container (`SessionFrame.tsx:64`) between `max-w-[1440px]` and no cap
  — true edge-to-edge, no intermediate width ceiling.
- Every session screen's body is a multi-column flex row with fixed-width side columns (chat
  pane ~400–466px, lesson-material pane 440px) and one `flex-1` column (editor / whiteboard /
  notes). Removing the cap only grows the `flex-1` column — the fixed columns don't change size,
  and no other component needs to change.
- No animation/transition requirement — a plain width change is fine.

## Testing

- `src/lib/layout-prefs.test.ts`, following `history.test.ts`'s shape: read/write round-trip,
  and malformed/absent storage falling back to `false`.
- No new component test for `SessionFrame` — it isn't tested today (pure layout/props), and a
  class toggle is better verified by hand than asserted against jsdom.
- Manual check: toggle from a coding interview and from a lesson page; confirm the flex column
  grows and the side panes hold their width in both.

## Out of scope

- The static `/learn` and `/learn/[course]` overview pages (see Scope).
- An intermediate/capped "wide" state — full width is uncapped, full stop.
- Cross-tab sync of the preference (the existing `useSyncExternalStore` pattern doesn't do this
  for history/career either; out of scope here for the same reason).
