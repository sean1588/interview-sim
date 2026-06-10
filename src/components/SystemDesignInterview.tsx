import NotesInterview from "@/components/NotesInterview";
import { SYSTEM_DESIGN_QUESTIONS } from "@/lib/questions/system-design";

export default function SystemDesignInterview() {
  return (
    <NotesInterview
      mode="system-design"
      title="System Design Interview"
      questionLabel="Prompt"
      questions={SYSTEM_DESIGN_QUESTIONS}
      notesHeading="Design notes (live — interviewer sees this)"
      notesPlaceholder={
        "Requirements (functional + non-functional)\n\nHigh-level architecture (services, data stores, queues...)\n\nAPIs / data model\n\nCapacity estimates & bottlenecks\n\nTradeoffs & alternatives\n\nFailure modes & mitigation"
      }
      sectionChips={[
        "Requirements",
        "Scale / Capacity",
        "High-level design",
        "Deep dive",
        "Tradeoffs & failures",
        "Data model",
      ]}
      notesFooter="Pro tip: Write key decisions, numbers, and diagrams in text form (e.g. “LB → 4x App servers → Redis cache → Sharded Postgres”). The interviewer will react to what you write here."
    />
  );
}
