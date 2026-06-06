import { NextRequest } from "next/server";
import {
  transcribe,
  chatStream,
  textToSpeechPcm,
  pcmToWav,
  parseSseStream,
} from "@/lib/openrouter";
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
      return new Response(JSON.stringify({ error: "No sessionId provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (!audioFile && !kickoff) {
      return new Response(JSON.stringify({ error: "No audio provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
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
        return new Response(JSON.stringify({ error: "No speech detected" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    const session = getSession(sessionId);

    if (kickoff) {
      session.history.push({ role: "user", content: KICKOFF_PROMPT });
    } else {
      // Attach the live editor context. The model is told (in the system
      // prompt) not to read the bracketed part aloud.
      const editorContext =
        code || lastRun
          ? `\n\n[Editor state — ${language || "code"}:\n${code || "(empty)"}\n]` +
            (lastRun ? `\n[Latest run output:\n${lastRun}\n]` : "")
          : "";
      session.history.push({
        role: "user",
        content: transcript + editorContext,
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
