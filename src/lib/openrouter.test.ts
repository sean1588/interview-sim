import { describe, it, expect } from "vitest";
import { parseSseStream, type EditorBlock } from "@/lib/openrouter";

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

// Each string is one delta, so splitting a marker across entries exercises the
// splitter's partial-marker handling exactly as a real token stream would.
async function collectE(contents: string[]) {
  const sentences: string[] = [];
  const editors: EditorBlock[] = [];
  const full = await parseSseStream(
    streamFromChunks([...contents.map(delta), "data: [DONE]\n"]),
    (s) => sentences.push(s),
    (b) => editors.push(b)
  );
  return { sentences, editors, full };
}

describe("parseSseStream — <editor> blocks (freestyle)", () => {
  it("pulls a clean block out of the spoken stream", async () => {
    const { sentences, editors, full } = await collectE([
      "Here is a problem for you. ",
      '<editor lang="python">\n',
      "def f():\n    pass\n",
      "</editor>",
      " Take a look.",
    ]);

    expect(sentences).toEqual(["Here is a problem for you.", "Take a look."]);
    expect(editors).toHaveLength(1);
    expect(editors[0].language).toBe("python");
    expect(editors[0].code).toContain("def f():");
    expect(editors[0].code).toContain("pass");

    // The block never leaks into spoken text / history.
    expect(full).not.toContain("<editor");
    expect(full).not.toContain("def f()");
  });

  it("handles open and close tags split across many deltas", async () => {
    const { sentences, editors, full } = await collectE([
      "Loading. ",
      "<",
      "editor",
      " lang=",
      '"javascript"',
      ">",
      "console.log(1)",
      "</",
      "editor",
      ">",
      " Done.",
    ]);

    expect(sentences).toEqual(["Loading.", "Done."]);
    expect(editors).toEqual([
      { language: "javascript", code: "console.log(1)" },
    ]);
    // No fragment of either tag was ever spoken.
    expect(full).not.toContain("<");
    expect(full).not.toContain("editor");
  });

  it("keeps text before and after a block, in order", async () => {
    const { sentences, editors } = await collectE([
      "First. ",
      '<editor lang="python">x = 1</editor>',
      "Second. ",
      "Third.",
    ]);
    expect(sentences).toEqual(["First.", "Second.", "Third."]);
    expect(editors).toEqual([{ language: "python", code: "x = 1" }]);
  });

  it("emits multiple blocks in one turn", async () => {
    const { editors } = await collectE([
      '<editor lang="python">a = 1</editor>',
      " and then ",
      '<editor lang="javascript">let b = 2;</editor>',
    ]);
    expect(editors).toEqual([
      { language: "python", code: "a = 1" },
      { language: "javascript", code: "let b = 2;" },
    ]);
  });

  it("drops an unterminated block — never loads partial code", async () => {
    const { sentences, editors, full } = await collectE([
      "Setting up. ",
      '<editor lang="python">',
      "def f(): pass",
      // stream ends with no </editor>
    ]);
    expect(sentences).toEqual(["Setting up."]);
    expect(editors).toEqual([]);
    expect(full).not.toContain("def f()");
  });

  it("matches a mixed-case </EDITOR> close (symmetric with the case-insensitive open)", async () => {
    const { sentences, editors } = await collectE([
      '<editor lang="python">x = 1</EDITOR>',
      " ok.",
    ]);
    expect(editors).toEqual([{ language: "python", code: "x = 1" }]);
    expect(sentences).toEqual(["ok."]);
  });

  it("captures lang regardless of attribute order or extra attributes", async () => {
    const { editors } = await collectE([
      '<editor id="a" lang="javascript" data-x="1">let y = 2;</editor>',
    ]);
    expect(editors).toEqual([{ language: "javascript", code: "let y = 2;" }]);
  });

  it("accepts <editor> with no lang (empty) rather than speaking the tag", async () => {
    const { editors, full } = await collectE([
      "<editor>print(1)</editor>",
      " there.",
    ]);
    expect(editors).toEqual([{ language: "", code: "print(1)" }]);
    expect(full).not.toContain("<editor");
  });

  it("speaks a trailing '<' that never became a tag (no prose dropped at EOS)", async () => {
    const { sentences, full } = await collectE(["compare a ", "<"]);
    expect(full).toContain("<");
    expect(sentences).toEqual(["compare a <"]);
  });
});
