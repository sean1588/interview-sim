import type { InterviewMode } from "./types/mode";

// Human labels for the score axes each mode's assessor emits (see
// getAssessSystemPrompt). Lives apart from prompts.ts so the client-side
// Scorecard doesn't pull the whole prompt module into the bundle.
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
