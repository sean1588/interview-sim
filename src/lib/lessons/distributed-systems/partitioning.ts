import type { Lesson } from "../types";

export const partitioningLessons: Lesson[] = [
  {
    id: "ds-hash-vs-range",
    module: "partitioning",
    title: "Hash vs Range Partitioning",
    blurb: "the first irreversible choice: spread the load, or keep neighbors together.",
    content: `## One decision, two failure modes

Partitioning (sharding) splits data so each node owns a slice. The partition key decides *which* slice, and you get exactly one of two properties:

**Range partitioning** — sort by key, cut into contiguous ranges.

\`\`\`
[a–f] -> node 1     [g–m] -> node 2     [n–s] -> node 3     [t–z] -> node 4
\`\`\`

Range scans are cheap: "all events for this user between Tuesday and Friday" reads one contiguous block on one node. The failure mode is **hot spots by construction**. Partition by timestamp and every write in the system lands on the last partition, so a 4-node cluster does 1 node's worth of writes. Same story for an alphabetical key when your users are 40% "s".

**Hash partitioning** — hash the key, take the hash's position (mod N, or a slot map).

\`\`\`
hash("user:1234") % 4 -> node 2
\`\`\`

Load spreads evenly for free, even on a monotonic key. What you lose is locality: **range scans must hit every node**, because adjacent keys are deliberately scattered. "Give me this user's last 50 events" becomes a scatter-gather across the fleet, with the tail-latency problem from module 1.

## Compound keys give you both

The move most real systems make: hash the **first** component, sort within it.

\`\`\`
partition key: user_id       (hashed -> even spread across nodes)
sort key:      timestamp     (ordered within the partition -> cheap range scans per user)
\`\`\`

That's exactly DynamoDB's partition-key/sort-key model and Cassandra's partition key plus clustering columns. "Recent events for one user" is one node and one sequential read; "all events across all users in an hour" is still a scatter-gather — and you decided which of those two queries you were optimizing when you chose the key.

## Choosing the key

Ask three things, in order:

1. **What is the dominant access pattern?** The key should make the most frequent query hit one partition.
2. **Is the key high-cardinality and evenly distributed?** \`country\` has ~200 values and a power-law distribution; \`user_id\` has millions and is flat.
3. **Does any single value carry a disproportionate share of traffic?** That's the hot-key problem, two lessons from here.

The partition key is the hardest thing to change later — it determines physical placement of every row already written. Changing it means moving all of the data, which is why it deserves more thought than the rest of the schema combined.

> [Sharding & partitioning](/library/sharding-and-partitioning) covers the interview-facing framing; this module walks through the mechanisms — consistent hashing, rebalancing, and the index tradeoff — that determine whether a shard scheme survives growth.`,
    exercises: [],
  },
  {
    id: "ds-consistent-hashing",
    module: "partitioning",
    title: "Consistent Hashing and Virtual Nodes",
    blurb: "why mod N is a trap, and the ring that moves 1/N of the keys instead of all of them.",
    content: `## The problem with mod N

\`node = hash(key) % N\` is fine until \`N\` changes. Go from 4 nodes to 5 and **almost every key maps somewhere new** — roughly \`1 - 1/N\` of them, about 80% here. For a cache that's a near-total miss storm hitting your database at once; for a datastore it's moving the entire dataset to add one machine.

## The ring

Map both keys and nodes onto the same circular space, say \`0 … 2^32-1\`. A key belongs to the **first node found walking clockwise** from the key's position.

\`\`\`
        0
    N1  |
  .-----------.
 /      key_a  \\     key_a walks clockwise -> owned by N2
|  N4          | N2
 \\            /
  '-----------'
        N3
\`\`\`

Add \`N5\` between \`N1\` and \`N2\`: only the keys in that arc move, and they move only from \`N2\`. Everything else is untouched. Remove a node: its arc goes to the next node clockwise, nothing else moves. Expected movement is **1/N of the keys** rather than nearly all of them — that's the whole point of the construction.

## Why you need virtual nodes

Plain consistent hashing has two real defects. With a handful of nodes, random placement leaves wildly uneven arcs — the standard deviation of load is large, and one node can easily own twice its share. And when a node dies, its *entire* arc lands on a single neighbor, which then has double the load and is the next thing to fall over.

Fix: each physical node claims **many** positions on the ring — 100 to 256 virtual nodes is typical.

\`\`\`
N1 -> tokens at 47, 903, 1502, 2211, …   (256 of them, scattered)
\`\`\`

Now the arcs average out (load variance drops roughly as 1/√V), and a node's death spreads its 256 small arcs across *all* the surviving nodes instead of one. Recovery is parallel: every peer streams a little data instead of one peer streaming everything. Virtual nodes also let you weight heterogeneous hardware — give the bigger machine 512 tokens instead of 256.

## Where you'll meet it

Cassandra and Riak partition data this way; Dynamo introduced the pairing of consistent hashing with virtual nodes; memcached clients use it so a cache node loss doesn't invalidate the whole keyspace; and load balancers use "consistent hashing with bounded loads" to keep session affinity without hot spots.

Note what consistent hashing does *not* solve: a single key that's too hot still lives on one node, however you place it. That's the next lesson.`,
    exercises: [],
  },
  {
    id: "ds-rebalancing-and-hot-keys",
    module: "partitioning",
    title: "Rebalancing and Hot Keys",
    blurb: "moving data without a stop-the-world, and the one key that eats a node.",
    content: `## Rebalancing while serving traffic

Adding capacity means moving partitions, and moving data is the most dangerous routine operation a stateful system has: it competes for the same disks and network as production traffic. The mechanics that make it survivable:

**Fixed partition count.** Create far more partitions than nodes up front — say 1,024 for a 10-node cluster — and rebalance by moving *whole partitions* between nodes. The key→partition mapping never changes; only partition→node does, and that's a small map you can update atomically. Riak, Elasticsearch, and Kafka all work this way. The catch: the count is effectively permanent, so pick for the fleet you'll have in five years.

**Copy first, cut over last.** The new owner streams the partition while the old owner keeps serving. Only when the copy has caught up does the routing layer flip, and the old copy is dropped after a delay. A failed move is then a no-op rather than an outage.

**Throttle it.** Uncapped rebalancing saturates the network and turns "we added a node" into an incident. Real systems cap concurrent moves and bytes/sec, and treat rebalance traffic as lower priority than serving traffic.

**Keep a human in the loop.** Automatic rebalancing plus an aggressive failure detector is a feedback loop: a node gets slow, is declared dead, its data is moved, the move makes its neighbors slow, and the cluster tips over. Most mature systems require an operator to confirm a rebalance.

## Hot keys

Partitioning balances *keys*, not *traffic*. One celebrity account, one viral product, one \`tenant_id\` belonging to your biggest customer — and one partition sees a thousand times the average load. No hashing scheme helps: the key hashes to one place by definition.

The mitigations, cheapest first:

\`\`\`
1. Cache in front            most hot keys are read-hot; a cache absorbs it entirely
2. Read replicas for the hot partition, reads fanned out
3. Key salting               write to  key#00 … key#15,  read all 16 and merge
                             -> 16× the write capacity, 16× the read cost. Reads must fan out.
4. Split the hot partition   supported by systems with adaptive splitting (DynamoDB, Bigtable)
5. Batch/aggregate at the edge   count views in memory for 1s, then write one increment
\`\`\`

Salting is the one to understand precisely: it converts a write bottleneck into a read amplification, so it's right for write-hot keys (a counter on a viral post) and wrong for read-hot ones (a celebrity profile — cache that instead).

## Detect before you design

You can't fix a hot key you can't see. Per-partition metrics — requests/sec, bytes, p99 — with a heavy-hitter sketch over the key space is the standard instrumentation. A cluster whose average CPU is 30% while one node sits at 95% is the signature, and aggregate dashboards hide it perfectly.`,
    exercises: [],
  },
  {
    id: "ds-secondary-indexes",
    module: "partitioning",
    title: "Local vs Global Secondary Indexes",
    blurb: "scatter-gather reads or a distributed write — the index tradeoff has no third option.",
    content: `## The problem

Your data is partitioned by \`user_id\`, and a query arrives for \`WHERE color = 'red'\`. The partition key can't answer it, so you need a secondary index — and there are exactly two ways to place one.

## Local index (document-partitioned)

Each partition indexes **only its own rows**.

\`\`\`
partition 1: rows 1..1000    + local index {red: [3, 17], blue: [4, 9]}
partition 2: rows 1001..2000 + local index {red: [1204],  blue: [1099]}
\`\`\`

- **Writes are cheap and local.** Writing a row updates the row and its index entry in the same partition, in one atomic operation. No cross-node coordination.
- **Reads are scatter-gather.** "All red items" must ask *every* partition and merge. With 100 partitions that's 100 queries, and your latency is the slowest of the 100 — the tail-latency arithmetic from module 1 in its worst form.
- Pagination and sorting across the merge are genuinely painful: to get the global top 10 by price you need the top 10 from each partition first.

This is DynamoDB's LSI and Elasticsearch's model (a search query hits every shard).

## Global index (term-partitioned)

The index is its own partitioned structure, keyed by the **indexed term**.

\`\`\`
index partition A: {red: [3, 17, 1204, …]}      (all reds, everywhere)
index partition B: {blue: [4, 9, 1099, …]}
\`\`\`

- **Reads are a single partition lookup.** Fast, and it paginates and sorts properly.
- **Writes now touch two partitions**: the data partition and the index partition, usually on different nodes. Doing that atomically needs a distributed transaction — which is why nearly every system makes the global index **asynchronous** instead, meaning the index lags the data by milliseconds to seconds, and a read-after-write may not find the row it just created.

This is DynamoDB's GSI (explicitly eventually consistent) and Cassandra's materialized views.

## Which one

\`\`\`
read-heavy, high-cardinality term, needs sort/paginate    -> global (accept index lag)
write-heavy, low-cardinality term, few partitions          -> local (accept scatter-gather)
\`\`\`

Two practical notes. Fan-out cost is a function of partition *count*, so a local index over 8 partitions is fine and over 500 is not. And a global index's lag is only acceptable if the read path can tolerate it — "search results miss a product for two seconds" usually yes, "the payment ledger misses a row" never.

> [Indexes](/library/indexes) covers the interview framing of index choice, including the storage-engine side; here the point is placement — that the index's partitioning is a separate decision from the data's, and that one of read cost or write cost has to absorb it.`,
    exercises: [],
  },
];
