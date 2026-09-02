import type { ScoreItem } from "@/components/Scorecard";
import type { SessionRecord } from "@/lib/history";
import { SCORE_LABELS } from "@/lib/score-labels";
import type { InterviewMode } from "@/lib/types/mode";

/**
 * Home's next-session pick. Not a ranker: empty → `/coding`; otherwise the
 * newest `listSessions()` card, min that card's scores, stay in that card's
 * mode. `/learn` recaps are not in this store, so they are not special-cased.
 */

export type NextSession =
  | {
      kind: "first";
      href: "/coding";
      title: string;
      description: string;
      cta: string;
      icon: string;
    }
  | {
      kind: "drill";
      href: `/${InterviewMode}`;
      mode: InterviewMode;
      axis: string;
      label: string;
      title: string;
      description: string;
      cta: string;
      icon: string;
    };

const MODE_ICON: Record<InterviewMode, string> = {
  coding: "💻",
  behavioral: "🗣️",
  "system-design": "🗺️",
};

const MODE_TITLE: Record<InterviewMode, string> = {
  coding: "Coding Interview",
  behavioral: "Behavioral Interview",
  "system-design": "System Design",
};

const FIRST: NextSession = {
  kind: "first",
  href: "/coding",
  title: "Coding Interview",
  description: "",
  cta: "Start a coding interview",
  icon: "💻",
};

/** Newest-first list from `listSessions()`. Empty → the default first session. */
export function nextSession(sessions: SessionRecord[]): NextSession {
  const card = sessions[0];
  if (!card) return FIRST;

  const weak = weakestOnCard(card.result.scores);
  const label = weak
    ? (SCORE_LABELS[card.mode][weak.axis] ?? weak.axis)
    : MODE_TITLE[card.mode];
  const description = weak
    ? lineCopy(weak.item, card.result.improvements)
    : lineCopy({ score: 0, notes: "" }, card.result.improvements);

  return {
    kind: "drill",
    href: `/${card.mode}`,
    mode: card.mode,
    axis: weak?.axis ?? "",
    label,
    title: weak ? label : MODE_TITLE[card.mode],
    description,
    cta: "Start next session",
    icon: MODE_ICON[card.mode],
  };
}

/** Lowest score on this card. Tie → first key in the scorecard's own order. */
function weakestOnCard(
  scores: Record<string, ScoreItem> | undefined
): { axis: string; item: ScoreItem } | null {
  if (!scores) return null;
  let weak: { axis: string; item: ScoreItem } | null = null;
  for (const [axis, item] of Object.entries(scores)) {
    if (!item || typeof item.score !== "number") continue;
    if (!weak || item.score < weak.item.score) weak = { axis, item };
  }
  return weak;
}

/** Notes on the weak rubric line; `improvements[]` only if that line is silent. */
function lineCopy(item: ScoreItem, improvements: string[] | undefined): string {
  const notes = typeof item.notes === "string" ? item.notes.trim() : "";
  if (notes) return notes;
  for (const raw of improvements ?? []) {
    if (typeof raw === "string" && raw.trim()) return raw.trim();
  }
  return "";
}
