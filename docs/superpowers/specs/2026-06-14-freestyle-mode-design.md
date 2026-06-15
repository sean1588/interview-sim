# Freestyle Mode — Design Spec

**Date:** 2026-06-14
**Status:** Approved, implementing

## Summary

A fifth voice experience: **Freestyle** — a free-form, user-directed session. Same
layout as the other modes (voice agent left, code editor right). On start the agent
greets the user and asks what they want to work on — behavioral, technical/coding,
system design, general practice, or learning something new — then runs whatever they
pick, adapting on the fly. The agent can **write into the editor** (load a coding
problem as a starter stub, or drop a runnable example) and, as in every mode, **sees
the editor contents** on every turn.

Freestyle is a sandbox, not a graded interview: there is **no scorecard and no recap
modal**. Ending the session returns home; the agent gives a short spoken wrap-up if
the user signals they're done.

## What already exists (reused, not rebuilt)

- **Agent sees the editor every turn.** `formatEditorContext({code, language, lastRun})`
  is already appended to every user turn in `/api/chat`. Requirement "agent gets context
  of the current editor" needs zero new code.
- **Mode dispatch is the spine.** `getSystemPrompt(mode)`, `getKickoffPrompt(mode)`,
  `SessionMode = InterviewMode | "learning"`. Adding `"freestyle"` mirrors exactly how
  `"learning"` was added: it joins `SessionMode` (the voice-loop boundary) but **not**
  `InterviewMode` (the graded set that keys `SCORE_LABELS`), because freestyle is never
  graded.
- **Layout.** Voice-left / editor-right is the existing coding-mode layout.

## The one new mechanism: agent → editor writes

Today data flows **client → agent** (live context) and **agent → client** as speech
(`text` / `audio` NDJSON lines). Freestyle adds a third flow: **agent → editor**.

### Wire protocol

The agent emits a sentinel block inside its normal response stream:

```
<editor lang="python">
def two_sum(nums, target):
    """...problem statement as a docstring..."""
    pass
</editor>
```

Rules the agent is given (system prompt):

- The block's body is the **complete new contents** of the editor (it *replaces* what's
  there — not a diff, not an append).
- `lang` is `"python"` or `"javascript"` (the runnable languages).
- The agent does **not** speak the code or the tags; it says something brief like
  "I've put a starter in your editor." It emits a block **only** when it actually wants
  to change the editor.

This sentinel (`<editor>`) is distinct from the bracketed editor *context* the agent
**reads** (`[Editor state — …]` from `formatEditorContext`), so the read and write
channels never collide.

### Server-side extraction (`parseSseStream`)

`parseSseStream` already segments the model stream into sentences for TTS. It gains a
small, mode-agnostic state machine that splits the stream into **spoken text** vs
**editor blocks**:

- Spoken text flows to sentence segmentation / TTS exactly as today.
- Text between `<editor lang="…">` and `</editor>` is captured and **never sent to TTS**;
  on completion it is surfaced via a new optional `onEditor({language, code})` callback.
- Markers may be split across token deltas, so the machine holds back any trailing text
  that could be the start of a marker until it resolves.
- The function's return value (used for history + the chat bubble) is the **spoken text
  only** — editor blocks are stripped. The agent doesn't need them re-stored in history:
  the loaded code is now in the editor and round-trips back as bracketed context on the
  user's next turn.
- **Unterminated block** (stream truncated mid-capture): discard it — never load partial
  code. Rare; truncation-only.

Only freestyle's prompt ever emits the sentinel, so the state machine is inert for the
other modes (their streams contain no `<editor>` tag).

### Route → client

- `/api/chat` passes `onEditor` to `parseSseStream` and enqueues a new NDJSON line
  `{type:"editor", language, code}` when a block completes (alongside the existing
  `transcript` / `text` / `audio` / `done` lines).
- `VoiceChat` gains one optional prop `onEditorWrite?({language, code})`. On a
  `{type:"editor"}` line it calls the callback and logs "Loaded code into editor."
  Modes that don't pass the callback are unaffected; their prompts never produce the line.

## Plumbing (all additive)

- `src/lib/types/mode.ts`: `SessionMode = InterviewMode | "learning" | "freestyle"`.
- `src/lib/prompts.ts`:
  - `SESSION_MODES` / `isValidSessionMode` pick up `"freestyle"` automatically via the
    spread (add `"freestyle"` to the array).
  - `getSystemPrompt` freestyle branch: versatile voice coach; greet + ask what they want;
    can read the editor (bracketed) and write it (the `<editor>` protocol, spelled out);
    coding/technical → present problems as a stub+docstring in the editor and interview
    like coding mode (think-aloud, hints not solutions, complexity); behavioral / system
    design → run by voice like those modes (editor optional scratch); learn-something-new
    → teach conversationally with small runnable examples dropped into the editor; spoken
    wrap-up on request. Voice rules: 1–3 sentences, no markdown spoken, one thing at a time.
  - `getKickoffPrompt` freestyle branch: greet, introduce yourself, ask what they'd like
    to work on (behavioral, coding/technical, system design, practice, or learn something
    new); no fixed problem to present.
  - **No `/api/assess` changes** — freestyle never calls assessment.

## UI

- `src/components/FreestyleWorkspace.tsx` (new, client): single code editor (`python` /
  `javascript`, default python), one shared code buffer + language + lastRun. Generates
  its own `sessionId` (it does not use `useSession`, since it has no assessment).
  `getContext()` returns `{code, language, lastRun}`. `onEditorWrite` normalizes the lang
  (`javascript` → javascript, anything else → python) and replaces the buffer + resets
  lastRun. Editor starts with a one-line placeholder comment. Full-height editor (no fixed
  problem header), giving more vertical room than coding mode. Header: "← Home · Freestyle"
  and an "End" button that stops and navigates home.
- `src/app/freestyle/page.tsx` (new): renders `<FreestyleWorkspace />`.
- `src/app/page.tsx`: a "Freestyle" mode card (🎛️) in the practice-interviews group,
  linking to `/freestyle`.

## Out of scope (v1)

- Display-only languages (markdown/Java/Go) in the editor — runnable practice is python/js,
  consistent with the rest of the app. Other languages are discussed by voice.
- Any assessment / scorecard / recap modal.
- A button for the user to request a problem — it's agent-driven by voice ("give me a
  medium array problem").

## Testing & gates

- `src/lib/openrouter.test.ts` (new): drive `parseSseStream` with synthetic SSE byte
  chunks and assert spoken-sentence vs `onEditor` splitting, including: a clean block,
  a block whose tags are split across chunks, text before/after a block, and an
  unterminated block (no editor emission).
- `src/lib/prompts.test.ts`: freestyle is a valid `SessionMode`; `getSystemPrompt("freestyle")`
  and `getKickoffPrompt("freestyle")` are non-empty and describe the `<editor>` protocol.
- Gates: `tsc`, `eslint`, `vitest`, `next build`.
