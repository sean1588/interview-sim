import type { Lesson } from "../types";

export const replicationLessons: Lesson[] = [
  {
    id: "ds-leaders-and-followers",
    module: "replication",
    title: "Leaders, Followers, and Multi-Leader",
    blurb: "the three replication topologies, and what each one does to your writes.",
    content: `## Replication exists for three different reasons

Keeping a copy of the same data on several nodes buys you **availability** (a node dies, the data doesn't), **read throughput** (spread reads across copies), and **latency** (a copy near the user). Which topology you pick determines what it costs you on the write path.

## Single leader

One node accepts writes; the rest replicate from it and serve reads.

\`\`\`
writes ---> [LEADER] ---replication log---> [follower] ---> reads
                     \\--------------------> [follower] ---> reads
\`\`\`

Why it's the default (Postgres, MySQL, most of Kafka's per-partition model): with one writer, every write to a key is *already* ordered — there is no concurrency to resolve, so no conflicts exist by construction. What you pay:

- The leader is a write bottleneck and a failure point; a failover has a window (typically 10–40 seconds) where writes fail.
- Followers lag. Ask a follower right after you wrote and you may not see your own write.
- **Asynchronous** replication can lose acknowledged writes if the leader dies before shipping them; **synchronous** replication doesn't, but ties your write latency and availability to the slowest follower. Most systems run semi-synchronous: one synchronous follower, the rest async.

## Multi-leader

Several nodes accept writes and replicate to each other — typically one leader per region, or per datacenter.

You get local write latency and survive a whole region. What you get *back* is the thing single-leader eliminated: **two writes to the same key, accepted in different places, with neither aware of the other.** Now you need the machinery from the last module — version vectors to detect it, and a resolution policy (last-write-wins with its documented data loss, keep-both siblings, or a CRDT) to settle it.

Multi-leader is the right call when writes are naturally partitioned by geography or by user, and when the merge is genuinely commutative. It's the wrong call for anything with a global invariant, like "one seat, one booking" or "the balance never goes below zero".

## Leaderless

Any node takes any write; the client (or a coordinator) writes to several replicas and reads from several. Dynamo, Cassandra, Riak. Conflicts are detected at read time and repaired — read repair, plus a background anti-entropy process. This is the world quorums live in, which is the next lesson.

## The one question that picks the topology

**Who is allowed to accept a write for this key?** One node → single leader. Several → you owe an answer to "what happens when two of them accept at once", and that answer is the design.

> [Replication & quorums](/library/replication-and-quorums) is the interview-facing companion: the vocabulary and the sizing move for a design question. Here we care about *why* the leaderless write path needs conflict machinery at all.`,
    exercises: [],
  },
  {
    id: "ds-quorums",
    module: "replication",
    title: "Quorums and the R + W > N Intuition",
    blurb: "why overlapping read and write sets give you fresh data without a leader.",
    content: `## The pigeonhole argument

With \`N\` replicas, require each write to be acknowledged by \`W\` of them, and each read to gather answers from \`R\` of them. If

\`\`\`
R + W > N
\`\`\`

then the read set and the write set **must share at least one node** — there aren't enough replicas for them to be disjoint. That shared node has the latest write, so the read sees it (given a version number or timestamp to pick the newest of the returned values). No leader required, and no coordination on the write path.

\`\`\`
N=3, W=2, R=2:   write hits {A,B}     read hits {B,C}     B overlaps -> fresh value seen
N=3, W=2, R=1:   write hits {A,B}     read hits {C}       no overlap -> stale read possible
\`\`\`

## Tuning it

\`N=3, W=2, R=2\` is the common default: tolerates one node down for both reads and writes.

- **Read-heavy** → \`W=N, R=1\`. Reads are fast and single-node; writes fail if any replica is down.
- **Write-heavy** → \`W=1, R=N\`. Writes always succeed somewhere; reads get expensive and slow.
- \`W=1, R=1\` (so \`R+W ≤ N\`) is *sloppy* — fast, and eventually consistent with no freshness guarantee. Sometimes exactly right (view counters, presence), often chosen by accident.

Note that a larger \`N\` doesn't just add durability: it adds tail latency, because \`R\` and \`W\` responses now come from a bigger pool where the slowest node is slower.

## The caveats that matter in practice

**Quorums are not linearizable.** Even with \`R+W>N\`, edge cases leak stale or lost writes: a write that fails after reaching some replicas is neither applied nor rolled back; two concurrent writes still need version reconciliation; and a read concurrent with a write may or may not see it. If you need real linearizability, you need consensus, not a quorum.

**Sloppy quorums and hinted handoff.** During a partition, a system may accept \`W\` acks from *any* \`W\` reachable nodes, not the \`W\` that own the key — the write is durable, but it isn't on the home replicas, so \`R+W>N\` no longer guarantees overlap. The temporary holders keep hints and hand the data back when the owners return. It's an availability choice with a real freshness cost.

**Latency is set by the W-th response.** With \`W=2\` of 3 you wait for the second-fastest replica, which is why quorum systems often send to all \`N\` and take the first \`W\` — a cheap hedge against one slow node.`,
    exercises: [],
  },
  {
    id: "ds-consistency-menu",
    module: "replication",
    title: "The Consistency Menu",
    blurb: "from linearizable down to eventual, and what each rung costs in round trips.",
    content: `## It's a spectrum, not a switch

"Strongly consistent" and "eventually consistent" are the two ends of a ladder with useful rungs in between. Each rung is a **promise to the reader** about what they can observe.

**Linearizable** — the system behaves as if there were one copy of the data and every operation took effect at a single instant between its call and its return. Once a write returns, *every* subsequent read (by anyone) sees it. This is the only model that composes with things outside the system — the user who saw the confirmation and immediately refreshed on their phone. Cost: consensus on the write path, and a read that can't be served from an arbitrary replica.

**Sequential / serializable** — everyone sees the same order, but it need not match real time. Cheaper, and enough for a lot of internal logic.

**Causal** — if \`a → b\`, no one sees \`b\` without \`a\`. Concurrent operations may be seen in different orders by different readers. This is the strongest model available without giving up availability during a partition, and it's usually what people actually want when they say "consistent": the reply never appears above the comment it replies to.

**Read-your-writes** — you see your own writes; others may lag. Almost always required for anything a user edits, and cheap to buy with a stickiness trick rather than a stronger store.

**Monotonic reads** — you never move backwards in time. Prevents the classic "refresh and the comment disappears" from hitting two replicas with different lag.

**Eventual** — if writes stop, replicas converge. Says nothing about when, and nothing about what you see meanwhile.

## Buying the middle rungs cheaply

You rarely need to upgrade the whole datastore. The session-level guarantees are usually bought at the edge:

\`\`\`
read-your-writes  -> route this user's reads to the leader for N seconds after a write,
                     or pass the write's version and require a replica at least that fresh
monotonic reads   -> pin a user's session to one replica (consistent hashing on user id)
causal            -> carry the version/dependency vector on the request and wait for it
\`\`\`

## Pick per operation, not per system

The same product has different needs on different paths, and the right design mixes them:

\`\`\`
"is this seat still free" at checkout    -> linearizable
account balance shown in the header      -> read-your-writes
follower count                           -> eventual (and cached for 60s)
notification feed ordering               -> causal
\`\`\`

Choosing linearizable everywhere is a common and expensive mistake: you pay consensus latency on paths where a stale follower count would have been fine.

> [Consistency models](/library/consistency-models) is the interview-facing companion — how to name a guarantee and justify it under questioning. Here the point is the mechanism you'd have to build to keep each promise.`,
    exercises: [],
  },
  {
    id: "ds-cap-pacelc",
    module: "replication",
    title: "CAP As It's Actually Used, and PACELC",
    blurb: "the theorem in its narrow real meaning, and the tradeoff you make every day instead.",
    content: `## What CAP actually says

Formally (Gilbert & Lynch, 2002): no system that is **linearizable** can also stay **available to every node** while the network is **partitioned**. That's it. Three letters, one narrow statement about one very strong consistency model.

The famous "pick two of three" framing is misleading, because P isn't a choice. Networks partition; you don't opt out. The real statement is:

\`\`\`
When a partition happens — and it will — do you
  (C)  refuse to serve requests you can't make consistent, or
  (A)  serve them and accept divergence you'll reconcile later?
\`\`\`

A "CA system" is just a system that hasn't thought about partitions.

## Why practitioners misuse it

The definitions are stricter than the everyday words:

- **C** in CAP is linearizability specifically — not "my data is correct", not serializable isolation.
- **A** in CAP means *every non-failed node* answers. A system where 2 of 3 replicas answer and one is blocked is "not available" by CAP and perfectly available to your users.
- The partition case is a *rare* case. CAP says nothing about the 99.9% of the time when the network is fine — which is where all your latency lives.

That last gap is why CAP alone is a poor design tool.

## PACELC: the complete sentence

Abadi's extension, which is the version worth carrying around:

\`\`\`
if (P)artition:  choose (A)vailability or (C)onsistency
(E)lse:          choose (L)atency or (C)onsistency
\`\`\`

The "else" branch is the one you live in daily. Even with a perfectly healthy network, a linearizable write must reach a quorum before acknowledging — that's a round trip, or several, and cross-region it's 100ms+. You trade latency for consistency **all the time**, not just during incidents.

Classifying real systems:

\`\`\`
PC/EC   Spanner, etcd, ZooKeeper        consistent always, pay latency always
PA/EL   Cassandra, Dynamo, Riak         available and fast, converge later
PC/EL   MongoDB (default), PNUTS        consistent under partition, fast when healthy
\`\`\`

## How to use it on a real design

Don't label the system. Label the **operation**: for this write path, during a partition, what should happen — reject, or accept and reconcile? And when healthy, is an extra 20ms acceptable to make it linearizable? "Booking a seat: PC/EC. Updating a profile photo: PA/EL." That sentence is worth more than any classification of the database as a whole.

> The library's [Multi-region](/library/multi-region) note is the interview-facing companion, covering how to present these tradeoffs in a design discussion; here we care about which mechanism forces the choice.`,
    exercises: [],
  },
];
