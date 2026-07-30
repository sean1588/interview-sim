import type { Article } from "./types";

export const foundationArticles: Article[] = [
  {
    id: "requirements-and-estimation",
    section: "foundations",
    title: "Requirements & Back-of-the-Envelope Math",
    blurb:
      "Turn a vague prompt into scoped requirements, then size it: QPS, storage, bandwidth, and the latency numbers worth memorizing.",
    appliesTo: ["url-shortener", "twitter-x", "instagram-feed", "video-streaming", "metrics-monitoring"],
    content: `## The prompt is deliberately underspecified

"Design Twitter" is not a question, it's an invitation to negotiate one. Spend the first few minutes converting it into a contract you can actually design against, split in two:

**Functional requirements** — the flows you will build. Name three or four and explicitly park the rest. For a Twitter-shaped prompt: *post a tweet*, *read a home timeline*, *follow a user*. Parked: DMs, search, ads, notifications. Saying "I'm going to leave search out unless you want it" is a strength, not a dodge — it shows you know the system is bigger than the whiteboard.

**Non-functional requirements** — the properties that decide the architecture:

- **Scale**: DAU, reads/sec, writes/sec, and the read:write ratio.
- **Latency**: a target with a percentile. "p99 under 200ms" is a requirement; "fast" is not.
- **Consistency**: is a stale read acceptable? For a timeline, yes. For a seat map at checkout, no.
- **Availability**: what does the product do when a dependency is down — fail, or degrade?
- **Durability**: what may we lose? A dropped metric point is a shrug; a dropped payment is an incident.

The read:write ratio is the single most load-bearing number you will extract. 100:1 read-heavy pushes you toward caching, replicas, and precomputation. Write-heavy pushes you toward partitioning, log-structured storage, and async aggregation.

## Sizing, in four lines of arithmetic

Round aggressively and use round constants. Nobody wants five significant figures; they want to see you reason about orders of magnitude.

\`\`\`text
seconds/day        ≈ 100,000   (86,400 — round it)
1M events/day      ≈ 12/sec
1B events/day      ≈ 12,000/sec
peak               ≈ 2–10× average   (state which multiplier you're using)
\`\`\`

Then:

- **QPS** = DAU × actions per user per day ÷ 100,000. 200M DAU each reading a timeline 5×/day ≈ 1B reads/day ≈ **10k reads/sec average**, ~50k at peak.
- **Storage/day** = writes/day × bytes/write. 500M tweets/day × 300 bytes ≈ 150 GB/day of text ≈ 55 TB/year — before replication. Multiply by your replication factor (usually 3) and add index overhead.
- **Bandwidth** = QPS × payload. 10k req/s × 50 KB responses = 500 MB/s ≈ **4 Gbps** egress. This is often what tells you a CDN is mandatory.
- **Memory for cache** = the working set. Apply 80/20: if 20% of objects serve 80% of reads, cache that 20%. 100M hot objects × 1 KB = 100 GB — a handful of cache nodes, not a heroic effort.

## Numbers every designer should know

- **L1 cache reference** — 1 ns
- **Main memory reference** — 100 ns
- **Read 1 MB sequentially from memory** — 50 µs
- **SSD random read** — 100 µs
- **Read 1 MB from SSD** — 500 µs
- **Round trip within a datacenter** — 500 µs
- **Disk seek (spinning)** — 5–10 ms
- **Read 1 MB from spinning disk** — 10–20 ms
- **Round trip US coast to coast** — 50–70 ms
- **Round trip intercontinental** — 150–250 ms

Two consequences fall out of that table and show up in nearly every design. First, **cross-region round trips dominate everything else** — a design that needs three sequential hops across an ocean cannot hit 100ms, no matter how fast your database is. Second, **memory is ~1000× faster than SSD and SSD is ~100× faster than a disk seek**, which is why caching is the first lever anyone reaches for.

Useful capacity anchors for a single commodity node: a well-tuned cache serves 100k+ ops/sec; a single relational primary handles roughly 5k–15k writes/sec before you shard; a stateless app server handles a few thousand requests/sec. Say your assumption out loud so it can be corrected cheaply.

## Where the math changes the design

Estimation is not ceremony — it should visibly force a decision:

- 4 Gbps of image egress → **CDN, not origin servers**.
- 1M location updates/sec → **not a relational primary**; a partitioned in-memory tier with periodic durable flush.
- 150 TB/year at 3× replication → **object storage plus a metadata database**, not blobs in Postgres.
- 200 QPS total → **one box and a managed database**. Say so, and don't invent a Kafka cluster to look serious.

> **In an interview:** write the numbers where the interviewer can see them, then point at one and say what it rules out. An estimate that changes no decision was wasted time — and a design with no estimates behind it is indistinguishable from a guess.`,
  },
  {
    id: "consistency-models",
    section: "foundations",
    title: "Consistency Models, CAP & PACELC",
    blurb:
      "What \"eventually consistent\" actually promises, the guarantees between strong and eventual, and how to pick one per flow.",
    appliesTo: ["kv-store", "collaborative-docs", "payment-system", "hotel-booking", "distributed-cache"],
    content: `## CAP, stated honestly

CAP says: when the network **partitions**, a distributed system must choose between staying **consistent** (refuse requests it can't confirm) and staying **available** (answer with possibly-stale data). It does *not* say you pick two of three in normal operation — partitions are the precondition for the whole tradeoff.

**PACELC** is the more useful version because it covers the 99.9% of the time when nothing is broken: *if Partitioned, choose Availability or Consistency; Else, choose Latency or Consistency.* Even with a healthy network, a linearizable read has to talk to a quorum, and a quorum costs a round trip. Consistency is not free when things are fine; it's just cheaper.

## The spectrum, strongest to weakest

- **Linearizable (strong)** — every operation appears to happen at a single instant, in real-time order. A read always sees the latest committed write. Cost: coordination on every operation, no local-only reads, and unavailability during partitions. Needed for locks, seat inventory, account balances.
- **Sequential / serializable** — everyone observes the same order of operations, though not necessarily real-time order. What a single-node database gives you inside a transaction.
- **Causal** — operations that are causally related are seen in order by everyone; unrelated ones may be seen in different orders. This is the right model for chat and comments: a reply never appears before the message it answers, but two unrelated messages may be ordered differently for different observers.
- **Read-your-writes** — you always see your own updates. The cheapest fix for "I posted and it vanished." Usually implemented by pinning a session to the primary (or to a replica known to be caught up) for a short window after a write.
- **Monotonic reads** — you never go backwards in time. Prevents the "refresh shows the comment, refresh again and it's gone" bug caused by hitting two replicas at different lag.
- **Eventual** — replicas converge if writes stop. Says nothing about *when*, and nothing about what you see in the meantime.

Real replication lag on a healthy leader-follower setup is single-digit to tens of milliseconds; under load or during a resync it can be seconds or minutes. Design for the p99 lag, not the median.

## Quorums: the dial you actually turn

With N replicas, requiring W to acknowledge a write and R to answer a read, you get strong consistency when **R + W > N** — the read and write sets must overlap by at least one node.

- N=3, W=3, R=1: fast strongly-consistent reads, but writes fail if any replica is down.
- N=3, W=2, R=2: the common default. Tolerates one failure on either side.
- N=3, W=1, R=1: lowest latency, highest availability, no overlap guarantee — eventual.

Quorums bound staleness; they do not order concurrent writes. For that you need **last-write-wins** (simple, silently loses data), **vector clocks** (detects conflicts, hands them to the application), or **CRDTs** (converges automatically for types like counters and sets).

## Pick per flow, not per system

The interview mistake is choosing one consistency model for the whole design. Real systems mix them, and naming the boundary is the answer:

- Airbnb search results: **eventual** (stale by seconds is fine). The reservation write: **strongly consistent and transactional**. The interesting part is what happens when search showed a listing that booking then rejects — you need a graceful "just booked, here are alternatives" path.
- A social feed: **eventual**, except **read-your-writes** for the author, who must see their own post immediately.
- Ad budgets: **eventual** counting for dashboards, plus a fast-enough enforcement path that campaign overspend stays within an acceptable window (and the contract says so).

> **In an interview:** when you say "eventually consistent," immediately answer the follow-up before it's asked — *how* stale, *who* notices, and what the product does about it. "Timeline reads may be up to 2 seconds stale; the author's own tweet is served read-your-writes from the primary" is a design. "It's eventually consistent" is a shrug.`,
  },
  {
    id: "apis-and-protocols",
    section: "foundations",
    title: "APIs, Protocols & Pagination",
    blurb:
      "REST vs gRPC vs GraphQL, idempotent writes, cursor pagination, presigned uploads, and long-running operations.",
    appliesTo: ["url-shortener", "payment-system", "file-storage", "llm-chat-service", "qa-platform"],
    content: `## Sketch the API before the boxes

Two or three endpoint signatures pin down your data model, your consistency needs, and your pagination story faster than any diagram. For a URL shortener:

\`\`\`text
POST /links        { url, customAlias?, expiresAt? } -> { shortCode }
GET  /{shortCode}                                    -> 302 Location
GET  /links/{code}/stats?from&to&granularity         -> { series[] }
\`\`\`

That tiny block already exposes the real questions: the redirect must be cacheable and single-digit-millisecond; \`customAlias\` needs a uniqueness check on the write path; and the stats endpoint is a completely different (analytical, aggregated) workload from the redirect. Three lines, three subsystems.

## Choosing a protocol

- **REST/JSON over HTTP** — the default for public and browser-facing APIs. Cacheable by CDNs and proxies out of the box (a real advantage, not a technicality), universally debuggable, verbose on the wire.
- **gRPC / protobuf** — the default for internal service-to-service calls. Compact binary encoding, generated clients, HTTP/2 multiplexing, native bidirectional streaming, schema evolution. Awkward from browsers without a proxy layer.
- **GraphQL** — good when many heterogeneous clients need different slices of a graph and you want to stop shipping one bespoke endpoint per screen. You inherit query-cost control, N+1 resolution, and much weaker HTTP caching as the price.

Long-poll, SSE, and WebSockets are covered under [real-time delivery](/library/realtime-delivery) — the short version is that server-to-client push needs its own decision, and it usually isn't WebSockets by default.

## Idempotency is an API concern

Any write that can be retried needs a client-supplied **idempotency key**, because the client cannot distinguish "the request failed" from "the response was lost." Store the key with the result, return the stored result on replay, and keep it long enough to cover client retry windows (24 hours is typical, longer for payments).

\`\`\`text
POST /payments
Idempotency-Key: 8f1e-...-c39a
{ amount: 4200, currency: "usd", source: "card_xyz" }
\`\`\`

Reads are naturally idempotent; \`PUT\` and \`DELETE\` usually are by construction; \`POST\` is where the bugs live. See [delivery semantics](/library/delivery-semantics) for the same problem one layer down, in the message pipeline.

## Pagination: cursors, not offsets

\`LIMIT 20 OFFSET 10000\` makes the database walk and discard 10,000 rows, and it silently skips or duplicates items when the underlying list changes between pages — which, on a feed, it always does.

Use an opaque **cursor** encoding the sort key of the last item seen (\`(created_at, id)\` for a stable tiebreak):

\`\`\`text
GET /feed?limit=20                  -> { items, nextCursor: "eyJ0IjoxNzE..." }
GET /feed?limit=20&cursor=eyJ0Ijox  -> { items, nextCursor: null }
\`\`\`

Keep the cursor opaque so you can change its encoding later, and always enforce a server-side maximum \`limit\`.

## Three patterns worth naming

**Presigned upload URLs.** Never stream large files through your application servers. Issue a short-lived signed URL, let the client \`PUT\` straight to object storage, and have the storage service notify you on completion. Your API handles kilobytes of metadata instead of gigabytes of bytes.

**Long-running operations.** Video transcode, export, batch job: return \`202 Accepted\` with a job id immediately, expose \`GET /jobs/{id}\` for status, and notify via webhook or push on completion. Don't hold an HTTP connection open for four minutes.

**Streaming responses.** Token-by-token LLM output needs the first token fast and the rest incrementally — SSE over HTTP is usually enough, and it survives proxies and reconnects better than a WebSocket. Design for mid-stream failure: what does the client show when generation dies at token 300?

## Evolution and safety

Version at the boundary (\`/v1/\`) or negotiate via headers, but treat additive change as the norm: new optional fields, never a repurposed one. Publish per-endpoint rate limits and return \`429\` with \`Retry-After\` so well-behaved clients can back off correctly — see [rate limiting](/library/rate-limiting).

> **In an interview:** write the three most important request/response shapes early. It's the fastest way to prove you understand the product, and it gives the interviewer something concrete to poke at — which is how you find out what they actually want to talk about.`,
  },
];
