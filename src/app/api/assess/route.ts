import { NextRequest } from "next/server";
import { chatComplete } from "@/lib/openrouter";
import { getSession } from "@/lib/session-store";

// Produces a structured scorecard for the interview so far. Non-streaming, not
// spoken — rendered as a card in the UI.
const ASSESS_SYSTEM = `You are a senior engineer writing up a structured evaluation of a coding interview you just observed. Be fair, specific, and evidence-based — cite what the candidate actually said and wrote. Score on a 1-5 scale where 3 = meets the bar for the level, 5 = exceptional.

Respond with ONLY a JSON object in exactly this shape (no markdown, no prose outside the JSON):
{
  "recommendation": "Strong Hire" | "Hire" | "Lean Hire" | "Lean No Hire" | "No Hire",
  "overall": <number 1-5>,
  "scores": {
    "correctness": { "score": <1-5>, "notes": "<one sentence>" },
    "problemSolving": { "score": <1-5>, "notes": "<one sentence>" },
    "codeQuality": { "score": <1-5>, "notes": "<one sentence>" },
    "communication": { "score": <1-5>, "notes": "<one sentence>" },
    "complexity": { "score": <1-5>, "notes": "<one sentence on their handling of time/space complexity>" }
  },
  "strengths": ["<short bullet>", ...],
  "improvements": ["<short bullet>", ...],
  "summary": "<2-3 sentence overall summary>"
}`;

export async function POST(req: NextRequest) {
  try {
    const {
      sessionId,
      problemTitle,
      problemPrompt,
      code,
      language,
      lastRun,
    } = await req.json();

    if (!sessionId) {
      return Response.json({ error: "No sessionId provided" }, { status: 400 });
    }

    const session = getSession(sessionId);
    if (session.history.length === 0) {
      return Response.json(
        { error: "No interview to assess yet." },
        { status: 400 }
      );
    }

    // Render the transcript for the evaluator. Strip our bracketed editor-state
    // annotations from user turns so it reads as a clean conversation.
    const transcript = session.history
      .map((m) => {
        const who = m.role === "assistant" ? "Interviewer" : "Candidate";
        const text = m.content.replace(/\n\n\[Editor state[\s\S]*$/, "").trim();
        return `${who}: ${text}`;
      })
      .join("\n");

    const finalState = `Problem: ${problemTitle || "(unknown)"}
${problemPrompt || ""}

Candidate's final code (${language || "code"}):
${code || "(empty)"}

Latest run output:
${lastRun || "(never run)"}`;

    const content = await chatComplete(
      [
        { role: "system", content: ASSESS_SYSTEM },
        {
          role: "user",
          content: `Here is the interview transcript:\n\n${transcript}\n\n---\n\n${finalState}\n\nWrite the evaluation JSON now.`,
        },
      ],
      { jsonMode: true }
    );

    // Be defensive: strip any stray code fences before parsing.
    const cleaned = content
      .trim()
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/, "")
      .trim();

    let scorecard;
    try {
      scorecard = JSON.parse(cleaned);
    } catch {
      console.error("[assess] could not parse model output:", content);
      return Response.json(
        { error: "Could not parse assessment. Try again." },
        { status: 502 }
      );
    }

    return Response.json({ scorecard });
  } catch (error) {
    console.error("[assess] failed:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Assessment failed" },
      { status: 500 }
    );
  }
}
