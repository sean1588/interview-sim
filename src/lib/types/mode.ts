/** The three graded interview experiences. Keys SCORE_LABELS and the
 * scorecard/assessment prompts — these always produce a graded Scorecard. */
export type InterviewMode = "coding" | "behavioral" | "system-design";

/** Every voice-loop experience, including the (non-graded) Python tutorial, the
 * free-form freestyle session, and the career coach. Used at the shared
 * boundary: VoiceChat, the chat/assess routes, and the system/kickoff/assess
 * prompt dispatch. Learning produces a recap; freestyle is an ungraded sandbox;
 * career produces a plan (summary, roles, resume, job-search prompt) — none of
 * the three is scored, which is why they are not InterviewModes. */
export type SessionMode = InterviewMode | "learning" | "freestyle" | "career";
