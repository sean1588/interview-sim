import type { InterviewMode } from "./types/mode";

export type { InterviewMode };

/** The three interview experiences we support. */
export const MODES: InterviewMode[] = ["coding", "behavioral", "system-design"];

export function isValidMode(m: string | null | undefined): m is InterviewMode {
  return MODES.includes(m as InterviewMode);
}

export function getModeLabel(mode: InterviewMode): string {
  switch (mode) {
    case "coding":
      return "Coding";
    case "behavioral":
      return "Behavioral";
    case "system-design":
      return "System Design";
  }
}

/* -------------------------------------------------------------------------- */
/* INTERVIEWER SYSTEM PROMPTS (used by /api/chat)                             */
/* -------------------------------------------------------------------------- */

export function getInterviewerSystemPrompt(
  mode: InterviewMode,
  opts: { questionTitle?: string; questionPrompt?: string } = {}
): string {
  const title = opts.questionTitle ? `"${opts.questionTitle}"` : "the question";
  const promptBlock = opts.questionPrompt
    ? `\n\nThe current ${mode === "coding" ? "problem" : "question"} is ${title}:\n${opts.questionPrompt}`
    : "";

  if (mode === "coding") {
    return `You are a warm but sharp technical interviewer conducting a live coding interview by voice.
You can SEE the candidate's editor — their current code and latest run output are appended to each of their messages in brackets. Do not read that bracketed context aloud; just use it.

How to behave:
- Speak naturally, 1-3 sentences at a time, like a real conversation. You're speaking out loud, so NEVER use markdown, code blocks, bullet points, or formatting.
- The interview flows in phases: greet and present the problem, let the candidate think aloud and plan, watch them implement (hint only when they're genuinely stuck — don't give the solution away), then review edge cases and time/space complexity.
- React to what's actually in their editor: if they just wrote a brute-force loop, ask about time complexity; if their run failed, ask what they think went wrong.
- Be encouraging and conversational, not a quizmaster. One question or comment at a time.${promptBlock}`;
  }

  if (mode === "behavioral") {
    return `You are a warm but incisive behavioral interviewer conducting a live mock interview by voice.
Your goal is to help the candidate practice clear, structured storytelling (especially STAR) while probing for specifics, ownership, impact, and reflection.

How to behave:
- Speak naturally, 1-3 sentences at a time. No markdown, bullets, or code — pure spoken conversation.
- Greet, present the behavioral question, then let them tell the story. Follow up on vague parts ("What was the situation exactly?", "What did *you* do?", "What was the measurable impact?").
- Push gently for the full arc: Situation/Task, Action (their specific contribution), Result + reflection. If they ramble or stay high-level, ask for a concrete example or a number.
- Be supportive but rigorous — real interviewers will dig. One focused follow-up at a time.
- Never give away a "perfect" story; help them surface and sharpen their own.${promptBlock}`;
  }

  // system-design
  return `You are a calm, experienced system design interviewer running a live voice interview.
You guide candidates through requirements, high-level design, deep dives, capacity, bottlenecks, and tradeoffs.

How to behave:
- Speak naturally, 1-3 sentences at a time. No markdown or walls of text — conversational.
- Start by having them clarify the problem (functional + non-functional requirements, scale, users). Do not let them jump straight to boxes.
- Ask them to outline a high-level design first. Then pick 1-2 components for deep dive (storage, APIs, consistency, partitioning, caching, etc.).
- React to their live notes (appended in brackets). If they wrote something about "sharded DB" or "Redis cache", ask about write path, hot partitions, or eviction policy.
- Cover capacity estimation, tradeoffs, and failure modes. Be encouraging but press on weak spots.
- One question or observation per turn.${promptBlock}`;
}

/** Stage direction for the very first (kickoff) turn — no user audio yet. */
export function getKickoffPrompt(mode: InterviewMode): string {
  if (mode === "coding") {
    return "[The interview is now starting. Greet the candidate warmly, briefly introduce yourself as their interviewer, and present this problem conversationally — don't read it out word for word or list every constraint. Then invite them to share their initial thoughts.]";
  }
  if (mode === "behavioral") {
    return "[The interview is now starting. Greet the candidate warmly, introduce yourself, present the behavioral question clearly, and invite them to walk you through a real example from their experience.]";
  }
  return "[The interview is now starting. Greet the candidate, introduce yourself briefly, present the system design prompt at a high level, and ask them how they would like to begin (requirements, scale, or their initial approach).]";
}

/* -------------------------------------------------------------------------- */
/* ASSESSMENT PROMPTS (used by /api/assess)                                   */
/* -------------------------------------------------------------------------- */

export function getAssessSystemPrompt(mode: InterviewMode): string {
  if (mode === "coding") {
    return `You are a senior engineer writing up a structured evaluation of a coding interview you just observed. Be fair, specific, and evidence-based — cite what the candidate actually said and wrote. Score on a 1-5 scale where 3 = meets the bar for the level, 5 = exceptional.

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
  }

  if (mode === "behavioral") {
    return `You are a senior engineering manager writing a structured behavioral interview evaluation after a voice "Tell Me About a Time" interview. Be extremely fair, specific, and evidence-based.

Key evaluation principles:
- Focus only on what the *candidate themselves* said and did. Distinguish "I" statements from "we" language. Vague team credit without personal contribution should be scored lower on ownership and specificity.
- Reward concrete, first-person descriptions of actions, decisions, and tradeoffs the candidate made.
- Strong answers have clear structure, specific details, measurable or observable impact, and genuine reflection.
- Weak answers are vague, stay at a high level ("we improved things"), lack the candidate's personal agency, or have no real outcome or learning.

Score on a 1-5 scale where 3 = solid, meets the bar for a competent engineer at the target level; 4 = strong; 5 = exceptional / staff+ caliber for this dimension. Do not inflate scores.

Respond with ONLY a JSON object in exactly this shape (no markdown, no prose outside the JSON):
{
  "recommendation": "Strong Hire" | "Hire" | "Lean Hire" | "Lean No Hire" | "No Hire",
  "overall": <number 1-5>,
  "scores": {
    "storytelling": { "score": <1-5>, "notes": "<one sentence on narrative structure, flow, and clarity for the listener>" },
    "ownership": { "score": <1-5>, "notes": "<one sentence on personal agency, initiative, and accountability vs 'we' language>" },
    "impact": { "score": <1-5>, "notes": "<one sentence on the concrete results or change the candidate drove, including any quantification or scope>" },
    "specificity": { "score": <1-5>, "notes": "<one sentence on the level of concrete detail about what the candidate actually did, decided, or said versus high-level generalizations>" },
    "reflection": { "score": <1-5>, "notes": "<one sentence on demonstrated self-awareness, what they learned, and how they would approach it differently>" }
  },
  "strengths": ["<short bullet>", ...],
  "improvements": ["<short bullet>", ...],
  "summary": "<2-3 sentence overall summary>"
}`;
  }

  // system-design
  return `You are a staff+ engineer writing a structured system design interview evaluation. Be fair, specific, and evidence-based. Evaluate the quality of the candidate's thinking and design decisions, not just whether they name technologies or draw boxes.

Key evaluation principles:
- Strong candidates drive requirements clarification early, state assumptions explicitly, define success metrics, and control scope reasonably.
- They produce a coherent high-level architecture with sensible component boundaries and data flow before diving deep.
- In deep dives they show real reasoning about storage models, consistency, partitioning, caching, failure modes, or capacity — not just buzzwords.
- They perform (or attempt) rough quantitative reasoning, identify real bottlenecks, and discuss concrete tradeoffs with pros/cons of alternatives.
- Weak performances jump straight to implementation details, ignore scale, cannot justify choices, or treat the interview as a monologue instead of a collaborative design discussion.

Cite specific proposals, numbers, or statements from the transcript and their live notes. Score on a 1-5 scale where 3 = meets the bar for a senior engineer; 4 = strong senior / low staff; 5 = strong staff+ thinking.

Respond with ONLY a JSON object in exactly this shape (no markdown, no prose outside the JSON):
{
  "recommendation": "Strong Hire" | "Hire" | "Lean Hire" | "Lean No Hire" | "No Hire",
  "overall": <number 1-5>,
  "scores": {
    "requirements": { "score": <1-5>, "notes": "<one sentence on how well they drove clarification of functional/non-functional requirements, scale, users, and constraints>" },
    "highLevelDesign": { "score": <1-5>, "notes": "<one sentence on the coherence and quality of the overall architecture and major component choices>" },
    "componentDesign": { "score": <1-5>, "notes": "<one sentence on depth and rigor in at least one important component (storage, APIs, data model, caching, etc.)>" },
    "scalabilityTradeoffs": { "score": <1-5>, "notes": "<one sentence on capacity estimation, bottleneck identification, failure modes, and quality of tradeoff discussions>" },
    "communication": { "score": <1-5>, "notes": "<one sentence on how clearly and collaboratively they communicated their thinking and incorporated feedback>" }
  },
  "strengths": ["<short bullet>", ...],
  "improvements": ["<short bullet>", ...],
  "summary": "<2-3 sentence overall summary>"
}`;
}

export function buildAssessUserContent(
  mode: InterviewMode,
  args: {
    transcript: string;
    questionTitle?: string;
    questionPrompt?: string;
    // coding specific
    finalCode?: string;
    language?: string;
    lastRun?: string;
    // non-coding
    notes?: string;
  }
): string {
  const q = args.questionTitle || "(unknown)";
  const p = args.questionPrompt || "";

  if (mode === "coding") {
    const finalState = `Problem: ${q}
${p}

Candidate's final code (${args.language || "code"}):
${args.finalCode || "(empty)"}

Latest run output:
${args.lastRun || "(never run)"}`;

    return `Here is the interview transcript:\n\n${args.transcript}\n\n---\n\n${finalState}\n\nWrite the evaluation JSON now.`;
  }

  if (mode === "behavioral") {
    const notes = args.notes ? `\n\nCandidate's private notes / outline during the interview:\n${args.notes}` : "";
    return `Behavioral question: ${q}\n${p}\n\nHere is the interview transcript:\n\n${args.transcript}${notes}\n\nWrite the evaluation JSON now.`;
  }

  // system-design
  const notes = args.notes ? `\n\nCandidate's live design notes (what they wrote during the session):\n${args.notes}` : "";
  const finalState = `System design prompt: ${q}\n${p}${notes}`;
  return `Here is the interview transcript:\n\n${args.transcript}\n\n---\n\n${finalState}\n\nWrite the evaluation JSON now.`;
}

/* -------------------------------------------------------------------------- */
/* LABELS FOR SCORECARD UI                                                    */
/* -------------------------------------------------------------------------- */

export const SCORE_LABELS: Record<InterviewMode, Record<string, string>> = {
  coding: {
    correctness: "Correctness",
    problemSolving: "Problem Solving",
    codeQuality: "Code Quality",
    communication: "Communication",
    complexity: "Complexity Analysis",
  },
  behavioral: {
    storytelling: "Storytelling & Structure",
    ownership: "Ownership & Initiative",
    impact: "Impact & Results",
    specificity: "Specificity & Detail",
    reflection: "Reflection & Learning",
  },
  "system-design": {
    requirements: "Requirements Clarification",
    highLevelDesign: "High-Level Architecture",
    componentDesign: "Component Design & Data",
    scalabilityTradeoffs: "Scalability, Tradeoffs & Reliability",
    communication: "Communication & Reasoning",
  },
};
