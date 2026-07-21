import { NextRequest } from "next/server";
import {
  transcribe,
  chatStream,
  textToSpeechPcm,
  parseSseStream,
} from "@/lib/openrouter";
import { pcmToWav } from "@/lib/wav";
import { formatEditorContext, formatNotesContext } from "@/lib/turn-context";
import { getSession, resetSession } from "@/lib/session-store";
import {
  getSystemPrompt,
  getKickoffPrompt,
  isValidSessionMode,
  type SessionMode,
} from "@/lib/prompts";
import { isValidLevel } from "@/lib/levels";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as Blob | null;
    // A typed turn (text mode) arrives as `text` instead of `audio`.
    const text = (formData.get("text") as string | null)?.trim() ?? "";
    const sessionId = (formData.get("sessionId") as string | null) ?? "";
    const kickoff = (formData.get("kickoff") as string | null) === "true";
    // Text turns ask the pipeline to skip TTS: no spoken audio, just streamed text.
    const silent = formData.get("silent") === "true";

    if (!sessionId) {
      return Response.json({ error: "No sessionId provided" }, { status: 400 });
    }
    if (!audioFile && !text && !kickoff) {
      return Response.json({ error: "No input provided" }, { status: 400 });
    }

    // Mode + common fields
    const rawMode = (formData.get("mode") as string | null) ?? "coding";
    const mode: SessionMode = isValidSessionMode(rawMode) ? rawMode : "coding";
    // Tutor mode is orthogonal to mode: same problem and scorecard, teaching
    // persona instead of an evaluative one. Ignored outside coding / system-design.
    const tutor = formData.get("tutor") === "true";

    const code = (formData.get("code") as string | null) ?? "";
    const language = (formData.get("language") as string | null) ?? "";
    const questionId = (formData.get("questionId") as string | null) ?? "";
    const questionTitle = (formData.get("questionTitle") as string | null) ?? "";
    const questionPrompt = (formData.get("questionPrompt") as string | null) ?? "";
    const lastRun = (formData.get("lastRun") as string | null) ?? "";
    const notes = (formData.get("notes") as string | null) ?? "";
    const rawLevel = formData.get("level") as string | null;
    const targetLevel = isValidLevel(rawLevel) ? rawLevel : undefined;

    // Kickoff starts a fresh interview. A typed turn is its own transcript;
    // otherwise transcribe the candidate's audio.
    let transcript = "";
    if (kickoff) {
      resetSession(sessionId, questionId || null);
    } else if (text) {
      transcript = text;
    } else {
      transcript = await transcribe(audioFile as Blob);
      if (!transcript.trim()) {
        return Response.json({ error: "No speech detected" }, { status: 400 });
      }
    }

    const session = getSession(sessionId);

    if (kickoff) {
      session.history.push({
        role: "user",
        content: getKickoffPrompt(mode, language, questionPrompt || undefined, tutor),
      });
    } else {
      // Attach the live editor context (coding) and/or notes (behavioral / system-design).
      // The mode-specific system prompt tells the model whether and how to use the bracketed part.
      session.history.push({
        role: "user",
        content:
          transcript +
          formatEditorContext({ code, language, lastRun }) +
          formatNotesContext(notes),
      });
    }

    const systemMsg = {
      role: "system",
      content: getSystemPrompt(mode, {
        questionTitle,
        questionPrompt,
        targetLevel,
        language,
        tutor,
      }),
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

            // Text turns are silent: stream the words, skip speech synthesis.
            if (silent) return;

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
          },
          // Freestyle: the agent can push starter code into the editor. These
          // blocks are pulled out of the spoken stream and forwarded as their
          // own NDJSON line so the client can apply them mid-turn.
          (block) => {
            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  type: "editor",
                  language: block.language,
                  code: block.code,
                }) + "\n"
              )
            );
          }
        );

        // Wait for all TTS to finish
        await Promise.all(ttsTasks);

        // An editor-only turn produces no spoken text; don't store an empty
        // assistant message (the loaded code round-trips as editor context).
        if (fullResponse.trim()) {
          session.history.push({ role: "assistant", content: fullResponse });
        }
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
