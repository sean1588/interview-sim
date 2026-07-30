import type { Article } from "./types";

export const dataArticles: Article[] = [
  {
    id: "datastore-selection",
    section: "data",
    title: "Choosing a Datastore",
    blurb:
      "Relational, document, key-value, wide-column, time-series, graph, blob, vector — what each is actually good at, and how to justify one.",
    appliesTo: ["url-shortener", "file-storage", "metrics-monitoring", "qa-platform", "kv-store"],
    content: `## Match the access pattern, not the buzzword

"Which database?" is really "what shape are the reads?" Write down your two or three hottest queries first; the answer usually falls out. Nearly every real design uses **more than one** store, and the interesting content of your answer is the boundary between them.

## The families

**Relational (Postgres, MySQL)** — the correct default. ACID transactions, joins, secondary indexes, constraints that make certain bugs impossible. A single primary comfortably handles thousands of writes/sec and tens of thousands of reads/sec with replicas; managed Postgres runs into the tens of terabytes. Reach past it when you need multi-region writes, a partition-tolerant write path, or scale a single primary genuinely can't carry — not because relational feels old-fashioned.

**Key-value (DynamoDB, Redis, Cassandra-as-KV)** — get/put on a known key, single-digit-millisecond, horizontally scalable to effectively unlimited size. Perfect for a URL shortener's \`code -> url\` lookup, session storage, feed caches. The catch: querying by anything other than the key requires a second index you build and maintain yourself.

**Document (MongoDB, DynamoDB with rich items)** — a key-value store that indexes inside the value. Good when each record is self-contained and read whole (a listing, a user profile, a CMS entry) and the schema varies by record. Bad when you need to join, or when one document becomes a contention hotspot.

**Wide-column (Cassandra, HBase, Bigtable)** — the tool for enormous write-heavy, time-ordered, range-scanned data: chat message history, activity feeds, event logs. Partition key chooses the node, clustering key sorts within the partition, so \`(chat_id, timestamp)\` gives you "last 50 messages in this chat" as a single sequential read. Cost: you model the table per query, and joins don't exist.

**Time-series (Prometheus, InfluxDB, TimescaleDB, ClickHouse)** — append-only numeric streams keyed by timestamp and labels, with delta/dictionary compression that gets metrics down to ~1–2 bytes per point, plus downsampling and retention tiers. If your data is "value at time with tags," don't hand-roll it on relational.

**Blob / object storage (S3, GCS)** — bytes by key, eleven nines of durability, effectively unlimited, cheap, and *not* a database: no transactions, no queries, per-object latency in the tens of milliseconds. Every media system pairs blob storage for the bytes with a relational or KV store for the metadata. Never put multi-megabyte payloads in your primary database.

**Graph (Neo4j) and vector (pgvector, Pinecone, FAISS)** — narrow tools for real needs. Graph databases pay off for multi-hop traversal ("friends of friends who like X"); one- or two-hop social lookups are perfectly fine in a relational table. Vector indexes do approximate nearest-neighbor over embeddings — see [search and ranking](/library/search-and-ranking).

**Analytical / columnar (ClickHouse, BigQuery, Snowflake)** — for scans and aggregates over billions of rows. Column layout means a query touching 3 of 200 columns reads 1.5% of the bytes. This is where dashboards and reporting belong; keep them off your transactional primary.

## Metadata plus bytes: the pattern to memorize

\`\`\`text
client -> presigned PUT -> object storage        (the bytes)
       -> POST /files   -> relational/KV store   (path, size, owner, version, checksum)
\`\`\`

Dropbox, Instagram, YouTube, and Google Docs all reduce to some version of this split. Say it early and you've collapsed a third of the design.

## Polyglot without hand-waving

Multiple stores mean multiple sources of truth unless you designate one. State it explicitly: "Postgres is the source of truth for bookings; Elasticsearch is a derived index rebuilt from the change stream and may lag by seconds." Then the reader knows what to do when they disagree — rebuild the derived one. Getting data between them is the [outbox pattern](/library/distributed-transactions) or change data capture, never dual writes.

> **In an interview:** justify each store with the query it serves and the number that makes it necessary. "Postgres for bookings because they need a transaction; Redis for the availability cache because search is 100:1 read-heavy; S3 for photos because 4 Gbps of egress can't come from app servers" is a design. "I'd use NoSQL for scalability" is not an answer.`,
  },
  {
    id: "sharding-and-partitioning",
    section: "data",
    title: "Sharding & Partitioning",
    blurb:
      "Hash, range, and directory partitioning, consistent hashing, hot partitions, and how to reshard without downtime.",
    appliesTo: ["kv-store", "distributed-cache", "message-queue", "realtime-chat", "twitter-x"],
    content: `## Split by key, and choose the key carefully

Sharding is horizontal partitioning: each row lives on exactly one shard, chosen by a **partition key**. Everything good and everything painful about a sharded system traces back to that key choice, so make it deliberately and say why.

**Hash partitioning** — \`shard = hash(key) % N\`. Even distribution, no hotspots for well-distributed keys, but range queries must fan out to every shard. Default for user-keyed data.

**Range partitioning** — shard by key ranges (\`A–F\`, \`G–M\`) or by time (one partition per day). Range scans are cheap and sequential; the risk is a skewed workload. Time-partitioned data has a guaranteed hot partition: *today*. Metrics systems accept this because it also makes retention a partition drop instead of a mass delete.

**Directory / lookup partitioning** — an explicit key→shard map in a coordination service. Maximum flexibility (move any tenant anywhere), at the cost of a lookup on the read path and a component that must not become a single point of failure. This is how per-tenant assignment usually works.

**Composite keys** are where the craft is. Wide-column stores split the key: the **partition key** picks the node, the **clustering key** sorts within it. \`(chat_id, timestamp)\` colocates a conversation and keeps it sorted, so "the last 50 messages" is one sequential read on one node.

## Consistent hashing, and why modulo fails

With \`hash(key) % N\`, changing N remaps nearly every key — for a cache that means a near-total miss storm; for a database it means moving almost all your data.

**Consistent hashing** places both nodes and keys on a hash ring; a key belongs to the next node clockwise. Adding a node only steals keys from its immediate neighbor, so roughly **1/N of keys move** instead of all of them. Real implementations give each physical node many **virtual nodes** (100–256 is typical) so load evens out and a departing node's share is spread across all survivors rather than dumped on one.

The alternative, used by Cassandra and Kafka, is a **fixed large number of logical partitions** (say 1024) mapped onto physical nodes. Rebalancing moves whole partitions, and the mapping stays small enough to gossip. Simpler to operate; the partition count becomes a semi-permanent decision.

## Hot partitions are the real failure mode

Even distribution of *keys* does not mean even distribution of *traffic*. A celebrity account, a flash-sale event, a single viral video — one key can carry more load than every other key combined. Fixes, in escalating order:

- **Read replicas of the hot partition** — solves hot reads, not hot writes.
- **Cache in front** — moves the heat to a cache tier built for it (see [caching](/library/caching) for hot-key handling).
- **Key salting** — write to \`hot_key#0\`..\`hot_key#15\` and merge on read. Turns one hot partition into 16 warm ones. Good for counters, bad for anything needing a single ordered view.
- **Dedicated handling** — Twitter's answer to celebrities: skip fan-out on write entirely for accounts above a follower threshold and merge their tweets at read time. A special case, deliberately introduced, in exactly one place.

## Cross-shard operations get expensive

Once sharded, you lose the two things you took for granted:

- **Joins** — either denormalize so the join is unnecessary, or fan out and join in the application.
- **Transactions** — a write spanning shards needs two-phase commit or a [saga](/library/distributed-transactions). The cheaper move is choosing a partition key such that transactional writes stay inside one shard (all of a user's data on one shard; all of an event's seats on one shard).

Fan-out reads also inherit **tail latency amplification**: query 100 shards and your response time is the slowest of 100, so a p99 of 50ms per shard produces a p99 that is much worse overall. Limit fan-out width, hedge requests, or return partial results.

## Resharding without downtime

You will get the shard count wrong. The standard playbook:

1. **Double-write** to the old and new topology (or replicate via change data capture).
2. **Backfill** historical data into the new layout.
3. **Verify** with a row-count and checksum comparison.
4. **Shift reads** gradually — 1%, 10%, 100% — with a fast rollback.
5. **Stop double-writing** and drop the old copy.

Two ways to make this rare: start with far more logical partitions than nodes (they're cheap to move, expensive to create), or split by tenant so growth means adding tenants to new shards rather than resplitting old ones.

> **In an interview:** name the partition key, then immediately name the query it *breaks* and how you handle that query. Everyone can say "shard by user_id"; the signal is in knowing that it makes "all messages in a chat" a fan-out and having an answer.`,
  },
  {
    id: "replication-and-quorums",
    section: "data",
    title: "Replication, Failover & Quorums",
    blurb:
      "Leader-follower, multi-leader, and leaderless replication; sync vs async tradeoffs; failover, split brain, and lost writes.",
    appliesTo: ["kv-store", "distributed-cache", "message-queue", "payment-system", "metrics-monitoring"],
    content: `## Three topologies, three failure profiles

Replication buys durability (survive a lost disk), availability (survive a lost node), read scale (spread reads), and locality (serve from a nearby region). Which of those you get depends on the topology.

**Leader-follower (single-leader).** All writes to one node, which ships its log to followers. No write conflicts by construction — the leader defines the order. Reads scale by adding followers, and you inherit **replication lag**. Failure of the leader requires failover. This is Postgres, MySQL, MongoDB, and most relational deployments, and it should be your default.

**Multi-leader.** Several nodes accept writes and replicate to each other, typically one leader per region. Local write latency and survival of a region outage, paid for with **write conflicts** that no amount of care can prevent — two regions accepting conflicting writes to the same row is now a normal event you must resolve (last-write-wins, application merge, or CRDTs). Only take this on when local write latency or regional independence is a stated requirement.

**Leaderless (Dynamo-style).** Any replica accepts any write; clients (or a coordinator) write to W replicas and read from R. This is Cassandra and DynamoDB. High availability, tunable consistency, and repair machinery instead of failover: **hinted handoff** (a live node holds writes for a downed peer and delivers them on recovery), **read repair** (fix stale replicas on the read path), and **anti-entropy** (background Merkle-tree comparison).

## Synchronous vs asynchronous, and the semi-sync compromise

- **Synchronous** — the leader waits for follower acknowledgement. No committed write is ever lost, but write latency includes the slowest replica, and a single sick follower stalls all writes.
- **Asynchronous** — the leader acknowledges immediately and ships the log in the background. Fast, always available for writes, and it **can lose acknowledged writes** if the leader dies before shipping them.
- **Semi-synchronous** — wait for *one* follower (any one), stream to the rest asynchronously. One replica is always current, so failover is safe, and no single slow follower blocks progress. This is the pragmatic default, and it's the answer that shows you've thought about it.

For a payment ledger, argue for synchronous or quorum commit and take the latency. For metrics ingestion, async — losing the last two seconds of CPU samples during a rare failover is cheaper than slowing every write.

## Failover, and the ways it goes wrong

Automatic failover is: detect the leader is gone (heartbeat timeout), elect a new one (highest log position wins — see [consensus](/library/consensus-and-coordination)), redirect clients, and reconcile the old leader when it returns. Four failure modes to name:

- **Split brain** — the old leader hasn't noticed it was replaced and keeps accepting writes. Prevented with fencing: a monotonically increasing term/epoch number that storage and clients refuse to accept writes below. STONITH ("shoot the other node in the head") is the blunt instrument version.
- **Lost writes** — with async replication, writes the old leader acknowledged but never shipped are simply gone. If the discarded writes were also used elsewhere (an id already handed to a downstream system), you now have dangling references.
- **Timeout tuning** — too short and load spikes trigger unnecessary failovers, which cause more load; too long and you're down longer than you needed to be. 10–30 seconds is a common compromise.
- **Cascading failure** — the promoted node inherits all the read load the pool was sharing, falls over, and takes the next one with it.

## Quorums

With N replicas, W write acks, and R read replicas, **R + W > N** guarantees the read set overlaps the write set, so reads see the latest committed write. N=3/W=2/R=2 is the workhorse: any one node can be down without losing consistency or availability.

Consequences worth stating: writes survive up to N−W failures; reads survive N−R; and W=N (all replicas) means any single failure blocks writes, which is why "replicate everywhere synchronously" is not the safe choice it sounds like.

For **cross-region** setups, quorum latency is dominated by geography — a quorum spanning three continents costs 150ms+ per write. The usual answers are a quorum within one region plus async cross-region replication, or a witness/tiebreaker replica in a third region that holds no data but votes.

> **In an interview:** state the replication mode, the acknowledged-write guarantee, and the failover story together. "Semi-sync with three replicas, so a failover loses no acknowledged write; automatic promotion with fencing tokens; RPO zero, RTO about 30 seconds" answers the durability question before it's asked.`,
  },
  {
    id: "storage-engines",
    section: "data",
    title: "Storage Engines: B-Trees vs LSM Trees",
    blurb:
      "Why write-heavy systems use log-structured storage, what compaction costs, and where bloom filters and WALs fit.",
    appliesTo: ["kv-store", "message-queue", "metrics-monitoring", "distributed-cache", "web-crawler"],
    content: `## One layer below the database name

"Cassandra for writes, Postgres for transactions" is a claim about storage engines. Knowing *why* is the difference between reciting and reasoning.

## B-trees: read-optimized, update-in-place

A balanced tree of fixed-size pages (typically 4–16 KB), 3–4 levels deep for very large tables, with the upper levels cached in memory. A point lookup is a handful of page reads — usually one actual disk read. Range scans follow sibling pointers. This is Postgres, MySQL/InnoDB, and essentially every relational engine.

Writes modify pages **in place**, which means:

- A logical row update becomes a random write of a whole page — the classic **write amplification**: 100 bytes changed, 8 KB written.
- A page that fills must **split**, occasionally cascading up the tree.
- Crash safety requires a **write-ahead log**: append the change to the WAL and \`fsync\`, then apply it to pages. So every write is written at least twice.

Strengths: predictable read latency, cheap range scans, natural fit for transactions and secondary indexes. Weakness: random write throughput.

## LSM trees: write-optimized, append-only

A log-structured merge tree buffers writes in an in-memory sorted structure (the **memtable**), appends them to a WAL for durability, and when the memtable fills, flushes it to disk as an immutable sorted file (an **SSTable**). Nothing is ever modified in place. Deletes are **tombstones**; updates are just newer entries.

Writes become sequential appends, so throughput can be an order of magnitude better than a B-tree on the same hardware. This is Cassandra, RocksDB, LevelDB, HBase, and the metrics engines.

The cost is on the read path: a key may live in the memtable or in any SSTable, so a lookup checks several files. Two mitigations do the heavy lifting:

- **Bloom filters** per SSTable answer "definitely not here" in memory, cheaply skipping files. ~10 bits per key gives about a 1% false-positive rate; false negatives are impossible, which is what makes the optimization safe.
- **Sparse indexes / summaries** locate the right block within a file without scanning it.

## Compaction is the tax

Immutable files accumulate, so a background process merges them, drops shadowed values, and discards tombstones. Compaction is where LSM systems get their sharp edges:

- **Size-tiered** — merge similarly-sized files. Cheap writes, worse read amplification, and transient space amplification (you may need 2× the data size free during a big merge).
- **Leveled** — keep each level non-overlapping and roughly 10× the previous. Better reads and space usage, more write amplification (a key may be rewritten once per level).

Compaction competes with live traffic for disk and CPU, so a heavy compaction shows up as a **latency spike at p99** — one of the most common "why is Cassandra slow right now" answers. Tombstones deserve a mention too: they can't be dropped until every replica has seen them (Cassandra's \`gc_grace_seconds\`, default 10 days), so a delete-heavy workload can leave reads scanning millions of tombstones. Delete-heavy access patterns are an argument against LSM, or an argument for TTL-based partition drops instead of row deletes.

## Choosing, in one line each

- Read-heavy, transactional, range queries, joins → **B-tree** (Postgres/MySQL).
- Write-heavy, time-ordered, mostly-append, read by recent range → **LSM** (Cassandra/RocksDB).
- Analytical scans over few columns of many rows → neither; **columnar** with per-column compression.

Two related mechanisms worth knowing by name because they show up all over system design: **write-ahead logging** (append the intent, then apply — the durability primitive behind [delivery semantics](/library/delivery-semantics) and event sourcing) and **MVCC** (keep multiple row versions so readers never block writers — the basis of snapshot isolation in [concurrency control](/library/concurrency-control)).

> **In an interview:** you rarely design a storage engine, but you often justify a database. "1M location writes/sec is a sequential-append workload, so an LSM engine; I'll accept compaction-driven p99 spikes and keep reads to recent ranges" is exactly the level of depth this earns you.`,
  },
  {
    id: "indexes",
    section: "data",
    title: "Indexes & Derived Views",
    blurb:
      "Secondary indexes local vs global, covering indexes, denormalization, materialized views, and keeping derived data honest.",
    appliesTo: ["qa-platform", "hotel-booking", "typeahead-search", "instagram-feed", "twitter-x"],
    content: `## An index is a derived copy of your data

Every index, denormalized column, cache, and search cluster is the same thing: a second representation of the truth, optimized for one query, that must be kept in sync. Framing them as one concept is what keeps a design coherent — you make the same three decisions each time (how it's updated, how stale it may be, how it's rebuilt).

## Index mechanics worth knowing

- **Composite indexes are ordered and prefix-only.** An index on \`(city, price, rating)\` serves \`WHERE city=?\`, \`WHERE city=? AND price<?\`, and \`ORDER BY price\` within a city — but nothing that starts at \`price\`. Column order is the design.
- **Covering indexes** include every column a query needs, so the engine answers from the index and never touches the row. Often a 10× win on a hot read path.
- **Write cost is real.** Each index is another structure to update per write, so five indexes make writes several times more expensive. Indexes are not free reads; they are reads paid for with writes.
- **Cardinality decides usefulness.** An index on a boolean column that's 90% \`false\` usually won't be used. Partial indexes (\`WHERE status = 'pending'\`) are the fix when the interesting rows are a small minority.

## Local vs global secondary indexes

In a sharded system, indexing a non-partition-key column forces a choice:

**Local (document-partitioned).** Each shard indexes only its own rows. Writes stay local and cheap — one shard, one transaction. Reads by the indexed field must **scatter-gather across every shard** and merge. Good when queries usually carry the partition key too.

**Global (term-partitioned).** The index is itself partitioned, by the indexed term. A read hits exactly one index shard. But a write now touches its data shard *and* a different index shard, making the write cross-partition — which is why global secondary indexes are typically maintained **asynchronously** (DynamoDB GSIs are explicitly eventually consistent). You trade write consistency for read efficiency.

That is the whole tradeoff: local = cheap writes, expensive reads; global = expensive writes, cheap reads. Say which one and why.

## Denormalization and precomputation

Once sharded, joins are expensive, so you copy fields to where they're read: \`author_name\` alongside each post, \`comment_count\` on the post row, the last message preview on the conversation row. Precomputation is the same instinct at a larger grain — a home timeline assembled at write time (fan-out on write) is a materialized per-user view, and read-time merging is the alternative.

The cost is always the same: two copies that can disagree. So decide up front which is the source of truth, how the copy is updated, and how you rebuild it. "Rebuildable from the source of truth" is the property that makes derived data safe to be wrong occasionally.

## Keeping derived data honest

Three mechanisms, in order of preference:

1. **Change data capture / the outbox pattern** — the write transaction records the fact, and a single consumer updates every derived view from that ordered stream. One source of ordering, replayable, and no dual write that can half-fail. See [distributed transactions](/library/distributed-transactions).
2. **Async update via a queue** — simpler, adequate when a few seconds of lag is fine. Needs idempotent consumers because retries will re-deliver.
3. **Periodic full rebuild / reconciliation** — the backstop. Even with 1 and 2, run a job that recomputes and reports drift. Every long-lived system with derived data drifts; the ones that stay trustworthy measure it.

Avoid dual writes from application code ("write the DB, then write Elasticsearch"). The second write fails often enough to matter, and the resulting inconsistency has no natural repair path.

## Search indexes are just another derived view

An inverted index in Elasticsearch, a trie for typeahead, a vector index for embeddings — all derived views with the same three questions. Their internals are in [search and ranking](/library/search-and-ranking); what matters here is that they lag, they're rebuildable, and they're not the source of truth. When search says a listing is available and the transactional store disagrees, the store wins and the product needs a graceful path for the disagreement.

> **In an interview:** whenever you add a second store, immediately say how it's fed and how it's rebuilt. Adding Elasticsearch is not the interesting claim; explaining that it's fed from the Postgres change stream, may lag two seconds, and is rebuilt from scratch on schema change is.`,
  },
];
