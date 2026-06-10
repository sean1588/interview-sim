export type BehavioralQuestion = {
  id: string;
  title: string; // short label for the picker
  prompt: string; // the actual question / scenario posed to the candidate
};

export const BEHAVIORAL_QUESTIONS: BehavioralQuestion[] = [
  {
    id: "production-bug",
    title: "Shipped a bug to production",
    prompt:
      "Tell me about a time you shipped a bug to production. How did you discover it, how did you respond, and what did you do afterward to prevent similar issues?",
  },
  {
    id: "conflict-coworker",
    title: "Conflict with a coworker",
    prompt:
      "Tell me about a time you had a disagreement with a teammate or coworker about the right technical approach or direction. How did you handle it and what was the outcome?",
  },
  {
    id: "pushback-constraints",
    title: "Pushback and constraints",
    prompt:
      "Tell me about a time you received pushback from a teammate or stakeholder because of constraints you hadn't fully accounted for. How did you adjust and still make progress?",
  },
  {
    id: "oversight-assumption",
    title: "Oversight or bad assumption",
    prompt:
      "Tell me about a time an assumption you made (about data, requirements, or a system) turned out to be wrong and caused problems. What did you do and what did you change afterward?",
  },
  {
    id: "gave-constructive-feedback",
    title: "Gave constructive feedback",
    prompt:
      "Tell me about a time you noticed a teammate's behavior or habit that was affecting quality or the team, and you gave them feedback. How did you approach it and what happened?",
  },
  {
    id: "cross-team-coordination",
    title: "Cross-team coordination",
    prompt:
      "Tell me about a time you had to drive work that required coordination across multiple teams with different priorities. How did you keep everyone aligned and deliver successfully?",
  },
  {
    id: "led-project-impact",
    title: "Led a project with impact",
    prompt:
      "Tell me about a time you led a project (technical or operational) that had meaningful scale or impact. What was your role in driving it, and what results did it produce?",
  },
  {
    id: "took-initiative",
    title: "Took initiative",
    prompt:
      "Tell me about a time you identified a recurring pain point or gap and took initiative to build or improve something without being explicitly asked. What did you build and how was it received?",
  },
  {
    id: "handled-pressure",
    title: "Handled high-pressure situation",
    prompt:
      "Tell me about a time you were in a high-pressure situation (incident, tight rollout, or production issue). How did you stay effective and what was the outcome?",
  },
  {
    id: "rapid-ramp-learning",
    title: "Ramped up quickly",
    prompt:
      "Tell me about a time you had to quickly learn a new domain, technology, or system and then deliver something meaningful with it. How did you learn and apply it?",
  },
  {
    id: "made-mistake",
    title: "Made a mistake",
    prompt:
      "Tell me about a time you made a mistake (for example, missed something in a review, made a bad decision, or moved too fast). How did you own it and what did you change as a result?",
  },
  {
    id: "mentoring-onboarding",
    title: "Mentoring or onboarding",
    prompt:
      "Tell me about a time you helped onboard or mentor a teammate. What did you do to help them become effective, and what was the result?",
  },
];
