/** The three graded interview experiences. Keys SCORE_LABELS and the
 * scorecard/assessment prompts — these always produce a graded Scorecard. */
export type InterviewMode = "coding" | "behavioral" | "system-design";

/** Every voice-loop experience, including the (non-graded) Python tutorial.
 * Used at the shared boundary: VoiceChat, the chat/assess routes, and the
 * system/kickoff/assess prompt dispatch. Learning produces a recap, not a score. */
export type SessionMode = InterviewMode | "learning";
