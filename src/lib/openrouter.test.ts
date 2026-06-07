import { describe, it, expect } from "vitest";
import { parseSseStream } from "@/lib/openrouter";

/** Build a ReadableStream that emits the given strings as separate chunks. */
function streamFromChunks(chunks: string[]): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  let i = 0;
  return new ReadableStream({
    pull(controller) {
      if (i < chunks.length) controller.enqueue(enc.encode(chunks[i++]));
      else controller.close();
    },
  });
}

const delta = (content: string) =>
  `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n`;

async function collect(chunks: string[]) {
  const sentences: string[] = [];
  const full = await parseSseStream(streamFromChunks(chunks), (s) =>
    sentences.push(s)
  );
  return { sentences, full };
}

describe("parseSseStream", () => {
  it("segments on sentence-ending punctuation", async () => {
    const { sentences, full } = await collect([
      delta("Hello"),
      delta(" world."),
      delta(" How"),
      delta(" are you?"),
      "data: [DONE]\n",
    ]);
    expect(sentences).toEqual(["Hello world.", "How are you?"]);
    expect(full).toBe("Hello world. How are you?");
  });

  it("flushes the trailing partial sentence on [DONE]", async () => {
    const { sentences } = await collect([
      delta("No period here"),
      "data: [DONE]\n",
    ]);
    expect(sentences).toEqual(["No period here"]);
  });

  it("flushes the trailing partial when the stream just ends (no [DONE])", async () => {
    const { sentences } = await collect([delta("dangling text")]);
    expect(sentences).toEqual(["dangling text"]);
  });

  it("reassembles a data line split across chunk boundaries", async () => {
    const line = delta("Hi.");
    const mid = Math.floor(line.length / 2);
    const { sentences } = await collect([line.slice(0, mid), line.slice(mid)]);
    expect(sentences).toEqual(["Hi."]);
  });

  it("force-flushes once a sentence passes the 200-char cap", async () => {
    const long = "x".repeat(250); // no punctuation
    const { sentences } = await collect([delta(long), "data: [DONE]\n"]);
    expect(sentences.length).toBe(1);
    expect(sentences[0].length).toBeGreaterThan(200);
  });

  it("skips malformed chunks without throwing", async () => {
    const { sentences } = await collect([
      "data: not-json\n",
      delta("Recovered."),
      "data: [DONE]\n",
    ]);
    expect(sentences).toEqual(["Recovered."]);
  });
});
