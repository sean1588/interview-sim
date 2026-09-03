import { DEFAULT_MODEL } from "@/lib/model-prefs";

export type ChatMessage = { role: string; content: string };

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

/** POST to OpenRouter with auth headers; throws with the response body on !ok. */
async function openrouterPost(path: string, body: unknown): Promise<Response> {
  const res = await fetch(`${OPENROUTER_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`OpenRouter ${path} failed (${res.status}): ${errBody}`);
  }
  return res;
}

export async function transcribe(audioBlob: Blob): Promise<string> {
  const arrayBuffer = await audioBlob.arrayBuffer();
  const base64Audio = Buffer.from(arrayBuffer).toString("base64");

  console.log(
    `[STT] Sending ${audioBlob.size} bytes, type=${audioBlob.type}, base64 len=${base64Audio.length}`
  );

  const res = await openrouterPost("/audio/transcriptions", {
    model: "openai/gpt-4o-mini-transcribe",
    language: "en",
    input_audio: { data: base64Audio, format: "wav" },
  });

  const data = await res.json();
  console.log(`[STT] Transcription: "${data.text}"`);
  return data.text || "";
}

/** `model` is the caller's chosen chat model (see model-prefs.ts); omitting it
 * keeps the default. Speech — transcribe / textToSpeechPcm above and below —
 * deliberately stays on its own fixed models: those are speech endpoints, and
 * an arbitrary chat model from the picker would break them. */
export async function chatStream(
  messages: ChatMessage[],
  model: string = DEFAULT_MODEL
): Promise<ReadableStream<Uint8Array>> {
  const res = await openrouterPost("/chat/completions", {
    model,
    messages,
    stream: true,
  });
  return res.body!;
}

/** Non-streaming chat completion — used for the structured assessment.
 * `opts.model` selects the chat model; omitting it keeps the default. */
export async function chatComplete(
  messages: ChatMessage[],
  opts?: { jsonMode?: boolean; temperature?: number; model?: string }
): Promise<string> {
  const res = await openrouterPost("/chat/completions", {
    model: opts?.model ?? DEFAULT_MODEL,
    messages,
    stream: false,
    temperature: opts?.temperature ?? 0.3,
    ...(opts?.jsonMode ? { response_format: { type: "json_object" } } : {}),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

export async function textToSpeechPcm(text: string): Promise<Buffer> {
  const res = await openrouterPost("/audio/speech", {
    model: "google/gemini-3.1-flash-tts-preview",
    input: text,
    voice: "Aoede",
    response_format: "pcm",
  });
  return Buffer.from(await res.arrayBuffer());
}

/** A block the model asked us to load into the editor (freestyle mode). */
export interface EditorBlock {
  language: string;
  code: string;
}

export interface TutorNoteBlock {
  text: string;
}

// The agent (freestyle, and the learning tutor) can write the editor by emitting
// a sentinel block:
//   <editor lang="python"> ...full new editor contents... </editor>
// This text must never reach TTS, and the body is surfaced via onEditor. The
// markers can be split across token deltas, so the splitter below holds back any
// trailing text that could be the start of a marker until it resolves.
//
// Matching is deliberately lenient and symmetric: the open tag is matched
// generically (any attribute order, optional lang) and the close case-
// insensitively, so a small drift in what the model emits degrades to "no block
// loaded" rather than reading the raw tag aloud. The one collision a plain-text
// sentinel can't escape is code that literally contains "</editor>"; the
// system prompts that define the protocol tell the model not to emit that inside
// a block.
const EDITOR_OPEN_RE = /<editor\b[^>]*>/i;
const EDITOR_LANG_RE = /\blang\s*=\s*["']([^"']*)["']/i;
const EDITOR_CLOSE_RE = /<\/editor\s*>/i;
// Tail that could be an <editor …> open tag still arriving (no '>' yet).
const EDITOR_PARTIAL_OPEN_RE = /^<editor\b[^>]*$/i;
const NOTES_OPEN_RE = /<notes\b[^>]*>/i;
const NOTES_CLOSE_RE = /<\/notes\s*>/i;
const NOTES_PARTIAL_OPEN_RE = /^<notes\b[^>]*$/i;

/**
 * Read an OpenRouter SSE chat stream. Spoken text is segmented into sentences
 * (on a sentence boundary or a 200-char cap) and handed to `onSentence` for TTS;
 * any `<editor>` block is pulled out of the spoken stream and handed to
 * `onEditor` instead. Resolves with the SPOKEN text only (editor blocks removed),
 * which is what callers store as history and show in the transcript.
 */
export async function parseSseStream(
  stream: ReadableStream<Uint8Array>,
  onSentence: (sentence: string) => void,
  onEditor?: (block: EditorBlock) => void,
  onTutorNote?: (block: TutorNoteBlock) => void
): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let spokenText = "";
  let currentSentence = "";

  // Splitter state. Invariant: while not capturing, unprocessed text lives in
  // `work`; while capturing (inside an <editor> block) it lives in `captureBuf`.
  let capturing = false;
  let captureBuf = "";
  let captureLang = "";
  let captureKind: "editor" | "notes" = "editor";
  let work = "";

  const flushSentence = () => {
    const sentence = currentSentence.trim();
    if (sentence) onSentence(sentence);
    currentSentence = "";
  };

  // Commit spoken text, flushing on a sentence boundary or length cap as before.
  const speak = (text: string) => {
    if (!text) return;
    spokenText += text;
    currentSentence += text;
    if (/[.!?]\s*$/.test(currentSentence) || currentSentence.length > 200) {
      flushSentence();
    }
  };

  const drain = () => {
    // Loop while each open/close tag we consume may expose more to process.
    for (;;) {
      if (capturing) {
        const close = captureBuf.match(
          captureKind === "notes" ? NOTES_CLOSE_RE : EDITOR_CLOSE_RE
        );
        if (!close) return; // closing tag not here yet; keep accumulating
        const at = close.index ?? 0;
        const body = captureBuf.slice(0, at);
        if (captureKind === "notes") {
          const text = body.trim();
          if (text) onTutorNote?.({ text });
        } else {
          onEditor?.({ language: captureLang, code: body });
        }
        work = captureBuf.slice(at + close[0].length);
        capturing = false;
        captureBuf = "";
        captureLang = "";
        continue; // process anything after the block as spoken text
      }

      const editorOpen = work.match(EDITOR_OPEN_RE);
      const notesOpen = onTutorNote ? work.match(NOTES_OPEN_RE) : null;
      const open =
        editorOpen && notesOpen
          ? (editorOpen.index ?? 0) < (notesOpen.index ?? 0)
            ? editorOpen
            : notesOpen
          : editorOpen ?? notesOpen;
      if (open) {
        const at = open.index ?? 0;
        speak(work.slice(0, at)); // text before the tag is spoken
        captureKind = open[0].toLowerCase().startsWith("<notes") ? "notes" : "editor";
        captureLang =
          captureKind === "editor" ? (open[0].match(EDITOR_LANG_RE)?.[1] ?? "") : "";
        captureBuf = work.slice(at + open[0].length);
        work = "";
        capturing = true;
        continue;
      }

      // No complete open tag. Hold back a trailing fragment that could be an
      // <editor …> tag still arriving; speak everything before it.
      const lt = work.lastIndexOf("<");
      if (lt !== -1) {
        const tail = work.slice(lt);
        const partialOpen =
          "<editor".startsWith(tail.toLowerCase()) || // "<", "<e", … "<editor"
          EDITOR_PARTIAL_OPEN_RE.test(tail) || // "<editor lang=…" with no '>' yet
          (Boolean(onTutorNote) &&
            ("<notes".startsWith(tail.toLowerCase()) ||
              NOTES_PARTIAL_OPEN_RE.test(tail)));
        if (partialOpen) {
          speak(work.slice(0, lt));
          work = work.slice(lt);
          return;
        }
      }
      speak(work);
      work = "";
      return;
    }
  };

  const feed = (token: string) => {
    if (capturing) captureBuf += token;
    else work += token;
    drain();
  };

  const finish = () => {
    // A held-back tail that never resolved into an <editor> tag is just ordinary
    // prose (e.g. a response ending on "a <") — speak it. Only an actually
    // unterminated block (capturing) is dropped: never load half-written code.
    if (!capturing && work) speak(work);
    work = "";
    flushSentence();
    return spokenText;
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6).trim();
      if (payload === "[DONE]") return finish();
      try {
        const token = JSON.parse(payload).choices?.[0]?.delta?.content;
        if (token) feed(token);
      } catch {
        // skip malformed chunks
      }
    }
  }

  return finish();
}
