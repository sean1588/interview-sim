/** The three graded interview experiences. Keys SCORE_LABELS and the
 * scorecard/assessment prompts — these always produce a graded Scorecard. */
export type InterviewMode = "coding" | "behavioral" | "system-design";

/** Every voice-loop experience, including the (non-graded) Python tutorial and
 * the free-form freestyle session. Used at the shared boundary: VoiceChat, the
 * chat/assess routes, and the system/kickoff/assess prompt dispatch. Learning
 * produces a recap; freestyle is an ungraded sandbox — neither is scored. */
export type SessionMode = InterviewMode | "learning" | "freestyle";
