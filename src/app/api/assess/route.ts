import { NextRequest } from "next/server";
import { chatComplete } from "@/lib/openrouter";
import { stripTurnContext } from "@/lib/turn-context";
import { stripCodeFences } from "@/lib/llm-json";
import { getSession } from "@/lib/session-store";
import {
  getAssessSystemPrompt,
  buildAssessUserContent,
  isValidSessionMode,
  TRANSCRIPT_ROLES,
  type SessionMode,
} from "@/lib/prompts";
import { isValidLevel } from "@/lib/levels";

// Produces a structured scorecard for the interview so far. Non-streaming, not
// spoken — rendered as a card in the UI.
// The concrete prompt is now selected by mode (see getAssessSystemPrompt).

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      sessionId,
      mode: rawMode,
      questionTitle,
      questionPrompt,
      // coding
      code,
      language,
      // learning: names the tutor for a concept course (no language)
      course,
      lastRun,
      // non-coding
      notes,
      level,
    } = body;

    if (!sessionId) {
      return Response.json({ error: "No sessionId provided" }, { status: 400 });
    }

    const mode: SessionMode = isValidSessionMode(rawMode) ? rawMode : "coding";

    const session = getSession(sessionId);
    if (session.history.length === 0) {
      return Response.json(
        { error: "Nothing to assess yet." },
        { status: 400 }
      );
    }

    // Render the transcript for the evaluator. Strip our bracketed annotations
    // (editor state, notes) from user turns so it reads as a clean conversation.
    const [speaker, listener] = TRANSCRIPT_ROLES[mode];
    const transcript = session.history
      .map((m) => {
        const who = m.role === "assistant" ? speaker : listener;
        return `${who}: ${stripTurnContext(m.content)}`;
      })
      .join("\n");

    const targetLevel = isValidLevel(level) ? level : undefined;
    const assessSystem = getAssessSystemPrompt(mode, targetLevel, language, course);
    const userContent = buildAssessUserContent(mode, {
      transcript,
      questionTitle,
      questionPrompt,
      finalCode: code,
      language,
      lastRun,
      notes,
    });

    const content = await chatComplete(
      [
        { role: "system", content: assessSystem },
        { role: "user", content: userContent },
      ],
      { jsonMode: true }
    );

    let result;
    try {
      result = JSON.parse(stripCodeFences(content));
    } catch {
      console.error("[assess] could not parse model output:", content);
      return Response.json(
        { error: "Could not parse assessment. Try again." },
        { status: 502 }
      );
    }

    return Response.json({ result });
  } catch (error) {
    console.error("[assess] failed:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Assessment failed" },
      { status: 500 }
    );
  }
}
