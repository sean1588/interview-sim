import type { Article } from "./types";

export const coordinationArticles: Article[] = [
  {
    id: "concurrency-control",
    section: "coordination",
    title: "Locking, MVCC & Reservations",
    blurb:
      "Optimistic vs pessimistic concurrency, isolation levels, and the hold-then-confirm pattern behind seats, rooms, and inventory.",
    appliesTo: ["ticket-booking", "hotel-booking", "stock-exchange", "payment-system", "collaborative-docs"],
    content: `## The only real question: what must never happen twice

Every inventory system reduces to one invariant — this seat, this room, this share of stock is allocated at most once. Everything else in the design (search, caching, recommendations) can be stale, approximate, and eventually consistent. This one path cannot. Naming that boundary early is the single most valuable move on a booking-shaped prompt.

## Pessimistic vs optimistic

**Pessimistic** — take a lock, then act. \`SELECT … FOR UPDATE\` blocks other writers on those rows until commit. Correct and simple to reason about; under contention it serializes everyone, and a hot row becomes a queue with lock waits, timeouts, and deadlock risk. Fine when contention is low or the critical section is microseconds.

**Optimistic** — read a version, act, then commit conditionally:

\`\`\`sql
UPDATE seats SET status='held', version = version + 1
 WHERE id = ? AND version = ?      -- 0 rows affected => someone beat you
\`\`\`

No locks held across the think time, excellent under low contention, and the loser must retry (or be told to pick another seat). Under *high* contention optimistic retries can thrash — 100k users racing for the same seat means 99,999 wasted attempts.

Which is why the answer for a flash sale is usually neither in isolation, but **admission control in front of the contended resource**: a virtual queue that admits a bounded number of users into checkout at a time. Reduce contention before choosing a concurrency mechanism, rather than trying to make the mechanism survive arbitrary contention.

## Isolation levels, briefly

- **Read committed** — no dirty reads. Two reads in one transaction can differ. The default in Postgres.
- **Repeatable read / snapshot** — the transaction sees a consistent snapshot. Postgres implements this with **MVCC**: writers create new row versions instead of overwriting, so readers never block writers and writers never block readers. Still allows write skew.
- **Serializable** — as if transactions ran one at a time. The only level that eliminates write skew, at the cost of aborts you must be prepared to retry.

**Write skew** is the failure mode worth being able to name, because it's exactly the booking bug: two transactions each read "no overlapping reservation exists," each insert their own, and both commit. Neither wrote what the other read, so snapshot isolation permits it. Fixes: serializable isolation, an explicit lock on a parent row, or — best — a database constraint that makes it impossible (Postgres exclusion constraints over date ranges, or a unique index on \`(seat_id, event_id)\`).

**Constraints beat application logic.** A unique index cannot be raced, forgotten by a new code path, or lost in a deploy. Whenever an invariant can be expressed in the schema, put it there and let the write fail.

## The hold-then-confirm pattern

Selecting a seat and paying for it are seconds or minutes apart, and you can neither hold a database lock that long nor let two people pay for the same seat. So make the hold a **first-class, expiring record**:

\`\`\`text
1. reserve:  INSERT hold(seat, user, expires_at = now + 10 min)   -- atomic, unique on seat
2. checkout: user pays within the window
3. confirm:  hold -> booking, transactionally
4. expire:   background sweeper (or TTL) releases stale holds
\`\`\`

Four details separate a working version from a broken one:

- **Expiry must be enforced on read, not only by the sweeper.** A hold whose \`expires_at\` has passed is not a hold, even if the sweeper hasn't run — otherwise a sweeper outage strands inventory.
- **Show the timer.** A silently-expiring hold is a support ticket; a visible countdown is a feature that also creates the urgency the business wants.
- **Payment failure must release inventory promptly**, and payment success after expiry needs a decided outcome (usually: refund, or honor it if inventory allows — pick one and say so).
- **Idempotent confirm.** A retried confirm must not create two bookings. See [delivery semantics](/library/delivery-semantics).

The same shape covers ride matching (offer held for a driver for 15 seconds), ecommerce carts, and appointment booking. It's one pattern, reused.

## Where to put the contended state

- **Relational row with a constraint** — simplest, correct, and adequate to a few thousand contended writes/sec. Start here.
- **Redis with atomic operations / Lua** — very fast holds, but Redis is a cache: without persistence and failover guarantees, a failover can lose holds. Acceptable for short holds if the durable store is the arbiter at confirm time. Don't make Redis the source of truth for inventory.
- **Single-writer per partition** — route all writes for one event (or one symbol) to one process that owns that state in memory and appends decisions to a durable log. This is how a [matching engine](/library/consensus-and-coordination) hits microseconds: no locks at all, because there's no concurrency. It's the most scalable answer for extreme contention and the one candidates rarely reach.
- **Sharded counters** — for *aggregate* limits (tickets remaining, budget left) rather than identified units, split the counter N ways and let each shard allocate independently. Trades exact-at-the-boundary behavior for throughput.

> **In an interview:** don't say "I'd use a transaction." Say which invariant is protected, where it's enforced (constraint, lock, or single writer), and what happens to a hold when the user closes the tab. That's the whole question.`,
  },
  {
    id: "distributed-transactions",
    section: "coordination",
    title: "Two-Phase Commit, Sagas & the Outbox",
    blurb:
      "Keeping multiple services consistent without distributed transactions: sagas, compensation, and reconciliation.",
    appliesTo: ["payment-system", "hotel-booking", "ticket-booking", "ride-sharing", "notification-service"],
    content: `## Once state is split, ACID stops at the service boundary

Book a trip: reserve a room, charge a card, issue a ticket, send a confirmation. Four services, four datastores. Any of them can fail after the others succeeded. A single database transaction cannot span them, so you need an explicit strategy for partial failure — and "we'll wrap it in a transaction" is not one.

## Two-phase commit, and why it's rare

A coordinator asks every participant to **prepare** (do the work, promise you can commit, hold locks), and if all say yes, tells everyone to **commit**.

It gives real atomicity across resources, and it has one fatal operational property: **it blocks**. Between prepare and commit, participants hold locks and cannot decide alone. If the coordinator dies in that window, participants are stuck — locks held, rows frozen, waiting for a coordinator that may never return. Availability becomes the product of every participant's availability, and latency includes the slowest one.

2PC survives inside tightly-coupled infrastructure with a highly available coordinator (a distributed database's internal commit protocol, XA between two databases in one datacenter). For microservices across a network, it's the wrong tool, and knowing *why* — coordinator failure causes indefinite blocking — is what an interviewer is listening for.

## Sagas: a sequence of local transactions

A saga replaces one distributed transaction with N local ones, each with a **compensating action** that semantically undoes it.

\`\`\`text
reserve room     -> compensate: cancel reservation
charge card      -> compensate: refund
issue ticket     -> compensate: void ticket
\`\`\`

If step 3 fails, run compensations for 2 and 1, in reverse. What you get: no distributed locks, each service stays autonomous, and the system stays available. What you give up: **atomicity in the strict sense.** There are intermediate states visible to the outside world — for a while, the card is charged and no ticket exists. The business has to accept those states, so they're a product decision as much as a technical one.

Two orchestration styles:

- **Orchestrated** — a coordinator service holds the saga state machine and calls each step. Easy to reason about, easy to observe, and a component to run.
- **Choreographed** — each service reacts to the previous one's event. No central component, and the flow only exists as an emergent property of the event graph, which makes debugging and change genuinely hard past three or four steps.

Prefer orchestration once there's any branching. "Where is order 12345 in the flow?" should be a query, not an investigation.

## Compensation is not rollback

The distinction is the crux, and it's where the real work is:

- Compensations are **business operations with their own visible effects.** A refund is not the erasure of a charge; it's a second ledger entry, possibly with a fee, definitely on the customer's statement.
- Compensations **can fail too.** They need retries, and eventually a human queue. A saga that can't complete or compensate must land somewhere a person looks.
- Some steps are **irreversible** (email sent, physical item shipped). Order the saga so irreversible steps come *last*, after everything revocable has succeeded.
- Compensations must be **idempotent and safe out of order**, because retries and a slow original response can interleave. Refunding twice is a real bug that ships.

## The building blocks that make it work

**Transactional outbox** for the messaging: write the business change and the outgoing event in the same local transaction, and publish from the outbox. This eliminates the dual-write hole where a step succeeded but nobody was told (see [delivery semantics](/library/delivery-semantics)).

**Idempotency keys** on every step, so a retried step doesn't double-charge.

**A durable state machine** for the saga itself — persisted, with a timeout per step. Steps hang; a saga with no timeout waits forever.

**Reconciliation** as a standing job, not a fallback: compare your ledger against the payment provider's records, find charges with no order and orders with no charge, and repair or escalate. Every payment system that works has one. Volunteering it is a strong signal.

## Choosing your escape hatches

Before reaching for a saga, ask whether you can avoid the problem outright — it's the cheaper answer more often than people expect:

- **Colocate the data.** If two pieces of state always change together, they may belong in one service and one transaction. Distributed transactions are often a symptom of a service boundary drawn in the wrong place.
- **Make it eventually consistent by design.** Not everything needs to appear atomic. "Your booking is confirmed; the loyalty points arrive within a minute" is a perfectly good product contract.
- **Single-writer ownership.** One service owns the invariant; others request and observe. Concentrating the decision removes the coordination.

> **In an interview:** say "saga with compensations, orchestrated, with an outbox for the events and a reconciliation job against the provider" — then name the visible intermediate state and what the user sees during it. The intermediate state is the part that proves you understand the tradeoff you just made.`,
  },
  {
    id: "consensus-and-coordination",
    section: "coordination",
    title: "Consensus, Leases & Fencing Tokens",
    blurb:
      "Raft and Paxos at the level you need, leader election, distributed locks that are actually safe, and why timeouts aren't enough.",
    appliesTo: ["distributed-lock", "job-scheduler", "kv-store", "message-queue", "stock-exchange"],
    content: `## What consensus is for

Consensus is how a group of nodes agrees on a single value — or, in practice, on a single **ordered log of operations** — while tolerating failures. Every "who is the leader," "which config is current," "who holds the lock" question reduces to it.

You will almost never implement consensus. You will frequently *depend* on it, and the useful knowledge is what it guarantees, what it costs, and which of your problems it can't solve.

## Raft, in the amount of detail that's useful

Nodes are **leader**, **follower**, or **candidate**, and time is divided into numbered **terms**.

1. A follower that hears no heartbeat within its randomized election timeout (typically 150–300ms) becomes a candidate for the next term and requests votes.
2. A node grants one vote per term, and only to a candidate whose log is at least as up to date as its own. A candidate winning a **majority** becomes leader.
3. The leader accepts all writes, appends them to its log, and replicates. An entry is **committed** once a majority has it — at which point it will survive any minority failure.
4. Randomized timeouts make split votes rare, and they resolve in another term rather than deadlocking.

Consequences to carry into designs:

- **Majority quorum** means a cluster of 2f+1 tolerates f failures: 3 nodes survive 1, 5 survive 2. Even sizes buy nothing (4 also only tolerates 1), which is why clusters are odd-sized.
- **Writes cost a round trip to a majority.** In one datacenter that's sub-millisecond; across continents it's 100ms+ per write. Consensus across regions is a deliberate latency decision.
- **Throughput is bounded by the leader**, so a consensus system is for *metadata and coordination* (kilobytes of config, lock state, cluster membership), not for your data plane.
- **Losing quorum means losing writes.** The system correctly refuses to proceed rather than risk split brain. That's the guarantee, not a bug.

Paxos solves the same problem and predates Raft; Multi-Paxos and Raft are close cousins in practice. ZAB (ZooKeeper) is a third variant. Knowing they're interchangeable at the design level, and that Raft is the one people implement because it was written to be understandable, is enough.

## Distributed locks, and why "just use SETNX" is wrong

The tempting version:

\`\`\`text
SET lock:resource <owner> NX PX 30000     # acquire if absent, 30s expiry
... do the work ...
DEL lock:resource                          # release (only if still yours!)
\`\`\`

Two bugs, one obvious and one fundamental.

The obvious one: releasing must verify ownership, or a client whose lease expired will delete the *new* holder's lock. Use a compare-and-delete (Lua script matching the owner token).

The fundamental one: **a lease expiring does not stop the process that held it.** A 200ms stop-the-world GC pause, a paused VM, or a network partition can make a client believe it still holds a lock the server has already reassigned. Two processes now believe they hold it, and no amount of clock tuning fixes this — clocks drift, pauses are unbounded, and detection is impossible from the outside.

**Fencing tokens** are the fix. The lock service issues a monotonically increasing number with each grant; every write to the protected resource carries it, and the resource **rejects any write with a token lower than the highest it has seen**. The zombie's write is refused because its token is stale. This requires the protected resource to participate — which is precisely why a lock alone can never make an arbitrary side effect safe.

That's the whole "Redlock" debate in two paragraphs: mutual exclusion built on timeouts is an *efficiency* optimization (don't do the work twice), never a *correctness* mechanism. If correctness depends on it, you need fencing, or you need the resource itself to enforce the invariant with a conditional write.

## Leases, sessions, and watches

A coordination service (ZooKeeper, etcd, Consul) gives you the useful primitives on top of consensus:

- **Sessions with heartbeats** — a client keeps its session alive; on expiry, its **ephemeral** nodes vanish automatically. That single mechanism gives you liveness-based membership: leader election is "everyone tries to create the same ephemeral node; one wins," and the leader's crash releases it without any explicit cleanup.
- **Watches / notifications** — clients are told when a key changes instead of polling. Note they're one-shot in ZooKeeper (re-register after firing) and you can miss intermediate values, so treat a watch as "something changed, go read," not as an event stream.
- **Read scaling vs linearizability** — followers serve reads fast but possibly stale. Linearizable reads need the leader or a quorum read (etcd's ReadIndex). Know which one you're asking for.

## When you don't need it

Coordination is a dependency, a latency cost, and an operational burden. Cheaper alternatives that solve the same problems surprisingly often:

- **Partition ownership by hashing** instead of electing per-item owners. Deterministic assignment needs no agreement.
- **Optimistic concurrency in the database you already have.** A conditional update *is* a consensus-free mutual exclusion on that row.
- **Idempotent work.** If running a job twice is harmless, you don't need a lock — which is usually cheaper than making the lock safe.

> **In an interview:** if you propose a distributed lock, immediately say whether it's for efficiency or correctness. If correctness, produce fencing tokens or a conditional write on the resource. That distinction is the entire point of the coordination question, and it's the one most answers miss.`,
  },
];
