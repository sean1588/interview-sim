# Interview Sim — Progress & Context

> Working memory for resuming this project. Last updated: voice-only (the animated Simli avatar was removed — the voice agent is good enough on its own).

## What we're building

An AI-powered **technical interview practice simulator** you talk to by voice in
real time. Split screen — a voice interviewer on the left, a CoderPad-style
coding pane on the right. The interviewer speaks, watches you code, reacts, and
assesses.

Two planned experiences: **technical mode** (current focus — coding/DSA + system
design) and **behavioral mode** (later).

## Current status: SPIKE VALIDATED ✅

We deliberately built the riskiest piece first — a real-time animated character
holding a natural voice conversation — to de-risk latency and the "feels alive"
question before building the full product. **It all works.**

Validated:
- [x] Full voice loop: mic → STT → LLM → TTS → playback
- [x] Multi-turn conversation, natural turn-taking
- [x] Voice quality (user: "better than a lot of voice agents I've heard in real life")
- [x] Transcription accuracy (after raw-PCM + pre-roll fix)
- [x] Barge-in (interrupt mid-sentence)
- [x] Sentence-level streaming (perceived latency ~5s → ~2s)

**Decision reached:** OpenRouter pipeline is good enough — we are NOT using a
realtime speech-to-speech API. Keeps model flexibility + unified billing.
**Decision reached:** No framework (LangGraph/Pipecat). Hand-rolled pipeline is
~300 lines and the real complexity is in interview logic + editor state.

## Next steps (no big unknowns left — "just engineering")

1. ~~**Code editor experience**~~ ✅ DONE — split-screen shell, Monaco editor,
   in-browser code execution, live editor state fed to the interviewer LLM.
2. ~~**Interview orchestration**~~ ✅ DONE (v1) — per-session state, interviewer
   greets + presents the problem first (kickoff), phase-aware prompt, and an
   "End Interview" button that produces a structured scorecard. Still freeform
   within the interview (no hard stage gates) — could add explicit stage
   transitions / a timer later.
3. **Behavioral mode.**
4. **TypeScript execution** — currently editor-runs only Python + JavaScript
   (TS needs an in-browser transpile step; deferred).
5. **Productionize session store** — `src/lib/session-store.ts` is in-memory
   (per server instance). Swap for Redis/DB before multi-instance deploy.
6. **Deployment** — AWS via Pulumi (ECS Fargate + ALB + ECR + Secrets Manager).
   Scoped at ~$35–70/mo. Deferred until there's a real product to host.

## Tech stack

- Next.js 16 (App Router, TypeScript, Turbopack), Tailwind CSS
- Web Audio API for mic capture + custom VAD
- `@monaco-editor/react` for the coding pane, `react-markdown` for problem text
- **Pyodide** (CPython in WASM, lazy-loaded from CDN) for in-browser Python;
  Web Worker for in-browser JavaScript — NO execution backend (see learnings)
- NDJSON over chunked HTTP for streaming the pipeline back to the browser

## Architecture

```
Browser (mic)
  → VAD (raw PCM, pre-roll ring buffer) captures utterance as WAV
  → POST /api/chat
      → STT → LLM (streaming) → TTS per sentence
      → streams NDJSON back: {type: transcript|text|audio|done}
  → <audio> playback (sentence-ordered queue)
```

## Key files

### Interview / editor experience (added after spike)
- `src/components/InterviewSim.tsx` — split-screen shell + page. Owns problem,
  language, per-(problem,language) code buffers, and last run output. Renders
  `VoiceChat` (left) and problem statement + `CodeEditor` (right). Passes a
  `getContext()` to VoiceChat so each voice turn carries the candidate's live
  code + last run output to the interviewer.
- `src/components/CodeEditor.tsx` — Monaco editor + language picker + Run +
  output console. Run goes through `src/lib/runner.ts` (in-browser, no backend).
- `src/lib/runner.ts` — in-browser execution. Python via Pyodide (lazy CDN
  load), JS via sandboxed Web Worker (5s timeout). TS deferred.
- `src/lib/problems.ts` — small problem bank (Two Sum, Valid Parentheses, Merge
  Intervals) with per-language starter code.
- `src/app/api/chat/route.ts` — the **interviewer**: system prompt is a
  technical interviewer with the problem embedded; the candidate's code + last
  run output are appended (in brackets) to each user turn so the model "sees"
  the editor. Now session-scoped (via `sessionId`) and supports a `kickoff`
  turn (no audio) where the interviewer greets and presents the problem first.
- `src/lib/session-store.ts` — in-memory per-session interview state
  (history + problemId), keyed by `sessionId`, with TTL eviction. Replaced the
  old module-global `conversationHistory`. `resetSession` runs on kickoff.
- `src/app/api/assess/route.ts` — non-streaming endpoint that builds a
  structured JSON scorecard (recommendation, per-axis scores, strengths,
  improvements, summary) from the session transcript + final code.
- `src/components/Scorecard.tsx` — modal that renders the assessment.
- The interview opens automatically: `VoiceChat.runTurn({ kickoff: true })`
  fires on start so the interviewer speaks first.

### Voice spike core
- `src/lib/vad.ts` — raw-PCM VAD via ScriptProcessorNode. Ring buffer keeps
  ~400ms pre-roll so the first syllable isn't clipped. Emits a WAV Blob.
  `freeze()`/`unfreeze()` pause it during processing/playback (echo prevention).
- `src/lib/openrouter.ts` — `transcribe`, `chatStream`, `textToSpeechPcm`,
  `pcmToWav`, `parseSseStream` (sentence-segmented).
- `src/app/api/chat/route.ts` — orchestrates pipeline, streams NDJSON, keeps
  in-memory `conversationHistory` (NOTE: module-global, not per-session — fine
  for spike, must become per-session for real product).
- `src/components/VoiceChat.tsx` — main UI; VAD + streaming + `<audio>` playback
  + chat history + debug log + latency display.

## HARD-WON LEARNINGS (don't rediscover these the hard way)

OpenRouter audio API quirks:
- **STT endpoint** = `POST /api/v1/audio/transcriptions` with **JSON body**
  `{ model, language, input_audio: { data: base64, format } }`. NOT multipart,
  NOT chat-completions. (Wasted several rounds on this.)
- **STT model** = `openai/gpt-4o-mini-transcribe`. `whisper-large-v3` returned
  "Provider returned 400" on webm. `whisper-1` works but less accurate.
- Send STT audio as **WAV** (`format: "wav"`), produced by our raw-PCM VAD —
  webm from sliced MediaRecorder chunks is headerless and gets rejected.
- **TTS endpoint** = `POST /api/v1/audio/speech`. There are **NO OpenAI TTS
  models** on OpenRouter. Use `google/gemini-3.1-flash-tts-preview`.
- Gemini TTS **only supports `response_format: "pcm"`** (mp3 → 400). It's
  24kHz 16-bit mono. We wrap it in a WAV header server-side (`pcmToWav`).
- Gemini TTS voice **`Kore` speaks KOREAN** despite being listed neutral. Use
  **`Aoede`** (warm female) — current choice. Others: Zephyr, Leda (female);
  Puck, Charon (male).
- LLM = `anthropic/claude-sonnet-4-6` (streaming via SSE).

Code execution:
- **Piston public API (emkc.org) is whitelist-only as of 2026-02-15** — it now
  returns a "whitelist only" message instead of running code. Do NOT rely on it.
- So we execute **in the browser** instead: Pyodide (jsdelivr CDN reachable) for
  Python, a Web Worker for JavaScript. This keeps us backend-free (fits "no
  backend until we prove concept"), no API key, no per-run cost. First Python
  run downloads ~10MB of WASM (one-time per session). JS runs instantly.
- Judge0 CE public (`ce.judge0.com`) is reachable too if we ever want a
  server-side multi-language sandbox, but RapidAPI Judge0 needs a key.

VAD / audio:
- Must capture **raw PCM** (not MediaRecorder webm) to support a pre-roll buffer
  cleanly. `silenceThreshold` is on an RMS*100 scale → **1.5** (not 15).
- Freeze the VAD during processing+playback or the mic picks up the playback
  audio (echo → ghost speech).

## Env vars (.env.local — gitignored)

```
OPENROUTER_API_KEY=...
```

## Repo / workflow notes

- GitHub: `sean1588/interview-sim`. Default branch is **main** (we develop
  directly on main now — user merged the original feature branch PR #1).
- Notion page: "Interview Sim" under "AI Tasks" →
  https://app.notion.com/p/37771f4cdd62811297ffcc81f7ca4e95
- Build check: `npm run build`. Run locally: `npm run dev` (localhost:3000).
