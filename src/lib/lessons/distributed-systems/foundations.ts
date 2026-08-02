import type { Lesson } from "../types";

export const foundationsLessons: Lesson[] = [
  {
    id: "ds-what-makes-it-distributed",
    module: "foundations",
    title: "What Makes a System Distributed",
    blurb: "the moment a second machine appears, and the three things you lose.",
    content: `## The line you cross

A system is distributed the moment its correctness depends on **more than one machine, connected by a network that can fail independently of them**. Not "it's big". Not "it's in the cloud". Two processes on one box talking over a unix socket are not distributed — the socket doesn't partition, and both processes die together. An app server and its database in the same rack *are*.

Crossing that line costs you three things you had for free in a single process:

\`\`\`
                  single process              distributed
a call            returns or throws           returns, throws, or NEVER ANSWERS
the clock         one, monotonic, shared      many, drifting, disagreeing
shared state      instantly consistent        consistent eventually, or by protocol
\`\`\`

## The third outcome is the whole subject

In a single process, \`user = getUser(id)\` has two outcomes: a value or an exception. Over a network there is a third: **you don't find out**. The request may have been lost on the way, executed and lost on the way back, or be sitting in a queue and about to execute thirty seconds from now.

\`\`\`
you --- charge($50) ---> ?     timeout after 2s
                                 Did it charge?
                                 You cannot tell from here.
\`\`\`

That ambiguity — indistinguishable "never arrived" and "arrived, worked, reply lost" — is why this course exists. Nearly every mechanism you'll learn (idempotency keys, quorums, consensus, fencing tokens) is a specific answer to it.

## Why anyone does this

Nobody distributes a system for fun. You do it for one of four reasons:

- **Capacity** — the data or the traffic no longer fits on one machine.
- **Availability** — one machine's failure must not be the system's failure.
- **Latency** — the user is in Sydney and the server is in Virginia (200ms round trip, at best).
- **Isolation** — separate teams, blast radii, or compliance domains.

Each buys you something real and hands you the network's failure modes in return. Whenever you're evaluating a design, ask which of the four it's actually buying — a system distributed for none of them has only the costs.

> The library's [Requirements & estimation](/library/requirements-and-estimation) note is the interview-facing companion here: it's about *stating* scale and guarantees under time pressure. This lesson is about what the machinery underneath actually does.`,
    exercises: [],
  },
  {
    id: "ds-fallacies",
    module: "foundations",
    title: "The Fallacies of Distributed Computing",
    blurb: "eight assumptions your single-machine code silently makes, and where each one bites.",
    content: `## Eight assumptions, all false

In 1994 Peter Deutsch and colleagues at Sun listed the assumptions engineers new to distribution make without noticing. They have aged perfectly:

1. The network is reliable.
2. Latency is zero.
3. Bandwidth is infinite.
4. The network is secure.
5. Topology doesn't change.
6. There is one administrator.
7. Transport cost is zero.
8. The network is homogeneous.

They're not trivia. Each one is a bug you will actually ship.

## Where each one bites

**"The network is reliable."** You write \`client.post(url)\` with no timeout, no retry, no idempotency key. A packet drops; the call hangs for the OS default (on Linux, TCP retransmits can hold you for ~15 minutes) and a thread pool fills behind it.

**"Latency is zero."** A loop that calls a service once per item is fine at ten items and a 30-second page load at a thousand. This is the N+1 problem with a network in the middle: 1000 × 1ms is a second of pure waiting.

**"Bandwidth is infinite."** \`SELECT *\` across a service boundary ships a megabyte where 200 bytes were needed. Serialization and gzip of that payload also cost CPU on both ends.

**"Topology doesn't change."** You cache a resolved IP at startup. The instance is replaced during a deploy, and your service keeps talking to an address that no longer exists — or worse, one that's been reassigned.

**"There is one administrator."** The database you depend on is upgraded by another team, on their schedule, and your retry logic meets a 40-second failover window it has never seen.

## The habit to build

Every remote call needs four decisions made explicitly, at the call site:

\`\`\`
timeout      — how long before I give up? (always finite, usually < 1s for interactive paths)
retries      — how many, with what backoff, and is this operation safe to repeat?
fallback     — what do I return/do when it fails? (cache, degraded response, error)
blast radius — if this dependency is down for an hour, what still works?
\`\`\`

If you can't answer all four for a call, you haven't finished writing it. The rest of this course is mostly the detail behind those four answers.`,
    exercises: [],
  },
  {
    id: "ds-partial-failure",
    module: "foundations",
    title: "Partial Failure Is the Normal Case",
    blurb: "why 'it's either up or down' stops being true, and what replaces it.",
    content: `## Nothing is up or down anymore

On one machine, failure is total and shared: the process dies, everything in it dies, you restart. In a distributed system some parts work while others don't, **and no one has a global view of which is which**. That's partial failure, and it is the ordinary steady state of any system with more than a handful of machines.

At scale it's arithmetic, not bad luck. If a machine has a 0.1% chance of being unhealthy on a given day, a 1,000-machine fleet has roughly one unhealthy machine at all times. Google's early published numbers for a new 1,800-machine cluster's first year: ~1,000 individual machine failures, thousands of disk failures, ~20 rack failures. Designs that treat any of those as exceptional are wrong on day one.

## The gray failure is the dangerous one

Crashes are the easy case: the process is gone, connections reset, your client fails fast. The expensive incidents are the ones where a node is **technically alive and effectively useless**:

- A disk that has started returning after 8 seconds instead of 8 milliseconds.
- A node that accepts connections but whose GC pauses for 12 seconds at a time.
- A replica that has fallen 40 minutes behind and is happily serving stale reads.
- A network link dropping 5% of packets — everything "works", everything is slow.

Health checks miss all of these, because \`GET /health\` returning 200 proves only that the health endpoint works.

## What replaces "is it up?"

Three shifts in how you think:

**Ask about a request, not a node.** "Are 99% of requests to this dependency completing within 200ms?" is answerable and actionable. "Is the service up?" is neither.

**Make failure a first-class return value.** The caller must have a defined behavior for "no answer": serve from cache, return a partial result, shed the feature, or fail loudly — chosen deliberately, per call.

**Bound the damage.** Timeouts stop one slow dependency from consuming your threads. Circuit breakers stop you from hammering something that's already down. Bulkheads (separate pools per dependency) stop one sick dependency from starving the others.

> [Failure & resilience](/library/failure-and-resilience) in the library is the interview-facing version — the vocabulary and the move to make when an interviewer asks "what happens when this fails?". Here we care about the mechanism: why a node can be alive and useless, and what you do about it.`,
    exercises: [],
  },
  {
    id: "ds-latency-numbers",
    module: "foundations",
    title: "Latency Numbers You Should Know Cold",
    blurb: "the orders of magnitude that decide which designs are even possible.",
    content: `## The table

Rounded to the order of magnitude that matters. These are the numbers that decide whether an idea is plausible before you write any code.

\`\`\`
L1 cache reference                        1 ns              1×
Main memory reference                   100 ns            100×
Read 1 MB sequentially from memory       20 µs
SSD random read                         100 µs        100,000×
Read 1 MB sequentially from SSD         500 µs
Round trip within the same datacenter   500 µs
Disk (spinning) seek                     10 ms
Round trip US East <-> US West           60 ms
Round trip US East <-> Europe            80 ms
Round trip US East <-> Sydney           200 ms    200,000,000×
\`\`\`

The bottom of the table is a hundred million times slower than the top. That's the whole reason "just add a network call" is never free.

## The floor is physics

Light in fiber travels about 200,000 km/s. New York to London is ~5,600 km, so ~28ms one way, ~56ms round trip **at the theoretical best** — real paths aren't straight and add routers. No amount of engineering removes it. Consequences:

- A cross-region synchronous write costs you ~100ms per round trip, every time. A protocol needing two round trips costs 200ms before any work happens.
- A user-perceptible interaction budget is ~100ms. That budget does not survive a synchronous hop to another continent.
- This is why multi-region designs go asynchronous, and why "strongly consistent across regions" is expensive rather than impossible.

## Use them as a design filter

Rough arithmetic kills bad designs early:

\`\`\`
Page needs 50 sequential service calls, 1ms each, same DC   -> 50ms   plausible
Same 50 calls, but one is cross-region (80ms each)          -> 4s     no
1 KB rows, 10M rows, full scan from SSD @ 500 MB/s          -> ~20s   no, needs an index
100M writes/day = ~1,200/s average, ~5,000/s at peak        -> one node's worth, if it fits
\`\`\`

Two more worth memorizing: a single modern disk sustains roughly **500 MB/s** sequentially but only a few thousand random IOPS; and **1 Gbps ≈ 125 MB/s**, which is about 8 seconds to move a gigabyte.

## Tail latency, not average

The average hides the incident. If a request fans out to 100 services in parallel and each has a 1% chance of taking over a second, the chance that *at least one* is slow — and therefore your response is slow — is \`1 - 0.99^100\` ≈ **63%**. Your p99 dependency becomes your median page. Measure and design against p99, and remember that fan-out multiplies the tail.`,
    exercises: [],
  },
];
