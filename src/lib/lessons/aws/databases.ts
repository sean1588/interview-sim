import type { Lesson } from "../types";

export const databasesLessons: Lesson[] = [
  {
    id: "aws-rds-and-aurora",
    module: "databases",
    title: "RDS & Aurora — Managed Relational",
    blurb: "what 'managed' actually removes, why Multi-AZ is not a read-scaling feature, and Aurora's trick.",
    content: `## What RDS takes off your plate

RDS runs Postgres, MySQL, MariaDB, Oracle, or SQL Server on instances you never log into. It handles provisioning, patching, automated backups, point-in-time recovery, and failover. What stays yours: schema, queries, indexes, and connection management. It is the same database you know — the operational toil is what's gone.

## Multi-AZ vs read replicas — the distinction that matters

These are constantly confused, and they solve different problems:

\`\`\`
MULTI-AZ (standby)                  READ REPLICA
synchronous replication             ASYNCHRONOUS replication
standby serves NO traffic           serves read queries
for AVAILABILITY                    for READ THROUGHPUT
automatic failover, 60-120s         manual promotion
same endpoint after failover        its own endpoint
\`\`\`

**A Multi-AZ standby does not improve performance at all.** It sits there costing you a second instance so that an AZ failure costs you 60 seconds instead of an outage. A read replica does not improve availability — it lags, and it won't be promoted automatically.

Read replicas also hand you a real correctness problem: **replica lag**. Write a row, immediately read it from a replica, and it may not be there. Anything read-your-writes must go to the primary.

## Aurora's actual innovation

Aurora is AWS's own engine, wire-compatible with Postgres and MySQL. The interesting part is that it decouples compute from storage: the storage layer is a distributed, log-structured service spanning **three AZs with six copies** of every 10 GB segment.

\`\`\`
   writer      reader      reader        all read the SAME storage
      \\          |          /
   +-------------------------------+
   |  shared distributed storage   |    6 copies / 3 AZs, self-healing
   +-------------------------------+    grows to 128 TB automatically
\`\`\`

Consequences that change designs: replicas share storage, so **lag is typically tens of milliseconds instead of seconds**; you can have 15 read replicas; failover is ~30 seconds because there's no data to copy; storage auto-grows so you never resize a volume; and backups are continuous rather than snapshot-based. **Aurora Serverless v2** scales capacity in fine-grained steps, which finally makes "a relational database that idles cheaply" real.

## Common use cases

- **Anything that wants SQL, transactions, and joins** — which is most line-of-business software. This is the default, and reaching past it should require a reason.
- **Read-heavy apps** — a writer plus replicas, with the app routing reads deliberately.
- **Aurora for high-scale OLTP** — when you want the faster failover, low lag, and 128 TB ceiling.
- **Aurora Serverless v2 for spiky or dev workloads** — capacity that follows the load instead of a fixed instance size.
- **Blue/green deployments** — RDS can stage a schema change on a synchronized copy and switch over in about a minute.

## When it's the wrong reach

- **Write throughput beyond one primary.** Every RDS/Aurora cluster has exactly one writer. Past that you shard, or you use something built to scale writes horizontally.
- **Thousands of Lambda connections.** Postgres connections are expensive; a fleet of functions will exhaust \`max_connections\`. **RDS Proxy** pools them and exists exactly for this.
- **Unpredictable single-digit-millisecond key lookups at massive scale** — that's DynamoDB's shape, not this one.

> [Replication & quorums](/library/replication-and-quorums) and [Storage engines](/library/storage-engines) in the library cover the mechanics underneath — Aurora's six-copy quorum is a direct application of both.`,
    exercises: [],
  },
  {
    id: "aws-dynamodb",
    module: "databases",
    title: "DynamoDB — Keys, Partitions & Access Patterns",
    blurb: "why you design the table from the queries backwards, and what the partition key really controls.",
    content: `## The trade

DynamoDB gives you single-digit-millisecond reads and writes at any scale, with no capacity planning if you want none. What it takes away: joins, ad-hoc queries, and the freedom to figure out your access patterns later.

**You cannot query what you didn't design a key for.** In SQL you model the data and query it however you like afterwards. Here you enumerate the queries first, then build a key schema that answers them. Getting this wrong isn't a performance problem, it's a rewrite.

## The key schema

\`\`\`
Partition key (PK)   decides WHICH physical partition   required
Sort key (SK)        orders items WITHIN a partition    optional
\`\`\`

Together they're the primary key. The partition key is hashed to pick a partition; the sort key gives you range queries *inside* one:

\`\`\`
PK = "USER#42"    SK = "ORDER#2024-01-15"     query: all orders for user 42
                  SK = "ORDER#2024-03-01"     query: orders in a date range
                  SK = "PROFILE"              a different item type, same partition
\`\`\`

That last line is **single-table design**: different entity types sharing a table so one query returns a user and their recent orders together. It looks wrong to a relational eye and it's the idiomatic pattern here.

## Hot partitions — the failure everyone hits

Throughput is spread across partitions by the partition key. A key with poor cardinality concentrates traffic:

\`\`\`
PK = "2024-03-15"    every write today lands on ONE partition  -> throttled
PK = "TENANT#acme"   one huge customer swamps their partition  -> throttled
PK = "USER#42"       millions of users, evenly spread          -> fine
\`\`\`

Adaptive capacity absorbs mild skew now, but the rule stands: **choose a partition key with high cardinality and even access.** When a naturally hot key is unavoidable, write-sharding (append a suffix \`0-9\` and query all ten) is the standard fix.

## Secondary indexes

**LSI** — same partition key, different sort key. Must be created with the table, shares its throughput, strongly consistent. **GSI** — a completely different partition key, effectively a second copy of the data maintained asynchronously. Add them any time; **eventually consistent, always**, and they have their own capacity. GSIs are how you serve a second access pattern, and they're the reason people say "DynamoDB doesn't support queries" is wrong.

## Common use cases

- **User/session/profile lookups by id** — the canonical fit.
- **High-volume event and IoT ingestion** — writes that scale without a capacity conversation.
- **Shopping carts, game state, leaderboards** — key-value with a known access shape.
- **Serverless backends** — no connection pool, IAM-native, pairs naturally with Lambda.
- **DynamoDB Streams** — a change log of every item mutation, driving Lambda for search indexing, cache invalidation, or an outbox.
- **Global Tables** — multi-region active-active with last-writer-wins, when you need low-latency writes on two continents.

## When it's the wrong reach

- **You don't know the access patterns yet.** An early product whose queries change weekly is exactly what a relational database is for.
- **Ad-hoc analytics, reporting, joins.** A Scan reads the whole table and costs accordingly.
- **Complex transactions across many items.** TransactWriteItems exists but caps at 100 items and costs double.
- **Big items.** The 400 KB item limit is a hard wall; large blobs go to S3 with the key stored here.

> [Datastore selection](/library/datastore-selection) and [Sharding & partitioning](/library/sharding-and-partitioning) in the library are the interview-facing versions — this lesson is about what the partition key does to your throughput in practice.`,
    exercises: [],
  },
  {
    id: "aws-elasticache",
    module: "databases",
    title: "ElastiCache — Redis & Memcached",
    blurb: "an in-memory tier you now own, plus the two failure modes caches invent.",
    content: `## What you're actually adding

ElastiCache is managed Redis (now also Valkey) or Memcached: microsecond reads from RAM, sitting between your application and a slower store. The honest framing is that a cache is **a second database with no durability guarantees, its own failure modes, and a consistency problem you just created**. Worth it constantly — but it isn't free.

## Redis or Memcached

\`\`\`
                 Redis / Valkey                    Memcached
data types       strings, lists, sets, sorted      strings only
                 sets, hashes, streams, geo
persistence      optional snapshot/AOF             none
replication      yes, with automatic failover      none
transactions     yes (MULTI, Lua)                  no
scaling          replicas + cluster-mode shards    add nodes, client-side sharding
\`\`\`

**Redis unless you have a specific reason.** Memcached's remaining niche is a pure, multi-threaded, horizontally-sharded object cache where losing the whole thing is genuinely fine.

## Common use cases

- **Read-through cache in front of RDS** — the default. Check cache, miss, query the database, populate, return.
- **Session store** — shared sessions across a stateless fleet, so any instance can serve any user.
- **Rate limiting and counters** — atomic \`INCR\` with a TTL is the cleanest token-bucket you'll write.
- **Leaderboards and ranked feeds** — sorted sets do this in one data structure, which is why game backends reach for Redis specifically.
- **Distributed locks** — with the caveat that a Redis lock is an optimization, not a correctness guarantee; anything requiring real mutual exclusion needs a fencing token.
- **Pub/sub and Streams** — lightweight fan-out inside a system, when SNS/Kinesis would be heavier than needed.
- **Absorbing a hot key** — a single row read ten thousand times a second belongs in memory, not in your database's buffer cache.

## The two failure modes caches invent

**Stale data.** Every cached value is a claim about the past. The fix is a deliberate invalidation strategy: a TTL (simple, bounded staleness), write-through (update both, more code, tighter), or event-driven invalidation from a DynamoDB stream or CDC feed. Pick one explicitly — "we'll invalidate it somewhere" is how the subtle bugs get in.

**Stampede.** A popular key expires and a thousand concurrent requests all miss and all hit the database at once. Standard mitigations: jitter the TTLs so they don't expire together, let one request rebuild while others serve stale, or refresh proactively before expiry. A cold cache after a restart is the same event at maximum scale — which is why **warming matters**: a fleet that comes back with an empty cache can take down the database it was protecting.

## When it's the wrong reach

- **When it's a bandage over a missing index.** Fix the query first. Caching a full table scan hides the problem until the cache is cold at 3am.
- **When the data must be right.** A cache is eventually consistent by construction. Balances and inventory counts need the source of truth.
- **When write-heavy.** Caches help reads. A workload dominated by writes gains almost nothing.
- **When DAX or a built-in would do.** DynamoDB has DAX; CloudFront caches HTTP. Reach for a general cache when those don't fit.

> [Caching](/library/caching) in the library covers the strategy vocabulary — cache-aside, write-through, TTL vs invalidation — that this lesson applies to the AWS service.`,
    exercises: [],
  },
  {
    id: "aws-analytics",
    module: "databases",
    title: "Redshift, Athena & the Analytics Path",
    blurb: "why OLAP is a different machine, and the three ways AWS queries a data lake.",
    content: `## OLTP and OLAP are different machines

Your application database answers "give me order 4471" thousands of times a second. Analytics asks "sum revenue by region for the last three years" — touching a hundred million rows, once. Row storage is right for the first and terrible for the second.

\`\`\`
ROW store (RDS)            COLUMNAR (Redshift, Parquet)
[id|name|region|amount]    [id.....][name....][region..][amount..]
reads whole rows           reads ONLY the columns you asked for
great for a single order   10-100x less I/O for an aggregate
                           compresses far better (like values adjacent)
\`\`\`

That's the entire reason a separate analytics stack exists. **Never run heavy analytics against your production OLTP database** — the scan evicts the buffer cache and your application's latency goes with it.

## The three query options

\`\`\`
Athena       serverless SQL directly over S3    per TB scanned      ad-hoc, occasional
Redshift     provisioned columnar warehouse     per node-hour       heavy, constant BI
Redshift     Serverless                         per RPU-second      bursty warehouse work
   + Spectrum: Redshift querying S3 in place, joined against local tables
\`\`\`

**Athena** is the low-commitment default: no cluster, point it at S3, write SQL. You pay ~$5 per terabyte scanned, which makes file layout the whole game — **partition by date and store Parquet**, and a query that scanned 1 TB scans 10 GB and costs 1% as much. Columnar format plus partition pruning is not an optimization here, it's the difference between $5 and $0.05 per query.

**Redshift** earns its keep when a BI tool is hitting the same data all day, when you need sub-second dashboards, or when queries are complex enough to want real distribution keys and sort keys.

## The pipeline shape

\`\`\`
sources  ->  raw in S3   ->  transform  ->  curated Parquet in S3  ->  Athena / Redshift
             (Kinesis        (Glue, EMR,      partitioned by date        |
              Firehose,       Lambda)         + Glue Data Catalog        BI, notebooks
              DMS, CDC)                       (the schema registry)
\`\`\`

**Glue Data Catalog** is the piece that ties it together: it's the shared metadata store — table definitions and partitions — that Athena, Redshift Spectrum, EMR, and Spark all read. Without it, every tool needs its own schema.

## Common use cases

- **Ad-hoc log analysis** — ALB, CloudFront, and VPC flow logs land in S3 already; Athena queries them with no infrastructure at all. This is the single highest-value, lowest-effort use.
- **BI dashboards** — Redshift behind QuickSight, Tableau, or Looker.
- **Product analytics and funnels** — events into S3 via Firehose, transformed, queried.
- **Cost and security forensics** — CloudTrail and Cost and Usage Reports are just Parquet in S3; Athena is how you actually ask them questions.
- **ML feature preparation** — large-scale aggregation before training.

## When it's the wrong reach

- **Anything user-facing.** Athena queries take seconds to minutes; Redshift is optimized for throughput, not concurrency. A dashboard a customer loads should read from a precomputed table in RDS or DynamoDB.
- **Small data.** A few gigabytes doesn't need a warehouse — Postgres will do it fine, and you skip a whole pipeline.
- **High-frequency single-row lookups.** Columnar storage is exactly wrong for that shape.
- **Redshift when Athena would do.** A provisioned cluster running a few queries a day is expensive idle time; that's what Serverless and Athena are for.`,
    exercises: [],
  },
];
