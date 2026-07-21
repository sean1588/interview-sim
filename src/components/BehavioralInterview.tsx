import NotesInterview from "@/components/NotesInterview";
import { BEHAVIORAL_QUESTIONS } from "@/lib/questions/behavioral";

export default function BehavioralInterview() {
  return (
    <NotesInterview
      mode="behavioral"
      title="Behavioral Interview"
      questionLabel="Scenario"
      questions={BEHAVIORAL_QUESTIONS}
      allowTutor
      questionTip="Tip: Use the notes area to outline your STAR story (Situation, Task, Action, Result) before or during the conversation."
      notesHeading="Your notes / STAR outline (live — interviewer can see this)"
      notesPlaceholder={
        "Situation:\nTask:\nAction (what *you* specifically did):\nResult + impact:\nReflection / what you'd do differently:"
      }
    />
  );
}
