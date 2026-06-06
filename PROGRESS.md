# Interview Sim — Progress & Context

> Working memory for resuming this project. Last updated: spike validated, avatar working end-to-end.

## What we're building

An AI-powered **technical interview practice simulator** with an animated
interviewer character (Grok-companion style) you talk to by voice in real time.
Vision: split screen — animated interviewer on the left, a CoderPad-style coding
pane on the right. The interviewer speaks, watches you code, reacts, and assesses.

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
- [x] Simli avatar working end-to-end (user tested with a live key — "works great!")

**Decision reached:** OpenRouter pipeline is good enough — we are NOT using a
realtime speech-to-speech API. Keeps model flexibility + unified billing.
**Decision reached:** No framework (LangGraph/Pipecat). Hand-rolled pipeline is
~300 lines and the real complexity is in interview logic + editor state.

## Next steps (no big unknowns left — "just engineering")

1. **Code editor experience** — Monaco/CodeMirror pane, code execution
   (Judge0/Piston/e2b), feed editor state to the interviewer LLM in real time.
2. **Interview orchestration** — problem bank, flow (intro → problem → hints →
   review → assessment), structured scoring.
3. **Friendly 3D character** — swap default realistic Simli face for a custom
   character via `SIMLI_FACE_ID` (no code change needed).
4. **Behavioral mode.**
5. **Deployment** — AWS via Pulumi (ECS Fargate + ALB + ECR + Secrets Manager).
   Scoped at ~$35–70/mo. Deferred until there's a real product to host.

User's last open question to answer on resume: tackle the **code editor / core
product** next, or polish character/voice side first? (Leaning code editor.)

## Tech stack

- Next.js 16 (App Router, TypeScript, Turbopack), Tailwind CSS
- Web Audio API for mic capture + custom VAD
- `simli-client` (WebRTC) for the avatar
- NDJSON over chunked HTTP for streaming the pipeline back to the browser

## Architecture

```
Browser (mic + Simli avatar)
  → VAD (raw PCM, pre-roll ring buffer) captures utterance as WAV
  → POST /api/chat
      → STT → LLM (streaming) → TTS per sentence
      → streams NDJSON back: {type: transcript|text|audio|done}
  → audio routed to Simli avatar (PCM16@16kHz) OR <audio> fallback
```

## Key files

- `src/lib/vad.ts` — raw-PCM VAD via ScriptProcessorNode. Ring buffer keeps
  ~400ms pre-roll so the first syllable isn't clipped. Emits a WAV Blob.
  `freeze()`/`unfreeze()` pause it during processing/playback (echo prevention).
- `src/lib/openrouter.ts` — `transcribe`, `chatStream`, `textToSpeechPcm`,
  `pcmToWav`, `parseSseStream` (sentence-segmented).
- `src/app/api/chat/route.ts` — orchestrates pipeline, streams NDJSON, keeps
  in-memory `conversationHistory` (NOTE: module-global, not per-session — fine
  for spike, must become per-session for real product).
- `src/lib/audio.ts` — WAV(24kHz) → PCM16(16kHz) conversion for Simli.
- `src/app/api/simli-token/route.ts` — server-side Simli token (keeps API key
  off the browser). POST /compose/token + GET /compose/ice on api.simli.ai.
- `src/components/SimliAvatar.tsx` — imperative handle (init/sendAudio/clear/
  destroy) wrapping simli-client; renders the video element.
- `src/components/VoiceChat.tsx` — main UI; VAD + streaming + avatar routing +
  chat history + debug log + latency display.

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

VAD / audio:
- Must capture **raw PCM** (not MediaRecorder webm) to support a pre-roll buffer
  cleanly. `silenceThreshold` is on an RMS*100 scale → **1.5** (not 15).
- Freeze the VAD during processing+playback or the mic picks up the avatar's
  voice (echo → ghost speech).

Simli:
- simli-client (installed version) uses **session tokens**, not the older
  `Initialize()` pattern. `new SimliClient(session_token, videoEl, audioEl,
  iceServers)` then `.start()`, `.sendAudioData(Uint8Array PCM16@16kHz)`,
  `.ClearBuffer()` (barge-in), `.stop()`. Events: speaking/silent/error.
- Audio for Simli must be **PCM16 mono @ 16kHz** (we resample from 24kHz).
- Default placeholder face id `tmp9i8bbq7c` — may need a real one from the
  user's dashboard. Override via `SIMLI_FACE_ID`.
- "Avatar done speaking" uses the `silent` event after we've sent all audio
  (`donePendingRef`). May need timing tuning under real use.

## Env vars (.env.local — gitignored)

```
OPENROUTER_API_KEY=...
SIMLI_API_KEY=...          # optional; app falls back to audio-only without it
SIMLI_FACE_ID=             # blank = default realistic face
```

## Repo / workflow notes

- GitHub: `sean1588/interview-sim`. Default branch is **main** (we develop
  directly on main now — user merged the original feature branch PR #1).
- Notion page: "Interview Sim" under "AI Tasks" →
  https://app.notion.com/p/37771f4cdd62811297ffcc81f7ca4e95
- Build check: `npm run build`. Run locally: `npm run dev` (localhost:3000).
