import { NextRequest, NextResponse } from "next/server";
import { transcribe, chatStream, textToSpeech, parseSseStream } from "@/lib/openrouter";

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
      return NextResponse.json({ error: "No audio provided" }, { status: 400 });
    }

    const transcript = await transcribe(audioFile);
    if (!transcript.trim()) {
      return NextResponse.json({ error: "No speech detected" }, { status: 400 });
    }

    conversationHistory.push({ role: "user", content: transcript });

    const llmStream = await chatStream(conversationHistory);

    let fullResponse = "";
    const sentenceBuffer: string[] = [];
    let currentSentence = "";

    fullResponse = await parseSseStream(llmStream, (token) => {
      currentSentence += token;
      if (/[.!?]\s*$/.test(currentSentence) || currentSentence.length > 200) {
        sentenceBuffer.push(currentSentence.trim());
        currentSentence = "";
      }
    });

    if (currentSentence.trim()) {
      sentenceBuffer.push(currentSentence.trim());
    }

    conversationHistory.push({ role: "assistant", content: fullResponse });

    // Keep history manageable
    if (conversationHistory.length > 21) {
      conversationHistory.splice(1, 2);
    }

    const audioBuffer = await textToSpeech(fullResponse);

    return new NextResponse(new Uint8Array(audioBuffer), {
      headers: {
        "Content-Type": "audio/pcm",
        "X-Transcript": encodeURIComponent(transcript),
        "X-Response": encodeURIComponent(fullResponse),
      },
    });
  } catch (error) {
    console.error("Chat pipeline error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Pipeline failed" },
      { status: 500 }
    );
  }
}
