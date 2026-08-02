import type { Lesson } from "../types";

export const failureLessons: Lesson[] = [
  {
    id: "ds-failure-detectors",
    module: "failure",
    title: "Failure Detectors: Every Timeout Is a Guess",
    blurb: "why 'is that node dead?' is unanswerable, and how to guess well.",
    content: `## The unanswerable question

You have not heard from node B for 200ms. Is it dead? You cannot know — the possibilities are indistinguishable from where you sit:

\`\`\`
B crashed                         B is in a 5-second GC pause
B's network link is down          the reply is queued behind a big transfer
B is fine, YOUR link is down      B is alive and just slow
\`\`\`

So a failure detector is a **guess with two error modes**, and they trade against each other:

- **False positive** (too aggressive) — you declare a healthy node dead, trigger a needless failover, rebalance terabytes, and possibly create a second writer.
- **False negative** (too patient) — you keep routing traffic to a dead node and every request in that window fails.

Shortening the timeout trades one for the other; nothing removes the trade. What you *can* do is pick the operating point deliberately, and make the consequences of a wrong guess cheap.

## Picking a timeout

Base it on the observed distribution, not a round number. A serviceable rule:

\`\`\`
timeout = p99 latency × 2  … × 3        (measured, not imagined)
\`\`\`

then check the two failure costs at that value. Better: **phi-accrual** failure detection (Cassandra, Akka) reports a *suspicion level* instead of a boolean. It tracks the recent distribution of heartbeat inter-arrival times and outputs φ = a log-scale measure of how surprising the current silence is; φ=8 means roughly a 10⁻⁸ chance this delay is normal. Different subsystems can then act at different thresholds — stop routing reads at φ=3, trigger a failover at φ=10 — instead of sharing one brittle boolean.

## Heartbeats don't scale by themselves

All-to-all heartbeating is O(N²) messages: 1,000 nodes is a million heartbeats per interval. Real options:

- **Centralized** — a coordinator (etcd/ZooKeeper lease) that everyone renews against. Simple, consistent membership, and a bottleneck at large N.
- **Gossip** — each node heartbeats a few random peers and forwards what it has heard. Scales to thousands, converges in O(log N) rounds, but membership is eventually consistent: two nodes can briefly disagree about who is alive. SWIM adds indirect probing — "I can't reach C, can you?" — which cuts false positives from single-link failures dramatically.

## Make the wrong guess cheap

Because the guess *will* be wrong sometimes, the important design work is limiting the damage:

- **Fencing tokens** (previous module) so a wrongly-declared-dead node can't write after the fact.
- **Grace before rebalancing** — route traffic away in seconds, but don't move data for minutes; most "dead" nodes come back.
- **Quorum-based decisions**, so a single node's opinion never removes anyone from the cluster on its own.
- **Idempotent operations**, so retrying a request to a node that turned out to be alive is harmless — which is the next lesson.`,
    exercises: [],
  },
  {
    id: "ds-retries-and-backoff",
    module: "failure",
    title: "Retries, Backoff, Jitter, and Retry Storms",
    blurb: "how the obvious fix turns a blip into an outage, and the four things that stop it.",
    content: `## Retries are a load multiplier

Retrying looks free. It isn't: **every retry is extra load on a system that is already failing**. A service that starts erroring under load, retried 3× by every caller, now receives 4× the traffic. It will not recover on its own. That's a **retry storm**, and it is one of the most common ways a small blip becomes a multi-hour outage.

It gets worse in layers. If four tiers each retry 3 times, a single user request can become 3⁴ = **81 requests** at the bottom tier. Retries at every layer multiply.

## Backoff, and why jitter is not optional

Exponential backoff spreads the retries out:

\`\`\`
attempt 1: immediate
attempt 2: after 100ms
attempt 3: after 200ms
attempt 4: after 400ms      (cap it — usually a few seconds)
\`\`\`

But if 10,000 clients failed at the same instant — which is exactly what a failover or a deploy does — they all retry at exactly 100ms, then all at 200ms. You've replaced a flood with a series of synchronized floods. **Jitter** breaks the synchronization:

\`\`\`
sleep = random(0, min(cap, base × 2^attempt))       "full jitter"
\`\`\`

AWS's published measurements found full jitter both completes work sooner and dramatically reduces contention versus plain exponential backoff. Randomize; never sleep a deterministic amount.

## Retry only what is safe and worth retrying

\`\`\`
retry:        timeouts, connection errors, 503, 429 (honour Retry-After), leader-changed
DO NOT retry: 400, 401, 403, 404, validation errors  — the answer will not change
careful:      500 on a non-idempotent write — did it apply?  (see the next lesson)
\`\`\`

And retry **at one layer only**. Pick the layer that knows the operation's semantics, and make the others fail fast.

## The four controls that actually contain a storm

1. **A retry budget.** Cap retries as a fraction of total requests — gRPC and Envoy default to about 10–20%. Past that, fail immediately. This is the single most effective control, because it bounds the multiplier no matter how many clients there are.
2. **Circuit breakers.** After N consecutive failures, open the circuit and fail instantly for a cooldown; then let a single probe through (half-open) before closing. This gives the struggling dependency room to recover instead of holding it down.
3. **Deadline propagation.** Pass the remaining time budget down the call chain. A service with 50ms left should not start a call that will take 2 seconds and retry twice — most of that work is already garbage.
4. **Load shedding on the server.** The failing service protects itself: when the queue exceeds a threshold, reject immediately with 503 rather than accepting work it will time out on anyway. Fast rejection is far cheaper than a slow failure.

> [Failure & resilience](/library/failure-and-resilience) is the interview-facing companion for circuit breakers and bulkheads; here the emphasis is the arithmetic — why 3 retries at 4 layers is 81 requests, and which control actually bounds it.`,
    exercises: [],
  },
  {
    id: "ds-delivery-semantics",
    module: "failure",
    title: "At-Least-Once, At-Most-Once, and the Exactly-Once Illusion",
    blurb: "idempotency keys, the outbox pattern, and what 'exactly once' really means when a vendor says it.",
    content: `## Only two things are actually available

Sending a message over a network that can drop it gives you a choice of which error you prefer:

- **At-most-once** — send, don't retry. Losses happen; duplicates don't. Fine for a metrics sample, fatal for a payment.
- **At-least-once** — retry until acknowledged. Nothing is lost; duplicates happen, because you cannot distinguish "lost on the way" from "processed, ack lost on the way back". This is the default in every real system.

**Exactly-once delivery is impossible.** The receiver's ack can always be the thing that gets lost, and then the sender must choose between resending (duplicate) and not resending (loss). No protocol escapes that.

## What is achievable: exactly-once *effect*

At-least-once delivery + an idempotent handler = **each message affects the state once**, no matter how many copies arrive. That's what every "exactly-once" product actually sells, and it's a genuinely useful guarantee — just not the one the name suggests.

The mechanism is an **idempotency key**: the client generates a unique id per logical operation and sends it with every attempt, including retries.

\`\`\`
POST /charges   Idempotency-Key: 7f3c-…-a19
  server:  INSERT INTO processed(key, result) VALUES ('7f3c…', …)   -- unique index on key
           conflict?  ->  return the stored result, do no work
\`\`\`

Three details that make or break it:

1. **The key must be generated by the client, before the first attempt**, and reused across retries. A server-generated id is a different id on every retry and protects nothing.
2. **The dedup record and the effect must commit atomically.** Writing the charge and recording the key in two separate transactions leaves a window where a crash gives you a double charge.
3. **The record needs a retention window** — 24 hours is typical. Keeping it forever is expensive; expiring it in 60 seconds means a retry after a long outage is a duplicate.

Some operations are naturally idempotent and need no key: \`SET status = 'shipped'\` is; \`balance = balance - 10\` is not. Where you can, reshape the operation into the first form.

## The dual-write problem, and the outbox

The other half of the problem is on the *producing* side:

\`\`\`
db.commit(order)             // succeeds
queue.publish(orderCreated)  // process dies here
                             // -> order exists, nobody downstream knows. Forever.
\`\`\`

Two systems, no shared transaction. Swapping the order just changes which way you're inconsistent. The fix is the **transactional outbox**: write the event to an \`outbox\` table **in the same database transaction** as the business data. A separate relay polls the table (or tails the write-ahead log, which is what change-data-capture tools like Debezium do) and publishes, marking rows sent.

\`\`\`
BEGIN
  INSERT INTO orders …
  INSERT INTO outbox (event, payload) …
COMMIT                       ← one atomic write, no dual write

relay: read unsent outbox rows -> publish -> mark sent    (at-least-once; consumers dedup)
\`\`\`

You still get duplicates — the relay can publish and die before marking — which is exactly why the consumer side needs the idempotency key above. The two mechanisms are one design: **at-least-once everywhere, idempotent at every boundary.**

> The library's [Delivery semantics](/library/delivery-semantics) note is the interview-facing version of this vocabulary; [Distributed transactions](/library/distributed-transactions) covers sagas and 2PC, the heavier alternative to the outbox.`,
    exercises: [],
  },
  {
    id: "ds-split-brain",
    module: "failure",
    title: "Split Brain and Recovery",
    blurb: "two halves that both believe they're in charge, and the three ways to make that impossible.",
    content: `## What split brain is

A partition cuts the cluster in two. Each side sees the other as dead. Each side, following perfectly reasonable local logic, elects a leader and continues serving.

\`\`\`
        ╳ partition ╳
[A B]                   [C D E]
 A elected leader        C elected leader
 accepts writes          accepts writes
\`\`\`

Both sides are internally consistent and both are wrong. When the network heals you have two divergent histories over the same keys, and **no automatic merge exists** for anything with a global invariant: two bookings for one seat, two withdrawals of a balance that only covered one. Someone has to lose data, and it's usually discovered days later by a customer.

## The three preventions

**1. Quorum.** Only a majority may act. \`[A B]\` is 2 of 5 and simply cannot elect a leader or commit a write; \`[C D E]\` is 3 of 5 and proceeds. Any two majorities of the same set overlap, so two leaders in one term are impossible. This is why consensus clusters are odd-sized, and why the minority side must go **read-only or fully unavailable** — that unavailability is the feature.

**2. Fencing.** Assume it happens anyway and make the stale writer harmless: the resource rejects any write carrying a token lower than the highest it has seen (module 4). This is the layer that saves you when the "dead" node was only paused.

**3. STONITH.** "Shoot The Other Node In The Head" — the new leader forcibly power-cycles or network-isolates the old one before taking over, usually via a management interface or a shared storage reservation. Brutal, but it's the only option when the protected resource genuinely can't validate a token (an old NAS, a physical device).

Note what *isn't* on this list: a longer timeout, a better health check, or a third heartbeat channel. Those make split brain rarer, which mostly means you discover it later.

## Two things that quietly reintroduce it

**The two-node cluster.** With \`N=2\`, a majority is 2, so a single failure stops all writes — and the pressure to "just let one node keep going" is what creates split brain. Use 3 nodes, or a lightweight **witness/arbiter** that only votes and stores no data.

**The asymmetric partition.** A can reach B, B can reach C, A cannot reach C. Each node has a *different* view of who is alive, and a naive membership protocol can flap forever. This is where indirect probing (SWIM's "can you reach C for me?") earns its keep.

## Recovering afterwards

Once you've diverged, you're choosing which writes to lose. The honest options, in descending order of preference:

\`\`\`
1. Only one side was allowed to write     -> discard the minority side's writes. Clean, by design.
2. Version vectors detected the conflict  -> surface both versions, merge in the application
3. CRDT semantics                         -> deterministic merge, no loss, limited data types
4. Last-write-wins by wall clock          -> silent data loss (module 2). A choice, not a solution.
5. Manual reconciliation from logs        -> where you end up if you designed for none of the above
\`\`\`

The real lesson of this module: partial failure, bad clocks, timeout-based detection, and retries all compose. Split brain is what happens when you handle each one locally and none of them together — and the systems that survive it are the ones that decided in advance which side is allowed to lose.`,
    exercises: [],
  },
];
