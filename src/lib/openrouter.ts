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

export async function chatStream(
  messages: ChatMessage[]
): Promise<ReadableStream<Uint8Array>> {
  const res = await openrouterPost("/chat/completions", {
    model: "anthropic/claude-sonnet-4-6",
    messages,
    stream: true,
  });
  return res.body!;
}

/** Non-streaming chat completion — used for the structured assessment. */
export async function chatComplete(
  messages: ChatMessage[],
  opts?: { jsonMode?: boolean; temperature?: number }
): Promise<string> {
  const res = await openrouterPost("/chat/completions", {
    model: "anthropic/claude-sonnet-4-6",
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

/**
 * Read an OpenRouter SSE chat stream, accumulating tokens and invoking
 * `onSentence` each time a sentence boundary (or a 200-char cap) is reached.
 * Resolves with the full concatenated text.
 */
export async function parseSseStream(
  stream: ReadableStream<Uint8Array>,
  onSentence: (sentence: string) => void
): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";
  let currentSentence = "";

  const flush = () => {
    const sentence = currentSentence.trim();
    if (sentence) onSentence(sentence);
    currentSentence = "";
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
      if (payload === "[DONE]") {
        flush();
        return fullText;
      }
      try {
        const token = JSON.parse(payload).choices?.[0]?.delta?.content;
        if (token) {
          fullText += token;
          currentSentence += token;
          if (/[.!?]\s*$/.test(currentSentence) || currentSentence.length > 200) {
            flush();
          }
        }
      } catch {
        // skip malformed chunks
      }
    }
  }

  flush();
  return fullText;
}
