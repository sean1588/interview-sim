import type { Lesson } from "../types";

export const timeLessons: Lesson[] = [
  {
    id: "ds-clocks-lie",
    module: "time",
    title: "Why Wall Clocks Lie",
    blurb: "drift, NTP steps, leap seconds — and the one clock you can actually trust.",
    content: `## Two clocks in every machine

Your process has access to two completely different things, and confusing them causes real outages:

- **The wall clock** (\`System.currentTimeMillis\`, \`time.time()\`, \`time.Now()\`) — "what time is it in the world". Set from NTP. **Can jump forwards and backwards.**
- **The monotonic clock** (\`System.nanoTime\`, \`time.monotonic()\`, Go's monotonic reading inside \`time.Time\`) — ticks since some arbitrary point, usually boot. Never jumps. Meaningless as a date, correct for durations.

Rule: **wall clock for timestamps you show or store; monotonic clock for every timeout, every duration, every "has 30 seconds elapsed".** Measuring an interval by subtracting two wall-clock readings is a latent bug that fires when NTP corrects.

## How badly the wall clock lies

- **Drift.** A typical quartz oscillator is good to ~50 ppm at ordinary temperatures: about **4 seconds a day** if left alone. Bad or hot hardware is worse.
- **NTP steps.** NTP usually *slews* (adjusts the tick rate to converge gently), but past a threshold — 128ms by default in \`ntpd\` — it **steps**: the clock jumps. Backwards, if the machine was ahead. Code that assumed time is non-decreasing now sees a negative duration.
- **Leap seconds.** UTC has had 27 of them. In 2012 a leap second triggered a Linux kernel bug that pinned CPUs across large parts of the internet; several companies now "smear" the second across a day rather than handle a 23:59:60.
- **Virtualization.** A VM paused for live migration resumes with a clock that is simply wrong until it resyncs, and a stop-the-world GC pause has the same shape from inside the process.

So: between two machines in the same rack, assume clocks can differ by **tens or hundreds of milliseconds**, occasionally seconds. In a badly managed fleet, minutes.

## The pattern this kills: last-write-wins

\`\`\`
Node A clock: 12:00:00.500   writes name="Ada"
Node B clock: 12:00:00.200   writes name="Grace"   (physically later!)
Conflict resolution: keep the higher timestamp -> "Ada" wins, Grace's write is silently lost
\`\`\`

No error, no log line, the data is just gone. Last-write-wins by wall clock is a **data-loss mechanism**, not a conflict-resolution strategy. That's the motivation for everything in the rest of this module: an ordering that doesn't depend on clocks agreeing.

## When clocks are trustworthy enough

You can build on clocks if you bound the error and *account for it*. Google's Spanner exposes time as an interval (\`TT.now()\` → \`[earliest, latest]\`, typically a few milliseconds wide, backed by GPS and atomic clocks) and, to commit, simply **waits out the uncertainty** before acknowledging. That's the honest version: not "the clock is right" but "the clock is right within ε, and I'll pay ε in latency to be sure."`,
    exercises: [],
  },
  {
    id: "ds-happens-before",
    module: "time",
    title: "Happens-Before: Ordering Without Clocks",
    blurb: "Lamport's causal ordering, and why 'concurrent' is a real relationship rather than a tie.",
    content: `## The only ordering you can actually observe

Lamport's 1978 insight: forget the clock and define order from what could possibly have influenced what. Event \`a\` **happens-before** \`b\` (written \`a → b\`) if:

1. \`a\` and \`b\` are in the same process and \`a\` came first, **or**
2. \`a\` is the sending of a message and \`b\` is the receiving of that same message, **or**
3. transitively: \`a → c\` and \`c → b\`.

That's the entire definition. It says nothing about seconds; it captures exactly the pairs where information could have flowed from one to the other.

## Concurrent is not a tie-break problem

If neither \`a → b\` nor \`b → a\`, the events are **concurrent** (\`a ‖ b\`). This is not "we don't know which came first" — it's a fact about the system: **neither could have known about the other**. Happens-before is a *partial* order, and that's the point.

\`\`\`
P1: --a1--------a2-------------->
             \\
P2: -----------b1-----b2-------->

a1 → a2      (same process)
a1 → b1      (message)
a1 → b2      (transitive)
a2 ‖ b1      (concurrent — neither can have seen the other)
\`\`\`

Wall clocks can't express this. They'd hand you "a2 was at 12:00:00.31, b1 at 12:00:00.29, therefore b1 first" — a confident answer to a question with no answer.

## Why this is the useful notion

Two writes that are causally ordered have an obvious resolution: the later one was made *knowing* the earlier one, so it wins. Two writes that are concurrent have **no correct automatic resolution** — the system has three honest options:

- Keep both and let the application (or the user) merge — Amazon's shopping cart famously does this; a re-added item is better than a silently lost one.
- Merge deterministically with a data type that has no conflicts by construction (a CRDT: a counter, a grow-only set, a last-writer-wins register with explicit, documented loss).
- Prevent concurrency in the first place with a single leader or consensus, which is what the next two modules are about.

The mechanism that lets you *tell which case you're in* is a logical clock — the next two lessons.

> The library's [Consistency models](/library/consistency-models) covers what to say when an interviewer asks about causal consistency. This lesson is the underlying relation the model is defined on.`,
    exercises: [],
  },
  {
    id: "ds-lamport-clocks",
    module: "time",
    title: "Lamport Timestamps",
    blurb: "one counter per node, three rules, and the one thing it can't tell you.",
    content: `## The algorithm, in full

Each node keeps an integer \`C\`, starting at 0.

1. Before any local event, \`C = C + 1\`.
2. When sending a message, increment then attach \`C\` to it.
3. On receiving a message with timestamp \`t\`: \`C = max(C, t) + 1\`.

That's it. Three rules, one integer per node, a few bytes on the wire.

\`\`\`
P1: C=1 -----> C=2 (send t=2) ---------> C=3
                    \\
P2:      C=1         --> recv t=2: C = max(1,2)+1 = 3 --> C=4
\`\`\`

## What it guarantees — and what it doesn't

The guarantee is one direction only:

\`\`\`
if a → b   then   C(a) < C(b)          ALWAYS TRUE
if C(a) < C(b)  then  a → b            NOT TRUE
\`\`\`

Two unrelated events on different nodes can easily end up with 5 and 9. Seeing 5 < 9 tells you nothing: they might be causally ordered, or completely concurrent. **A Lamport timestamp can prove that ordering is possible, but never that it happened.** Detecting concurrency is exactly the gap vector clocks fill.

## What it's good for

Because \`a → b ⟹ C(a) < C(b)\`, breaking ties by \`(C, nodeId)\` gives you a **total order that never contradicts causality**. That's genuinely useful:

- A deterministic, globally agreed order for replaying operations, so every replica applies them identically.
- Tie-breaking in a way that is *stable* and doesn't depend on clocks agreeing.
- A cheap "is my copy at least as new as yours" comparison inside a single causal chain.

## The version you'll actually meet: hybrid logical clocks

A pure Lamport counter is unreadable to humans and useless for "show me writes from last Tuesday". A **hybrid logical clock (HLC)** pairs the physical time with a logical counter: \`(pt, l)\`, where \`pt\` tracks the wall clock but is dragged forward by incoming messages, and \`l\` breaks ties within the same millisecond. You get timestamps that are close to real time *and* consistent with causality. CockroachDB and MongoDB both use HLCs, and it's the practical default when you need both properties.`,
    exercises: [],
  },
  {
    id: "ds-vector-clocks",
    module: "time",
    title: "Vector Clocks and Detecting Concurrent Writes",
    blurb: "one counter per node instead of one total, and the comparison that finds real conflicts.",
    content: `## One integer isn't enough — keep the whole vector

A vector clock is a map from node id to counter: \`{A: 3, B: 1, C: 7}\` — "I have seen 3 events from A, 1 from B, 7 from C". The rules mirror Lamport's:

1. On a local event, increment **your own** entry.
2. Attach the whole vector to every message.
3. On receipt, take the **element-wise max** of yours and theirs, then increment your own entry.

## The comparison is where the value is

Given two vectors \`V1\` and \`V2\`:

\`\`\`
V1 ≤ V2   iff  V1[i] ≤ V2[i] for every i

V1 → V2       (V1 happened before V2)      if V1 ≤ V2 and V1 ≠ V2
V2 → V1                                     if V2 ≤ V1 and V1 ≠ V2
V1 ‖ V2       CONCURRENT — a real conflict  if neither ≤ holds
\`\`\`

That last line is the thing a wall clock and a Lamport timestamp cannot give you. A concrete example:

\`\`\`
{A:2, B:1}  vs  {A:3, B:1}     -> A-side is strictly ahead: the second descends from the first. Safe.
{A:2, B:1}  vs  {A:1, B:2}     -> neither dominates: two writers, neither saw the other.
                                  A GENUINE CONFLICT. Do not silently pick one.
\`\`\`

Under last-write-wins, that second case picks a winner by clock and destroys the loser's write. With vector clocks the system *knows* it's a conflict and can keep both versions (Dynamo calls them siblings) for the application to merge.

## The cost, and how real systems pay it

The vector grows with the number of writers, and entries never disappear on their own — a naive implementation on a 500-node cluster ships a 500-entry map with every value. Mitigations in practice:

- **Version vectors keyed by replica, not by client** — the count is bounded by replication factor (3 or 5), not by fleet size.
- **Dotted version vectors** (Riak) to keep sibling explosion under control.
- **Pruning with a timestamp**, dropping the oldest entries past a cap — which reintroduces a small chance of a false "concurrent" verdict. False concurrency is safe (you merge something you didn't need to); false causality would lose data.

## When to reach for which

\`\`\`
Need a stable total order for replay?          Lamport / HLC
Need to DETECT concurrent writes?              Vector (or version) clocks
Need to PREVENT concurrent writes?             Single leader or consensus  (next two modules)
\`\`\`

> [Replication & quorums](/library/replication-and-quorums) is the interview-facing companion — how to talk about sibling resolution and quorum reads when a design question calls for it.`,
    exercises: [],
  },
];
