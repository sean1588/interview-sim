export async function transcribe(audioBlob: Blob): Promise<string> {
  const arrayBuffer = await audioBlob.arrayBuffer();
  const base64Audio = Buffer.from(arrayBuffer).toString("base64");

  console.log(
    `[STT] Sending ${audioBlob.size} bytes, type=${audioBlob.type}, base64 len=${base64Audio.length}`
  );

  const res = await fetch("https://openrouter.ai/api/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/gpt-4o-mini-transcribe",
      language: "en",
      input_audio: {
        data: base64Audio,
        format: "wav",
      },
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error(`[STT] Error response: ${errBody}`);
    throw new Error(`STT failed (${res.status}): ${errBody}`);
  }

  const data = await res.json();
  console.log(`[STT] Transcription: "${data.text}"`);
  return data.text || "";
}

export async function chatStream(
  messages: { role: string; content: string }[]
): Promise<ReadableStream<Uint8Array>> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "anthropic/claude-sonnet-4-6",
      messages,
      stream: true,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`LLM failed (${res.status}): ${body}`);
  }

  return res.body!;
}

/** Non-streaming chat completion — used for the structured assessment. */
export async function chatComplete(
  messages: { role: string; content: string }[],
  opts?: { jsonMode?: boolean; temperature?: number }
): Promise<string> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "anthropic/claude-sonnet-4-6",
      messages,
      stream: false,
      temperature: opts?.temperature ?? 0.3,
      ...(opts?.jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`LLM failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

export async function textToSpeechPcm(text: string): Promise<Buffer> {
  const res = await fetch("https://openrouter.ai/api/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3.1-flash-tts-preview",
      input: text,
      voice: "Aoede",
      response_format: "pcm",
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error(`[TTS] Error response: ${errBody}`);
    throw new Error(`TTS failed (${res.status}): ${errBody}`);
  }

  return Buffer.from(await res.arrayBuffer());
}

export function pcmToWav(
  pcm: Buffer,
  sampleRate: number = 24000,
  channels: number = 1,
  bitsPerSample: number = 16
): Buffer {
  const byteRate = (sampleRate * channels * bitsPerSample) / 8;
  const blockAlign = (channels * bitsPerSample) / 8;
  const header = Buffer.alloc(44);

  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);

  return Buffer.concat([header, pcm]);
}

export function parseSseStream(
  stream: ReadableStream<Uint8Array>,
  onSentence: (sentence: string) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let fullText = "";
    let currentSentence = "";

    function flush() {
      if (currentSentence.trim()) {
        onSentence(currentSentence.trim());
        currentSentence = "";
      }
    }

    function read() {
      reader
        .read()
        .then(({ done, value }) => {
          if (done) {
            flush();
            resolve(fullText);
            return;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const payload = line.slice(6).trim();
            if (payload === "[DONE]") {
              flush();
              resolve(fullText);
              return;
            }
            try {
              const parsed = JSON.parse(payload);
              const token = parsed.choices?.[0]?.delta?.content;
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

          read();
        })
        .catch(reject);
    }

    read();
  });
}
