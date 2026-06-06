import { NextRequest } from "next/server";
import {
  transcribe,
  chatStream,
  textToSpeechPcm,
  pcmToWav,
  parseSseStream,
} from "@/lib/openrouter";

const SYSTEM_PROMPT = `You are a friendly, conversational AI character having a voice conversation.
Keep your responses concise — 1-3 sentences max, like a real conversation.
Be natural, warm, and engaging. Ask follow-up questions to keep the conversation going.
Never use markdown, bullet points, or formatting — you're speaking out loud.`;

const conversationHistory: { role: string; content: string }[] = [
  { role: "system", content: SYSTEM_PROMPT },
];

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

    const transcript = await transcribe(audioFile);
    if (!transcript.trim()) {
      return new Response(JSON.stringify({ error: "No speech detected" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    conversationHistory.push({ role: "user", content: transcript });

    const llmStream = await chatStream(conversationHistory);

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
        if (conversationHistory.length > 21) {
          conversationHistory.splice(1, 2);
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
