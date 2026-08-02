// The Distributed Systems course: per-module lesson files assembled into a
// Course. This is a *concept* course — it declares no `language`, so it has no
// editor and no exercises (see Course.language in ../types); every lesson is
// taught conversationally by the voice tutor against its notes.
//
// Audience: experienced programmers who write good code but have not operated a
// system at scale. Each lesson leads with the failure a mechanism exists to
// prevent, then the mechanism. Where a lesson overlaps the concept library, it
// links to the article rather than restating it: the library answers "what do I
// say when this comes up in an interview", this course answers "how does it
// actually work, and what breaks".

import type { Course, Lesson, Module } from "../types";
import { foundationsLessons } from "./foundations";
import { timeLessons } from "./time";
import { replicationLessons } from "./replication";
import { consensusLessons } from "./consensus";
import { partitioningLessons } from "./partitioning";
import { failureLessons } from "./failure";

const MODULES: Module[] = [
  { id: "foundations", title: "Foundations", blurb: "What makes a system distributed, the fallacies you'll ship, partial failure as the steady state, and the latency numbers that decide designs." },
  { id: "time", title: "Time & Ordering", blurb: "Why wall clocks lie, happens-before, and the logical clocks that detect a genuine conflict instead of silently losing a write." },
  { id: "replication", title: "Replication & Consistency", blurb: "Leaders, followers and quorums; the consistency menu from linearizable to eventual; CAP as practitioners actually use it, and PACELC." },
  { id: "consensus", title: "Consensus & Coordination", blurb: "Why agreement is hard, Raft end to end — election, log replication, commit rules — and why a lock without a fencing token isn't one." },
  { id: "partitioning", title: "Partitioning & Data Distribution", blurb: "Hash vs range, consistent hashing and virtual nodes, rebalancing without a stop-the-world, hot keys, and the index placement tradeoff." },
  { id: "failure", title: "Failure, Detection & Recovery", blurb: "Timeouts as guesses, retry storms and the controls that bound them, idempotency and the outbox, and how split brain is prevented." },
];

const LESSONS: Lesson[] = [
  ...foundationsLessons,
  ...timeLessons,
  ...replicationLessons,
  ...consensusLessons,
  ...partitioningLessons,
  ...failureLessons,
];

export const distributedSystemsCourse: Course = {
  id: "distributed-systems",
  // No `language`: a concept course — conversational lessons, no editor.
  title: "Distributed Systems",
  tagline: "A guided course on how distributed systems actually work — clocks, quorums, Raft, partitioning, and the failures each mechanism exists to prevent.",
  icon: "🌐",
  modules: MODULES,
  lessons: LESSONS,
};
