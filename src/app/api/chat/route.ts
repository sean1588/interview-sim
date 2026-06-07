import { NextRequest } from "next/server";
import {
  transcribe,
  chatStream,
  textToSpeechPcm,
  parseSseStream,
} from "@/lib/openrouter";
import { pcmToWav } from "@/lib/wav";
import { formatEditorContext } from "@/lib/editor-context";
import { getSession, resetSession } from "@/lib/session-store";

function interviewerSystemPrompt(opts: {
  problemTitle?: string;
  problemPrompt?: string;
}): string {
  const base = `You are a warm but sharp technical interviewer conducting a live coding interview by voice.
You can SEE the candidate's editor — their current code and latest run output are appended to each of their messages in brackets. Do not read that bracketed context aloud; just use it.

How to behave:
- Speak naturally, 1-3 sentences at a time, like a real conversation. You're speaking out loud, so NEVER use markdown, code blocks, bullet points, or formatting.
- The interview flows in phases: greet and present the problem, let the candidate think aloud and plan, watch them implement (hint only when they're genuinely stuck — don't give the solution away), then review edge cases and time/space complexity.
- React to what's actually in their editor: if they just wrote a brute-force loop, ask about time complexity; if their run failed, ask what they think went wrong.
- Be encouraging and conversational, not a quizmaster. One question or comment at a time.`;

  const problem =
    opts.problemTitle && opts.problemPrompt
      ? `\n\nThe problem the candidate is working on is "${opts.problemTitle}":\n${opts.problemPrompt}`
      : "";

  return base + problem;
}

// Stage direction used to open the interview (kickoff turn, no candidate audio).
const KICKOFF_PROMPT =
  "[The interview is now starting. Greet the candidate warmly, briefly introduce yourself as their interviewer, and present this problem conversationally — don't read it out word for word or list every constraint. Then invite them to share their initial thoughts.]";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as Blob | null;
    const sessionId = (formData.get("sessionId") as string | null) ?? "";
    const kickoff = (formData.get("kickoff") as string | null) === "true";

    if (!sessionId) {
      return Response.json({ error: "No sessionId provided" }, { status: 400 });
    }
    if (!audioFile && !kickoff) {
      return Response.json({ error: "No audio provided" }, { status: 400 });
    }

    const code = (formData.get("code") as string | null) ?? "";
    const language = (formData.get("language") as string | null) ?? "";
    const problemId = (formData.get("problemId") as string | null) ?? "";
    const problemTitle = (formData.get("problemTitle") as string | null) ?? "";
    const problemPrompt = (formData.get("problemPrompt") as string | null) ?? "";
    const lastRun = (formData.get("lastRun") as string | null) ?? "";

    // Kickoff starts a fresh interview; otherwise transcribe the candidate.
    let transcript = "";
    if (kickoff) {
      resetSession(sessionId, problemId || null);
    } else {
      transcript = await transcribe(audioFile as Blob);
      if (!transcript.trim()) {
        return Response.json({ error: "No speech detected" }, { status: 400 });
      }
    }

    const session = getSession(sessionId);

    if (kickoff) {
      session.history.push({ role: "user", content: KICKOFF_PROMPT });
    } else {
      // Attach the live editor context. The model is told (in the system
      // prompt) not to read the bracketed part aloud.
      session.history.push({
        role: "user",
        content: transcript + formatEditorContext({ code, language, lastRun }),
      });
    }

    const systemMsg = {
      role: "system",
      content: interviewerSystemPrompt({ problemTitle, problemPrompt }),
    };
    const messages = [systemMsg, ...session.history];

    const llmStream = await chatStream(messages);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Send transcript immediately so client can show it (none on kickoff).
        if (transcript) {
          controller.enqueue(
            encoder.encode(
              JSON.stringify({ type: "transcript", text: transcript }) + "\n"
            )
          );
        }

        // TTS runs concurrently per sentence, but the audio chunks MUST reach
        // the client in sentence order or the interviewer speaks out of order.
        // Each finished chunk parks in `ready` keyed by its index; `flushReady`
        // drains them strictly in sequence from `nextToFlush`. A failed TTS
        // parks an empty string so the cursor still advances past it.
        const ttsTasks: Promise<void>[] = [];
        const ready = new Map<number, string>();
        let sentenceIndex = 0;
        let nextToFlush = 0;

        const flushReady = () => {
          while (ready.has(nextToFlush)) {
            const b64 = ready.get(nextToFlush)!;
            ready.delete(nextToFlush);
            if (b64) {
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({ type: "audio", data: b64 }) + "\n"
                )
              );
            }
            nextToFlush++;
          }
        };

        const fullResponse = await parseSseStream(
          llmStream,
          (sentence: string) => {
            const idx = sentenceIndex++;
            // Send the text chunk so client can display it progressively
            controller.enqueue(
              encoder.encode(
                JSON.stringify({ type: "text", text: sentence }) + "\n"
              )
            );

            // Fire off TTS for this sentence immediately (don't await)
            const task = textToSpeechPcm(sentence)
              .then((pcm) => {
                ready.set(idx, Buffer.from(pcmToWav(pcm)).toString("base64"));
                flushReady();
              })
              .catch((err) => {
                console.error(`[TTS] Sentence ${idx} failed:`, err);
                ready.set(idx, "");
                flushReady();
              });

            ttsTasks.push(task);
          }
        );

        // Wait for all TTS to finish
        await Promise.all(ttsTasks);

        session.history.push({ role: "assistant", content: fullResponse });
        // Cap history (system prompt is added per-request, not stored here).
        if (session.history.length > 24) {
          session.history.splice(0, session.history.length - 24);
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
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Chat pipeline error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Pipeline failed" },
      { status: 500 }
    );
  }
}
