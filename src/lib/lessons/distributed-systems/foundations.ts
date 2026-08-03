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
    quiz: [
      {
        id: "ds-what-makes-it-distributed-q1",
        prompt: "What is the third outcome of a remote call that a local function call doesn't have?",
        options: [
          "It blocks forever with no timeout possible",
          "You never find out — the request may have been lost, executed with the reply lost, or be about to execute",
          "It returns a partially constructed value",
          "It throws an exception from a different thread",
        ],
        answer: 1,
        explanation: "Locally a call returns or throws. Over a network there's a third outcome: no answer. \"Never arrived\" and \"arrived, worked, reply lost\" are indistinguishable from the caller — and nearly every mechanism in distributed systems is a specific answer to that ambiguity.",
      },
      {
        id: "ds-what-makes-it-distributed-q2",
        prompt: "Two processes on one machine talk over a unix socket. Is that a distributed system?",
        options: [
          "Yes, if the processes are written in different languages",
          "No, but only because they share a filesystem",
          "No — the socket doesn't partition and both processes die together, so correctness never depends on an independently failing network",
          "Yes — any two communicating processes are distributed",
        ],
        answer: 2,
        explanation: "The line is crossed when correctness depends on more than one machine connected by a network that can fail independently of them. Not \"it's big\" and not \"it's in the cloud\" — an app server and its database in the same rack qualify; two processes sharing a socket do not.",
      },
      {
        id: "ds-what-makes-it-distributed-q3",
        prompt: "Which is NOT one of the four reasons to distribute a system?",
        options: [
          "Capacity — the data or traffic no longer fits on one machine",
          "Availability — one machine's failure must not be the system's failure",
          "Latency — serving a user who is physically far from the server",
          "Simplicity — fewer concerns per service makes the whole system easier to reason about",
        ],
        answer: 3,
        explanation: "The four are capacity, availability, latency, and isolation. Distribution never buys simplicity — it hands you the network's failure modes in exchange for one of those four. A system distributed for none of them has only the costs.",
      },
    ],
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

**"Latency is zero."** A loop that calls a service once per item is fine at ten items and a one-second page load at a thousand. This is the N+1 problem with a network in the middle: even at a fast 1ms per call, 1000 × 1ms is a second of pure waiting.

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
    quiz: [
      {
        id: "ds-fallacies-q1",
        prompt: "A loop calls a service once per item. It's fine for 10 items and takes a full second for 1,000. Which fallacy is this?",
        options: [
          "\"Topology doesn't change\" — the service moved mid-loop",
          "\"Latency is zero\" — the N+1 problem with a network in the middle, where even 1ms per call becomes a second",
          "\"Bandwidth is infinite\" — the payloads add up",
          "\"The network is reliable\" — some of the calls are failing silently",
        ],
        answer: 1,
        explanation: "At a fast 1ms per call, 1,000 sequential calls is a second of pure waiting before any work happens. It's the N+1 query problem with a network hop instead of a database round trip.",
      },
      {
        id: "ds-fallacies-q2",
        prompt: "You write `client.post(url)` with no timeout. What is the concrete danger on Linux?",
        options: [
          "The request is retried automatically by the kernel, causing duplicates",
          "The socket leaks a file descriptor but the call returns normally",
          "TCP retransmits can hold the call for ~15 minutes while a thread pool fills behind it",
          "The call fails immediately with a connection-refused error",
        ],
        answer: 2,
        explanation: "Assuming the network is reliable means accepting the OS default, and Linux's TCP retransmit behavior can hold a call for around 15 minutes. Meanwhile every thread waiting on that dependency is unavailable for anything else.",
      },
      {
        id: "ds-fallacies-q3",
        prompt: "Which four decisions should be made explicitly at every remote call site?",
        options: [
          "Protocol, serialization format, compression, and encryption",
          "Connection pool size, DNS TTL, keep-alive, and buffer size",
          "Log level, metric name, trace sampling, and alert threshold",
          "Timeout, retries, fallback, and blast radius",
        ],
        answer: 3,
        explanation: "How long before I give up, how many retries with what backoff and is this safe to repeat, what do I return when it fails, and what still works if this dependency is down for an hour. If you can't answer all four, you haven't finished writing the call.",
      },
    ],
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
    quiz: [
      {
        id: "ds-partial-failure-q1",
        prompt: "Why is a \"gray failure\" more expensive than a clean crash?",
        options: [
          "Gray failures require a full cluster restart to clear",
          "The node is technically alive and effectively useless, so health checks pass and traffic keeps arriving",
          "Gray failures corrupt data while crashes do not",
          "Crashes are always detected by the operating system and reported",
        ],
        answer: 1,
        explanation: "A crash is the easy case: the process is gone, connections reset, clients fail fast. The expensive incidents are a disk answering in 8 seconds instead of 8 milliseconds, a 12-second GC pause, or a replica 40 minutes behind serving stale reads — all of which return 200 from `/health`.",
      },
      {
        id: "ds-partial-failure-q2",
        prompt: "Which question is both answerable and actionable in a system with partial failure?",
        options: [
          "\"How many nodes are healthy right now?\"",
          "\"Has the cluster reached a consistent state?\"",
          "\"Are 99% of requests to this dependency completing within 200ms?\"",
          "\"Is the service up?\"",
        ],
        answer: 2,
        explanation: "Ask about a request, not a node. \"Is it up?\" has no global answer in a system where some parts work and no one has a global view — and even if you could answer it, it wouldn't tell you what to do.",
      },
      {
        id: "ds-partial-failure-q3",
        prompt: "At a 0.1% daily chance of a machine being unhealthy, roughly what does a 1,000-machine fleet look like?",
        options: [
          "One unhealthy machine roughly every three years",
          "Unhealthy machines only during deploys or maintenance windows",
          "Zero, because redundancy cancels the probability out",
          "About one unhealthy machine at all times — partial failure is the steady state, not an exception",
        ],
        answer: 3,
        explanation: "It's arithmetic, not bad luck. Google's published numbers for a new 1,800-machine cluster's first year were ~1,000 machine failures, thousands of disk failures, and ~20 rack failures. A design that treats any of those as exceptional is wrong on day one.",
      },
    ],
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
Read 1 MB sequentially from NVMe SSD    500 µs
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
Same 50 calls, but each is cross-region (80ms)              -> 4s     no
1 KB rows, 10M rows, full scan from NVMe SSD @ 2 GB/s       -> ~5s    no, needs an index
100M writes/day = ~1,200/s average, ~5,000/s at peak        -> one node's worth, if it fits
\`\`\`

Two more worth memorizing: a single NVMe SSD sustains roughly **2 GB/s** sequentially but only ~10,000 random reads per second at queue depth 1 (a SATA SSD is closer to 500 MB/s); and **1 Gbps ≈ 125 MB/s**, which is about 8 seconds to move a gigabyte.

## Tail latency, not average

The average hides the incident. If a request fans out to 100 services in parallel and each has a 1% chance of taking over a second, the chance that *at least one* is slow — and therefore your response is slow — is \`1 - 0.99^100\` ≈ **63%**. Your p99 dependency becomes your median page. Measure and design against p99, and remember that fan-out multiplies the tail.`,
    exercises: [],
    quiz: [
      {
        id: "ds-latency-numbers-q1",
        prompt: "A request fans out to 100 services in parallel, each with a 1% chance of taking over a second. How often is the overall response slow?",
        options: [
          "About 63% of the time — 1 - 0.99^100",
          "About 1% of the time, the same as any single service",
          "About 10% of the time",
          "Almost never, because the calls are parallel rather than sequential",
        ],
        answer: 0,
        explanation: "Fan-out multiplies the tail: you're as slow as your slowest dependency, so your p99 dependency becomes your median page. This is why you measure and design against p99 rather than the average, which hides the incident entirely.",
      },
      {
        id: "ds-latency-numbers-q2",
        prompt: "Why is a ~56ms round trip between New York and London irreducible?",
        options: [
          "Router hops each add a fixed 5ms that cannot be optimized away",
          "Light in fiber travels ~200,000 km/s, so 5,600 km each way is ~28ms one way at the theoretical best",
          "TCP requires a three-way handshake that costs 56ms",
          "Undersea cables are bandwidth-limited rather than latency-limited",
        ],
        answer: 1,
        explanation: "The floor is physics, and real paths aren't straight so it's worse. No amount of engineering removes it — which is why multi-region designs go asynchronous and why \"strongly consistent across regions\" is expensive rather than impossible.",
      },
      {
        id: "ds-latency-numbers-q3",
        prompt: "A page makes 50 sequential service calls. Same datacenter versus cross-region — what's the difference?",
        options: [
          "Roughly the same, since the calls are pipelined",
          "~500ms versus ~1 second, dominated by serialization not distance",
          "~50ms versus ~4 seconds — the design is plausible in one case and impossible in the other",
          "~50ms versus ~200ms — noticeable but usually acceptable",
        ],
        answer: 2,
        explanation: "At ~1ms per same-datacenter round trip that's 50ms. At ~80ms cross-region it's 4 seconds. Rough arithmetic with the latency table kills bad designs before you write any code.",
      },
    ],
  },
];
