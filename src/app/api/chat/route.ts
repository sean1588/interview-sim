import { NextRequest } from "next/server";
import {
  transcribe,
  chatStream,
  textToSpeechPcm,
  pcmToWav,
  parseSseStream,
} from "@/lib/openrouter";

function interviewerSystemPrompt(opts: {
  problemTitle?: string;
  problemPrompt?: string;
}): string {
  const base = `You are a warm but sharp technical interviewer conducting a live coding interview by voice.
You can SEE the candidate's editor — their current code and latest run output are appended to each of their messages in brackets. Do not read that bracketed context aloud; just use it.

How to behave:
- Speak naturally, 1-3 sentences at a time, like a real conversation. You're speaking out loud, so NEVER use markdown, code blocks, bullet points, or formatting.
- Don't dump the whole problem at once or give the solution away. Let the candidate drive. Ask what their approach is, nudge with hints when they're stuck, and probe edge cases and complexity.
- React to what's actually in their editor: if they just wrote a brute-force loop, ask about time complexity; if their run failed, ask what they think went wrong.
- Be encouraging and conversational, not a quizmaster. One question or comment at a time.`;

  const problem =
    opts.problemTitle && opts.problemPrompt
      ? `\n\nThe problem the candidate is working on is "${opts.problemTitle}":\n${opts.problemPrompt}`
      : "";

  return base + problem;
}

const conversationHistory: { role: string; content: string }[] = [];

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as Blob | null;

    if (!audioFile) {
      return new Response(JSON.stringify({ error: "No audio provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const code = (formData.get("code") as string | null) ?? "";
    const language = (formData.get("language") as string | null) ?? "";
    const problemTitle = (formData.get("problemTitle") as string | null) ?? "";
    const problemPrompt = (formData.get("problemPrompt") as string | null) ?? "";
    const lastRun = (formData.get("lastRun") as string | null) ?? "";

    const transcript = await transcribe(audioFile);
    if (!transcript.trim()) {
      return new Response(JSON.stringify({ error: "No speech detected" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Build the user turn with the live editor context attached. The model is
    // told (in the system prompt) not to read the bracketed part aloud.
    const editorContext =
      code || lastRun
        ? `\n\n[Editor state — ${language || "code"}:\n${code || "(empty)"}\n]` +
          (lastRun ? `\n[Latest run output:\n${lastRun}\n]` : "")
        : "";

    conversationHistory.push({
      role: "user",
      content: transcript + editorContext,
    });

    // Keep the system prompt at index 0, refreshed with the current problem.
    const systemMsg = {
      role: "system",
      content: interviewerSystemPrompt({ problemTitle, problemPrompt }),
    };
    const messages = [systemMsg, ...conversationHistory];

    const llmStream = await chatStream(messages);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Send transcript immediately so client can show it
        controller.enqueue(
          encoder.encode(
            JSON.stringify({ type: "transcript", text: transcript }) + "\n"
          )
        );

        const ttsQueue: Promise<void>[] = [];
        let sentenceIndex = 0;

        const fullResponse = await parseSseStream(
          llmStream,
          (sentence: string) => {
            const idx = sentenceIndex++;
            // Send the text chunk so client can display it progressively
            controller.enqueue(
              encoder.encode(
                JSON.stringify({ type: "text", text: sentence, index: idx }) + "\n"
              )
            );

            // Fire off TTS for this sentence immediately (don't await)
            const ttsPromise = textToSpeechPcm(sentence)
              .then((pcm) => {
                const wav = pcmToWav(pcm);
                const b64 = wav.toString("base64");
                controller.enqueue(
                  encoder.encode(
                    JSON.stringify({ type: "audio", data: b64, index: idx }) + "\n"
                  )
                );
              })
              .catch((err) => {
                console.error(`[TTS] Sentence ${idx} failed:`, err);
              });

            ttsQueue.push(ttsPromise);
          }
        );

        // Wait for all TTS to finish
        await Promise.all(ttsQueue);

        conversationHistory.push({ role: "assistant", content: fullResponse });
        // Cap history (system prompt is added per-request, not stored here).
        if (conversationHistory.length > 20) {
          conversationHistory.splice(0, conversationHistory.length - 20);
        }

        controller.enqueue(
          encoder.encode(
            JSON.stringify({ type: "done", fullResponse }) + "\n"
          )
        );
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Chat pipeline error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Pipeline failed",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
