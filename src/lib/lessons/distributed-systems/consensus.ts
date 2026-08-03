import type { Lesson } from "../types";

export const consensusLessons: Lesson[] = [
  {
    id: "ds-why-agreement-is-hard",
    module: "consensus",
    title: "Why Agreement Is Hard",
    blurb: "FLP in plain words, and why every real protocol quietly assumes a clock.",
    content: `## The problem statement

Consensus: a set of nodes each propose a value, and they must all decide on **one** of them. Three requirements:

- **Agreement** — no two nodes decide differently.
- **Validity** — the decided value was proposed by someone (no inventing).
- **Termination** — every non-faulty node eventually decides.

Almost everything hard in distributed systems reduces to this: electing a leader, committing a transaction, agreeing on the order of a log, agreeing on cluster membership.

## FLP: you can't have all three

Fischer, Lynch and Paterson proved in 1985 that in an **asynchronous** system — messages can be delayed arbitrarily, no bound on processing time, no usable clocks — with even **one** node allowed to crash, **no deterministic algorithm guarantees all three**.

The intuition is the one from the very first lesson. A node waiting on a peer sees silence. Silence has two causes:

\`\`\`
peer crashed          -> proceed without it, or we hang forever
peer is merely slow   -> proceeding without it may split the decision
\`\`\`

and **from the outside, they are indistinguishable**. Any strategy for breaking the tie can be defeated by an adversarial scheduler that delays exactly the message that would have changed your mind. FLP doesn't say consensus is impossible; it says no algorithm can guarantee termination in *every* execution.

## What real systems do about it

They stop being purely asynchronous — they add a **timing assumption**, which in practice is a timeout.

\`\`\`
"I haven't heard from the leader in 150ms, so I'll assume it's dead and start an election."
\`\`\`

That's a guess. When it's wrong, you get a spurious election, a term bump, and a few hundred milliseconds of unavailability — but never a wrong decision, because safety is protected by quorums, not by the timeout. This is the crucial split that every practical protocol makes:

\`\`\`
SAFETY   (never two leaders in one term, never two conflicting commits)
         -> guaranteed ALWAYS, in every execution, by majority overlap
LIVENESS (someone eventually gets elected and progress resumes)
         -> guaranteed only when the network behaves ("partial synchrony")
\`\`\`

Raft, Paxos, ZAB, Viewstamped Replication all make exactly this trade. Anyone who claims a protocol beats FLP is either changing the failure model or quietly sacrificing termination.

## Where the quorum comes from

Any two majorities of the same set of \`2f+1\` nodes intersect in at least one node. That single overlapping node is what makes it impossible for two conflicting decisions to be made without someone noticing: it either voted for one or the other, and it remembers. With \`2f+1\` nodes you tolerate \`f\` failures — 3 nodes survive 1, 5 survive 2. And this is why consensus clusters are odd-sized: 4 nodes tolerate the same single failure as 3, while making every quorum slower.

> The library's [Consensus & coordination](/library/consensus-and-coordination) is the interview-facing companion — when to reach for etcd or ZooKeeper in a design. This module is about what those systems are doing inside.`,
    exercises: [],
    quiz: [
      {
        id: "ds-why-agreement-is-hard-q1",
        prompt: "What exactly does the FLP result prove?",
        options: [
          "That Byzantine faults make agreement unachievable",
          "In a fully asynchronous system with even one possible crash, no deterministic algorithm guarantees agreement, validity, and termination in every execution",
          "That consensus is impossible in any real distributed system",
          "That consensus requires at least five nodes to be safe",
        ],
        answer: 1,
        explanation: "FLP doesn't say consensus is impossible — it says no algorithm guarantees *termination* in every execution. The intuition is that a waiting node can't distinguish a crashed peer from a slow one, and an adversarial scheduler can always delay the message that would change its mind.",
      },
      {
        id: "ds-why-agreement-is-hard-q2",
        prompt: "In Raft and Paxos, what protects safety when an election timeout guesses wrong?",
        options: [
          "A synchronized clock shared across the cluster",
          "The leader confirms its own liveness before stepping down",
          "Majority overlap — quorums guarantee safety in every execution, regardless of whether the timeout was right",
          "The timeout is tuned so it is never wrong in practice",
        ],
        answer: 2,
        explanation: "This is the crucial split every practical protocol makes. Safety — never two leaders in one term, never two conflicting commits — is guaranteed always, by quorum intersection. Liveness is guaranteed only when the network behaves. A wrong timeout costs an unnecessary election, never a wrong decision.",
      },
      {
        id: "ds-why-agreement-is-hard-q3",
        prompt: "Why are consensus clusters odd-sized?",
        options: [
          "Even-sized clusters cannot form a majority at all",
          "Odd sizes let the leader break ties with its own vote",
          "Replication protocols require a prime number of participants",
          "4 nodes tolerate the same single failure as 3, while making every quorum slower",
        ],
        answer: 3,
        explanation: "With `2f+1` nodes you tolerate `f` failures: 3 survives 1, 5 survives 2. Going from 3 to 4 buys no extra fault tolerance but raises the quorum from 2 to 3, so every decision waits on one more node.",
      },
    ],
  },
  {
    id: "ds-raft-leader-election",
    module: "consensus",
    title: "Raft: Leader Election",
    blurb: "terms, timeouts, votes — and the two rules that make a split impossible.",
    content: `## Three states, one term counter

Every Raft node is a **follower**, a **candidate**, or the **leader**. The other piece of state is the **term**: a monotonically increasing integer, effectively a logical clock for leadership. Each term has *at most one* leader — possibly none, if an election fails.

Every message carries its sender's term, and two rules govern it:

\`\`\`
if incoming term > my term:  adopt it and become a follower  (immediately, whatever I was doing)
if incoming term < my term:  reject the message
\`\`\`

A deposed leader that comes back from a partition learns it's stale on its very first exchange and steps down. That's the whole "old leader returns" problem, handled in two lines.

## The election

1. The leader sends heartbeats (empty AppendEntries) every ~50ms.
2. A follower that hears nothing for its **election timeout** — randomized, typically 150–300ms — assumes the leader is gone.
3. It increments the term, votes for itself, becomes a candidate, and sends RequestVote to everyone.
4. A node grants its vote if: the candidate's term is at least its own, it **hasn't already voted in this term**, and the candidate's log is at least as up to date as its own.
5. A candidate with votes from a **majority** becomes leader and starts heartbeating immediately.

Three outcomes: it wins; it hears from a legitimate leader with a term ≥ its own and reverts to follower; or nobody gets a majority and the timeout fires again for a new term.

## The two rules that make two leaders impossible

**One vote per node per term**, plus **majority required to win**. Two candidates in the same term would need two majorities of the same set, which must overlap in at least one node — and that node only voted once. Safety here does not depend on timeouts being right, on clocks agreeing, or on the network cooperating. Note what this means in a partition: the minority side can *hold* elections forever and never win one, so it simply cannot serve writes.

## Why the timeout is randomized

If every follower used exactly 150ms, they'd all become candidates at the same instant, split the vote, and repeat — a livelock. Randomizing across a window means one node almost always times out first and wins uncontested. This is the *liveness* half of the FLP trade, and it's why the constant matters: the window must be comfortably larger than a normal round trip (a 20ms timeout in a 30ms-RTT cluster elects a new leader forever) and small enough that failover is quick. 150–300ms in a datacenter, seconds across regions.

## The log-freshness rule

Step 4's last condition — "log at least as up to date" — is what stops a node that missed the last 10,000 entries from winning and truncating committed data. It's compared by \`(lastLogTerm, lastLogIndex)\`, higher term first. Keep it in mind; the next lesson shows the commit rule it protects.`,
    exercises: [],
    quiz: [
      {
        id: "ds-raft-leader-election-q1",
        prompt: "Which two rules make two leaders in the same term impossible?",
        options: [
          "Log freshness comparison, plus the term-adoption rule",
          "Synchronized clocks, plus a fixed election timeout",
          "One vote per node per term, plus a majority required to win",
          "Randomized timeouts, plus the leader's heartbeat interval",
        ],
        answer: 2,
        explanation: "Two candidates in one term would need two majorities of the same set, which must overlap in at least one node — and that node voted only once. Safety here doesn't depend on timeouts being right, clocks agreeing, or the network cooperating.",
      },
      {
        id: "ds-raft-leader-election-q2",
        prompt: "Why is the election timeout randomized rather than a fixed value?",
        options: [
          "It makes the protocol resistant to an attacker predicting elections",
          "It spreads disk writes so the fsync load is smoother",
          "It lets slower nodes participate on an equal footing",
          "Identical timeouts make every follower become a candidate at once, splitting the vote and livelocking",
        ],
        answer: 3,
        explanation: "Randomizing across a window means one node almost always times out first and wins uncontested. This is the liveness half of the FLP trade, and the constant matters: the window must comfortably exceed a normal round trip, or you elect a new leader forever.",
      },
      {
        id: "ds-raft-leader-election-q3",
        prompt: "What does the \"log at least as up to date\" vote condition prevent?",
        options: [
          "A node that missed thousands of entries from winning an election and truncating committed data",
          "Two candidates from starting an election in the same term",
          "A deposed leader from rejoining the cluster",
          "Followers from applying entries before the leader commits them",
        ],
        answer: 0,
        explanation: "It's compared by `(lastLogTerm, lastLogIndex)`, higher term first. Combined with majority overlap, it means a node missing a committed entry can never be elected — which is what makes \"committed\" actually durable.",
      },
    ],
  },
  {
    id: "ds-raft-log-replication",
    module: "consensus",
    title: "Raft: Log Replication and Commit Rules",
    blurb: "how an entry becomes committed, and the subtle rule about entries from old terms.",
    content: `## The log is the state machine

Raft doesn't replicate *state*, it replicates an ordered **log of commands**. Every node applies the same commands in the same order to the same initial state, so every node ends in the same state — replicated state machine, and it's why the log's order is the thing worth agreeing on.

\`\`\`
index:   1        2        3        4
leader:  x=1 (t1) y=2 (t1) x=5 (t2) z=9 (t2)
                                    ^ committed up to here
\`\`\`

## The write path

1. A client sends a command to the leader.
2. The leader appends it to its own log — **not yet committed, not yet applied**.
3. It sends AppendEntries to all followers, carrying the new entry plus \`prevLogIndex\` and \`prevLogTerm\`.
4. A follower accepts **only if** its log has a matching entry at \`prevLogIndex\` with \`prevLogTerm\`. Otherwise it rejects, and the leader walks backwards until they agree, then overwrites the follower's divergent tail.
5. Once a **majority** has the entry, the leader marks it **committed**, applies it to its state machine, and replies to the client.
6. Followers learn the new commit index from the next heartbeat and apply it too.

That step-4 consistency check gives the **Log Matching Property**: if two logs have the same term and index for one entry, they are identical in every preceding entry. One integer pair verifies the entire history.

## Committed means durable

An entry that reached a majority survives any \`f\` failures, because any future leader must win a majority, and that majority overlaps the one that stored the entry — combined with the log-freshness vote rule, a node missing a committed entry can never be elected. This is why "committed" is the point where you may reply to the client, and why replying at step 2 would be a lie.

## The subtle rule: never commit an old term by counting replicas

The rule that trips everyone up: **a leader may only mark an entry committed by counting replicas if the entry is from its own current term.**

Why — the situation Raft's paper walks through (Figure 8). A leader in term 2 replicates entry 4 to a minority and crashes. A new leader in term 3 sees entry 4 on a majority and, if it were allowed to, marks it committed. It then crashes. A node whose log lacks entry 4 can still be elected in term 4 (its log is fresher on term grounds) and it will **overwrite entry 4** — a committed entry, gone.

The fix: the term-3 leader appends a **no-op entry in term 3** and commits *that* by majority. Committing an entry from the current term commits everything before it transitively, and the ordering rules then make the bad election impossible. This is also why you often see a small no-op write immediately after an election.

## What this costs

Every write is one round trip from the leader to a majority — roughly one network RTT plus one disk fsync per node, so ~1–5ms within a datacenter and 100ms+ across regions. Reads are subtler than they look: serving them from the leader's memory is wrong if the leader has been silently deposed, so a linearizable read needs either a heartbeat round trip first (ReadIndex) or a lease — the next lesson.`,
    exercises: [],
    quiz: [
      {
        id: "ds-raft-log-replication-q1",
        prompt: "At what point may a Raft leader reply to the client?",
        options: [
          "Once a majority has the entry and it is marked committed",
          "As soon as it appends the entry to its own log",
          "Once every follower has acknowledged the entry",
          "Once the entry has been applied to the leader's state machine",
        ],
        answer: 0,
        explanation: "Replying after the local append would be a lie — that entry can still be overwritten. An entry that reached a majority survives any `f` failures, because any future leader must win a majority that overlaps the one storing it.",
      },
      {
        id: "ds-raft-log-replication-q2",
        prompt: "Why may a leader not commit an entry from a *previous* term just by counting replicas?",
        options: [
          "Followers reject AppendEntries carrying an older term",
          "A later leader whose log lacks that entry can still be elected on term grounds and would overwrite it — so it was never safely committed",
          "Entries from old terms have already been applied by definition",
          "The term counter would overflow if old entries were recommitted",
        ],
        answer: 1,
        explanation: "This is Raft's Figure 8. The fix is to append a no-op in the current term and commit that by majority — committing a current-term entry commits everything before it transitively. It's why you often see a small no-op write right after an election.",
      },
      {
        id: "ds-raft-log-replication-q3",
        prompt: "Why can't a linearizable read simply be served from the leader's memory?",
        options: [
          "Reads must be replicated to a majority like writes",
          "Followers may hold newer entries than the leader",
          "The leader may have been silently deposed — it needs a heartbeat round trip (ReadIndex) or a lease to know it's still leader",
          "The leader's state machine lags its log by design",
        ],
        answer: 2,
        explanation: "A partitioned leader still believes it's the leader. Confirming leadership costs a heartbeat round trip, or you take the lease approach — which trades the round trip for an assumption about bounded clock drift.",
      },
    ],
  },
  {
    id: "ds-leases-and-fencing",
    module: "consensus",
    title: "Leases, Locks, and Fencing Tokens",
    blurb: "why a distributed lock without a fencing token isn't a lock.",
    content: `## A lock you can't hold forever

A local mutex is released by the runtime when its holder dies. Over a network, the holder can vanish and never release anything — so a distributed lock is always a **lease**: a lock with an expiry that must be renewed. That's the only way to break the deadlock. But it introduces the problem the whole lesson is about: an expiry is a clock decision, and clocks lie.

## The failure, step by step

Client A takes a 30-second lease on a file and starts working. Then:

\`\`\`
t=0    A acquires the lease, begins writing
t=5    A's JVM enters a 40-second stop-the-world GC pause   (or its VM is live-migrated,
                                                             or its network blips)
t=30   the lease expires. The lock service is behaving correctly.
t=31   B acquires the lease and starts writing
t=45   A wakes up. It has NOT been told anything. It believes it still holds the lease
       — and completes its half-finished write.
\`\`\`

Two writers, no error anywhere, corrupted data. Nothing here is a bug in the lock service: a paused process cannot be told anything, and it cannot check the clock while it is paused. **A lease alone cannot prevent this**, and no amount of "check the lease is still valid before writing" fixes it — the pause can land between the check and the write.

## The fix: make the resource reject the stale writer

The lock service returns a **fencing token** with each grant: a number that strictly increases on every acquisition.

\`\`\`
A acquires -> token 33      B acquires -> token 34

write(data, token=34) from B   -> storage records last-token = 34, accepts
write(data, token=33) from A   -> 33 < 34  -> REJECTED
\`\`\`

The protection moved to where it can actually work: **the resource being protected checks the token**, and a resource can always compare two integers, whatever the writers believe about time. A lock service that hands out a token nobody validates provides no mutual exclusion — it provides advice.

In practice the token is whatever monotonic number your coordinator already has: ZooKeeper's \`zxid\` or an ephemeral znode's sequence number, etcd's revision or lease id, a Raft term, or a database row version used in a compare-and-set update.

## Leader leases

The same mechanism gives cheap linearizable reads. If the leader holds a lease valid until \`T\` (agreed by the majority that elected it) and reads only while its own monotonic clock says \`now + safety_margin < T\`, no other node can be leader in that window — so a local read is safe, no round trip. The correctness now depends on bounded clock **drift** rather than synchronized clocks, which is a far weaker assumption, but it *is* an assumption: this is the one place where getting NTP wrong turns into a correctness bug rather than a slow query.

## When you don't need a lock at all

Reach for a distributed lock less often than you think. If the operation is **idempotent**, running it twice is harmless. If the work is **partitioned by key** and only one owner exists per key, exclusion is structural. If it's a single-row invariant, a **compare-and-set** in the database is a lock that can't be held by a dead process. Locks are for coordinating over resources that can't check a token themselves — and that's exactly the case that needs fencing most.

> [Concurrency control](/library/concurrency-control) in the library covers the interview framing of locking and CAS; this lesson is about the specific way a lock silently stops being one.`,
    exercises: [],
    quiz: [
      {
        id: "ds-leases-and-fencing-q1",
        prompt: "A client with a 30-second lease is paused by a 40-second GC, the lease expires, another client acquires it, and the first wakes up and writes. Why doesn't \"check the lease before writing\" fix it?",
        options: [
          "The lease service failed to revoke the lease correctly",
          "The check reads a cached lease value rather than the authoritative one",
          "The second client should have waited for the first to acknowledge the expiry",
          "The pause can land between the check and the write — a paused process can't be told anything and can't check the clock while paused",
        ],
        answer: 3,
        explanation: "Nothing here is a bug in the lock service — it behaved correctly. A lease alone cannot prevent two writers, because there is always a window between validating and acting.",
      },
      {
        id: "ds-leases-and-fencing-q2",
        prompt: "Where does a fencing token move the protection to?",
        options: [
          "The resource being written — it records the highest token seen and rejects anything lower",
          "The lock service, which now tracks which client holds the lease",
          "The client, which compares its token against the current time",
          "The network layer, which drops packets from stale holders",
        ],
        answer: 0,
        explanation: "A resource can always compare two integers, whatever the writers believe about time. A lock service that hands out a token nobody validates provides no mutual exclusion — it provides advice.",
      },
      {
        id: "ds-leases-and-fencing-q3",
        prompt: "Which situation genuinely doesn't need a distributed lock?",
        options: [
          "Several nodes update the same counter row concurrently",
          "The work is partitioned by key with one owner per key, so exclusion is structural",
          "Two services occasionally write the same file on shared storage",
          "A nightly job must not run twice across a fleet of identical workers",
        ],
        answer: 1,
        explanation: "Reach for a distributed lock less often than you think. Idempotent operations are safe to repeat, key-partitioned work has structural exclusion, and a single-row invariant is better served by compare-and-set — a lock that can't be held by a dead process.",
      },
    ],
  },
];
