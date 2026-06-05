const BASE_URL = "https://openrouter.ai/api/v1";

function headers() {
  return {
    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
  };
}

export async function transcribe(audioBlob: Blob): Promise<string> {
  const arrayBuffer = await audioBlob.arrayBuffer();
  const file = new File([arrayBuffer], "audio.webm", {
    type: "audio/webm",
  });

  const form = new FormData();
  form.append("file", file);
  form.append("model", "openai/whisper-large-v3");

  const res = await fetch(`${BASE_URL}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` },
    body: form,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`STT failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  return data.text;
}

export async function chatStream(
  messages: { role: string; content: string }[]
): Promise<ReadableStream<Uint8Array>> {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: { ...headers(), "Content-Type": "application/json" },
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

export async function textToSpeech(text: string): Promise<ArrayBuffer> {
  const res = await fetch(`${BASE_URL}/audio/speech`, {
    method: "POST",
    headers: { ...headers(), "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "openai/tts-1",
      input: text,
      voice: "nova",
      response_format: "mp3",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`TTS failed (${res.status}): ${body}`);
  }

  return res.arrayBuffer();
}

export function parseSseStream(
  stream: ReadableStream<Uint8Array>,
  onToken: (token: string) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let fullText = "";

    function read() {
      reader
        .read()
        .then(({ done, value }) => {
          if (done) {
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
              resolve(fullText);
              return;
            }
            try {
              const parsed = JSON.parse(payload);
              const token = parsed.choices?.[0]?.delta?.content;
              if (token) {
                fullText += token;
                onToken(token);
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
