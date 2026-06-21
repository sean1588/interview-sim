# Session UX Redesign — Direction A · "Dialogue"

Reskins the live experience from the dark gray/blue UI to a warm editorial
"studio": cream/sand surfaces, three typefaces (Cormorant Garamond serif, Jost
geometric sans, IBM Plex Mono), cognac/olive/clay accents. Source: the Claude
Design handoff (`Job interview simulator UX.zip`, Direction A).

The structural idea: **the conversation is the room, the work happens beside it.**
Each live screen's left column becomes a true full-height conversation panel —
reactive orb + always-on transcript + mic bar — and the work area gets room to
breathe. The Lesson screen, formerly four stacked scroll panes, becomes three
columns (conversation · tabbed Notes/Exercise · editor).

## Decisions (settled with the user)

1. **Whole-app theme.** The warm theme reaches everything — home, course pickers,
   in-session modals — not just the five live screens. One coherent product, no
   dark/warm seam.
2. **Framed window.** Each screen is a centered `max-w-[1440px]` cream card on the
   sand page background, with the soft frame shadow, **growing to fill viewport
   height** (not the mockup's fixed 900px). Sand margins show on wide screens.

## Architecture

- **Design tokens** live in `globals.css` as a Tailwind v4 `@theme` block (the ~22
  warm colors → `bg-frame`/`text-ink`/`border-edge`…), plus keyframes
  (`ripple`/`breathe`/`eq`/`livedot`/`glow`/`spin`) and animation tokens. Three
  fonts via `next/font/google` (same pattern as the existing Geist setup), wired to
  `--font-serif/sans/mono`.
- **`SessionFrame`** extracts the shared header (breadcrumb · LIVE·mm:ss pill · End)
  and the framed-window shell. Mode-specific header controls arrive through a
  `controls` **slot**; the lesson module pill through an optional prop. No mode
  branching inside the frame — parameterized data + one slot, not scattered `if`s.
  A `useElapsed` hook drives the LIVE clock.
- **`VoiceChat` keeps its voice engine; only its JSX changes.** The turn lifecycle
  (VAD, audio queue, `finishTurnIfIdle()`) is untouched — the new column reads the
  `status`/`messages` it already exposes and calls the existing `start`/`stop`. New
  output: orb-header block (orb + speaker name + state label + equalizer) →
  transcript bubbles → mic bar. Speaker name/label come from a lookup table keyed by
  `mode`. The dev log + latency panels are dropped from the UI (state kept, so the
  engine is byte-identical). `Orb` + `Equalizer` are shared subcomponents.
- **Work area:** `CodeEditor` restyled (chip language selector, olive Run, a custom
  Monaco light theme matching the ivory palette, restyled output) — props/API
  unchanged. `LessonMaterial` is a new tabbed Notes/Exercise middle column.
  Freestyle gains the waiting-state overlay (dashed rotating ring, Run disabled
  until the coach loads code) and pre-start "pick a starting point" chips.
- **Modals** (`Scorecard`, `RecapCard`, `CustomQuestionModal`) move to the warm
  theme — they overlay session screens.

## Orb / mic state mapping

The voice engine's `status` (`idle | listening | processing | speaking`) drives the
orb treatment: `speaking` → clay orb + clay equalizer; `listening` → olive orb +
olive equalizer; `processing` → muted "thinking" orb (rotating dashed ring); `idle`
(pre-start) → muted orb, "Tap the mic to begin." VAD semantics are kept (the mic
button starts/stops the session; it is not push-to-talk).
